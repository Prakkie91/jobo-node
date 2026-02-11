import { describe, it, expect, beforeAll } from "vitest";
import { JoboClient } from "../src/client";
import { JoboAuthenticationError } from "../src/errors";
import type { Job, JobFeedResponse, JobSearchResponse } from "../src/models";

const API_KEY = process.env.JOBO_API_KEY;
const BASE_URL = process.env.JOBO_BASE_URL ?? "https://jobs-api.jobo.world";

const describeIf = (condition: boolean) =>
  condition ? describe : describe.skip;

describeIf(!!API_KEY)("Jobo Enterprise Client – Integration Tests", () => {
  let client: JoboClient;

  beforeAll(() => {
    client = new JoboClient({ apiKey: API_KEY!, baseUrl: BASE_URL });
  });

  // ── Feed ────────────────────────────────────────────────────────

  describe("getJobsFeed", () => {
    it("returns jobs", async () => {
      const response = await client.getJobsFeed({ batchSize: 5 });

      expect(response).toBeDefined();
      expect(response.jobs.length).toBeGreaterThan(0);
      expect(response.jobs.length).toBeLessThanOrEqual(5);

      const job = response.jobs[0];
      expect(job.id).toBeTruthy();
      expect(job.title).toBeTruthy();
      expect(job.description).toBeTruthy();
      expect(job.listing_url).toBeTruthy();
      expect(job.source).toBeTruthy();
      expect(job.company).toBeDefined();
      expect(job.company.name).toBeTruthy();
    });

    it("supports location filter", async () => {
      const response = await client.getJobsFeed({
        locations: [{ country: "US" }],
        batchSize: 5,
      });

      expect(response).toBeDefined();
      expect(response.jobs.length).toBeGreaterThan(0);
    });

    it("supports cursor pagination", async () => {
      const first = await client.getJobsFeed({ batchSize: 2 });
      expect(first.jobs.length).toBeGreaterThan(0);

      if (!first.has_more) return; // small dataset

      expect(first.next_cursor).toBeTruthy();

      const second = await client.getJobsFeed({
        cursor: first.next_cursor,
        batchSize: 2,
      });

      expect(second).toBeDefined();
      expect(second.jobs.length).toBeGreaterThan(0);
      expect(second.jobs[0].id).not.toBe(first.jobs[0].id);
    });
  });

  describe("iterJobsFeed", () => {
    it("yields jobs via async generator", async () => {
      const jobs: Job[] = [];
      for await (const job of client.iterJobsFeed({ batchSize: 3 })) {
        jobs.push(job);
        if (jobs.length >= 5) break;
      }
      expect(jobs.length).toBeGreaterThan(0);
    });
  });

  // ── Expired ─────────────────────────────────────────────────────

  describe("getExpiredJobIds", () => {
    it("returns response without throwing", async () => {
      const response = await client.getExpiredJobIds({
        expiredSince: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        batchSize: 5,
      });

      expect(response).toBeDefined();
      expect(response.job_ids).toBeDefined();
      expect(Array.isArray(response.job_ids)).toBe(true);
    });
  });

  // ── Search ──────────────────────────────────────────────────────

  describe("searchJobs", () => {
    it("returns results for a query", async () => {
      const response = await client.searchJobs({
        q: "software engineer",
        pageSize: 5,
      });

      expect(response).toBeDefined();
      expect(response.jobs.length).toBeGreaterThan(0);
      expect(response.total).toBeGreaterThan(0);
      expect(response.total_pages).toBeGreaterThanOrEqual(1);
      expect(response.page).toBe(1);
    });
  });

  describe("searchJobsAdvanced", () => {
    it("returns results", async () => {
      const response = await client.searchJobsAdvanced({
        queries: ["data engineer"],
        pageSize: 5,
      });

      expect(response).toBeDefined();
      expect(response.jobs.length).toBeGreaterThan(0);
      expect(response.total).toBeGreaterThan(0);
    });

    it("supports location filter", async () => {
      const response = await client.searchJobsAdvanced({
        queries: ["developer"],
        locations: ["New York"],
        pageSize: 5,
      });

      expect(response).toBeDefined();
      // May return 0 for very specific filters, but should not throw
    });
  });

  describe("iterSearchJobs", () => {
    it("yields jobs via async generator", async () => {
      const jobs: Job[] = [];
      for await (const job of client.iterSearchJobs({
        queries: ["engineer"],
        pageSize: 3,
      })) {
        jobs.push(job);
        if (jobs.length >= 5) break;
      }
      expect(jobs.length).toBeGreaterThan(0);
    });
  });

  // ── Job model validation ──────────────────────────────────────

  describe("Job model", () => {
    it("has all expected fields", async () => {
      const response = await client.searchJobs({
        q: "engineer",
        pageSize: 1,
      });
      expect(response.jobs.length).toBeGreaterThan(0);

      const job = response.jobs[0];
      expect(job.id).toBeTruthy();
      expect(job.title).toBeTruthy();
      expect(job.company).toBeDefined();
      expect(job.company.id).toBeTruthy();
      expect(job.company.name).toBeTruthy();
      expect(job.description).toBeTruthy();
      expect(job.listing_url).toBeTruthy();
      expect(job.apply_url).toBeTruthy();
      expect(job.source).toBeTruthy();
      expect(job.source_id).toBeTruthy();
      expect(job.created_at).toBeTruthy();
      expect(job.updated_at).toBeTruthy();
      expect(typeof job.is_remote).toBe("boolean");
      expect(Array.isArray(job.locations)).toBe(true);
    });
  });
});

// ── Error handling (always runs, no API key needed) ─────────────

describe("Error handling", () => {
  it("throws JoboAuthenticationError for invalid API key", async () => {
    const badClient = new JoboClient({
      apiKey: "invalid-key-12345",
      baseUrl: BASE_URL,
    });

    await expect(
      badClient.getJobsFeed({ batchSize: 1 })
    ).rejects.toThrow(JoboAuthenticationError);
  });
});
