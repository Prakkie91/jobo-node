import { HttpTransport, toISOString, stripUndefined } from "./base";
import type {
  Job,
  JobSearchRequest,
  JobSearchResponse,
} from "./models";

export interface SearchJobsOptions {
  q?: string;
  location?: string;
  sources?: string;
  remote?: boolean;
  postedAfter?: Date | string;
  page?: number;
  pageSize?: number;
}

export interface SearchJobsAdvancedOptions {
  queries?: string[];
  locations?: string[];
  sources?: string[];
  isRemote?: boolean | null;
  postedAfter?: Date | string | null;
  page?: number;
  pageSize?: number;
}

/**
 * Sub-client for the Jobs Search endpoints.
 *
 * Access via `client.search`.
 */
export class JobsSearchClient {
  /** @internal */
  constructor(private readonly http: HttpTransport) {}

  /**
   * Search jobs using simple query parameters (GET /api/jobs).
   */
  async search(options: SearchJobsOptions = {}): Promise<JobSearchResponse> {
    const params: Record<string, string | number | boolean> = {};
    if (options.q) params.q = options.q;
    if (options.location) params.location = options.location;
    if (options.sources) params.sources = options.sources;
    if (options.remote !== undefined) params.remote = options.remote;
    if (options.postedAfter) params.posted_after = toISOString(options.postedAfter);
    params.page = options.page ?? 1;
    params.page_size = options.pageSize ?? 25;
    return this.http.get<JobSearchResponse>("/api/jobs", params);
  }

  /**
   * Search jobs using the advanced body-based endpoint (POST /api/jobs/search).
   */
  async searchAdvanced(options: SearchJobsAdvancedOptions = {}): Promise<JobSearchResponse> {
    const body: JobSearchRequest = stripUndefined({
      queries: options.queries,
      locations: options.locations,
      sources: options.sources,
      is_remote: options.isRemote,
      posted_after: options.postedAfter ? toISOString(options.postedAfter) : undefined,
      page: options.page ?? 1,
      page_size: options.pageSize ?? 25,
    }) as JobSearchRequest;
    return this.http.post<JobSearchResponse>("/api/jobs/search", body);
  }

  /**
   * Async generator that yields all search results, handling page-based pagination automatically.
   */
  async *iter(
    options: Omit<SearchJobsAdvancedOptions, "page"> = {}
  ): AsyncGenerator<Job, void, undefined> {
    let page = 1;
    while (true) {
      const response = await this.searchAdvanced({ ...options, page });
      for (const job of response.jobs) {
        yield job;
      }
      if (page >= response.total_pages) break;
      page++;
    }
  }
}
