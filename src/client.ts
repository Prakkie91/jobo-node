import {
  JoboError,
  JoboAuthenticationError,
  JoboRateLimitError,
  JoboValidationError,
  JoboServerError,
} from "./errors";
import type {
  Job,
  JobFeedRequest,
  JobFeedResponse,
  ExpiredJobIdsResponse,
  JobSearchRequest,
  JobSearchResponse,
  LocationFilter,
} from "./models";

const DEFAULT_BASE_URL = "https://jobs-api.jobo.world";
const DEFAULT_TIMEOUT = 30_000;
const USER_AGENT = "jobo-node/1.0.0";

export interface JoboClientOptions {
  /** Your Jobo Enterprise API key. */
  apiKey: string;
  /** API base URL. Defaults to `https://jobs-api.jobo.world`. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30000. */
  timeout?: number;
  /** Custom fetch implementation (e.g. for testing). */
  fetch?: typeof globalThis.fetch;
}

interface GetJobsFeedOptions {
  locations?: LocationFilter[];
  sources?: string[];
  isRemote?: boolean | null;
  postedAfter?: Date | string | null;
  cursor?: string | null;
  batchSize?: number;
}

interface GetExpiredJobIdsOptions {
  expiredSince: Date | string;
  cursor?: string | null;
  batchSize?: number;
}

interface SearchJobsOptions {
  q?: string;
  location?: string;
  sources?: string;
  remote?: boolean;
  postedAfter?: Date | string;
  page?: number;
  pageSize?: number;
}

interface SearchJobsAdvancedOptions {
  queries?: string[];
  locations?: string[];
  sources?: string[];
  isRemote?: boolean | null;
  postedAfter?: Date | string | null;
  page?: number;
  pageSize?: number;
}

function toISOString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result;
}

async function handleError(response: Response): Promise<never> {
  const status = response.status;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = await response.text().catch(() => "");
  }

  const detail =
    typeof body === "object" && body !== null && "detail" in body
      ? String((body as Record<string, unknown>).detail)
      : String(body);
  const message = detail ? `HTTP ${status}: ${detail}` : `HTTP ${status}`;
  const opts = { statusCode: status, detail, responseBody: body };

  if (status === 401) throw new JoboAuthenticationError(message, opts);
  if (status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    throw new JoboRateLimitError(message, {
      ...opts,
      retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
    });
  }
  if (status === 400) throw new JoboValidationError(message, opts);
  if (status >= 500) throw new JoboServerError(message, opts);

  throw new JoboError(message, opts);
}

/**
 * Client for the Jobo Enterprise Jobs API.
 *
 * Uses the built-in `fetch` API (Node 18+, Bun, Deno, browsers).
 */
export class JoboClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(options: JoboClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this._fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  private headers(): Record<string, string> {
    return {
      "X-Api-Key": this.apiKey,
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  private async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const response = await this._fetch(url.toString(), {
      method: "GET",
      headers: this.headers(),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!response.ok) await handleError(response);
    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const response = await this._fetch(url.toString(), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!response.ok) await handleError(response);
    return response.json() as Promise<T>;
  }

  // ── Feed endpoints ──────────────────────────────────────────────

  /**
   * Fetch a single batch of jobs from the feed.
   *
   * @param options - Feed request options including filters, cursor, and batch size.
   * @returns A `JobFeedResponse` with jobs, cursor, and pagination flag.
   */
  async getJobsFeed(options: GetJobsFeedOptions = {}): Promise<JobFeedResponse> {
    const body: JobFeedRequest = stripUndefined({
      locations: options.locations,
      sources: options.sources,
      is_remote: options.isRemote,
      posted_after: options.postedAfter ? toISOString(options.postedAfter) : undefined,
      cursor: options.cursor,
      batch_size: options.batchSize ?? 1000,
    }) as JobFeedRequest;
    return this.post<JobFeedResponse>("/api/feed/jobs", body);
  }

  /**
   * Async generator that yields all jobs from the feed, handling cursor pagination automatically.
   */
  async *iterJobsFeed(
    options: Omit<GetJobsFeedOptions, "cursor"> = {}
  ): AsyncGenerator<Job, void, undefined> {
    let cursor: string | null | undefined = null;
    while (true) {
      const response = await this.getJobsFeed({ ...options, cursor });
      for (const job of response.jobs) {
        yield job;
      }
      if (!response.has_more) break;
      cursor = response.next_cursor;
    }
  }

  /**
   * Fetch a single batch of expired job IDs.
   *
   * @param options - Must include `expiredSince` (max 7 days ago).
   * @returns An `ExpiredJobIdsResponse` with job IDs and pagination info.
   */
  async getExpiredJobIds(options: GetExpiredJobIdsOptions): Promise<ExpiredJobIdsResponse> {
    const params: Record<string, string | number> = {
      expired_since: toISOString(options.expiredSince),
      batch_size: options.batchSize ?? 1000,
    };
    if (options.cursor) {
      params.cursor = options.cursor;
    }
    return this.get<ExpiredJobIdsResponse>("/api/feed/jobs/expired", params);
  }

  /**
   * Async generator that yields all expired job IDs, handling cursor pagination automatically.
   */
  async *iterExpiredJobIds(
    options: Omit<GetExpiredJobIdsOptions, "cursor">
  ): AsyncGenerator<string, void, undefined> {
    let cursor: string | null | undefined = null;
    while (true) {
      const response = await this.getExpiredJobIds({ ...options, cursor });
      for (const id of response.job_ids) {
        yield id;
      }
      if (!response.has_more) break;
      cursor = response.next_cursor;
    }
  }

  // ── Search endpoints ────────────────────────────────────────────

  /**
   * Search jobs using simple query parameters (GET /api/jobs).
   */
  async searchJobs(options: SearchJobsOptions = {}): Promise<JobSearchResponse> {
    const params: Record<string, string | number | boolean> = {};
    if (options.q) params.q = options.q;
    if (options.location) params.location = options.location;
    if (options.sources) params.sources = options.sources;
    if (options.remote !== undefined) params.remote = options.remote;
    if (options.postedAfter) params.posted_after = toISOString(options.postedAfter);
    params.page = options.page ?? 1;
    params.page_size = options.pageSize ?? 25;
    return this.get<JobSearchResponse>("/api/jobs", params);
  }

  /**
   * Search jobs using the advanced body-based endpoint (POST /api/jobs/search).
   */
  async searchJobsAdvanced(options: SearchJobsAdvancedOptions = {}): Promise<JobSearchResponse> {
    const body: JobSearchRequest = stripUndefined({
      queries: options.queries,
      locations: options.locations,
      sources: options.sources,
      is_remote: options.isRemote,
      posted_after: options.postedAfter ? toISOString(options.postedAfter) : undefined,
      page: options.page ?? 1,
      page_size: options.pageSize ?? 25,
    }) as JobSearchRequest;
    return this.post<JobSearchResponse>("/api/jobs/search", body);
  }

  /**
   * Async generator that yields all search results, handling page-based pagination automatically.
   */
  async *iterSearchJobs(
    options: Omit<SearchJobsAdvancedOptions, "page"> = {}
  ): AsyncGenerator<Job, void, undefined> {
    let page = 1;
    while (true) {
      const response = await this.searchJobsAdvanced({ ...options, page });
      for (const job of response.jobs) {
        yield job;
      }
      if (page >= response.total_pages) break;
      page++;
    }
  }
}
