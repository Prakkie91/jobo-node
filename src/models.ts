/** Company associated with a job listing. */
export interface JobCompany {
  id: string;
  name: string;
}

/** Geographic location of a job. */
export interface JobLocation {
  location?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Compensation details for a job. */
export interface JobCompensation {
  min?: number | null;
  max?: number | null;
  currency?: string | null;
  period?: string | null;
  raw_text?: string | null;
  is_estimated: boolean;
}

/** A job listing returned by the API. */
export interface Job {
  id: string;
  title: string;
  company: JobCompany;
  description: string;
  listing_url: string;
  apply_url: string;
  locations: JobLocation[];
  compensation?: JobCompensation | null;
  employment_type?: string | null;
  workplace_type?: string | null;
  experience_level?: string | null;
  source: string;
  source_id: string;
  created_at: string;
  updated_at: string;
  date_posted?: string | null;
  valid_through?: string | null;
  is_remote: boolean;
}

/** Structured location filter for the feed endpoint. */
export interface LocationFilter {
  country?: string;
  region?: string;
  city?: string;
}

/** Request body for the jobs feed endpoint (POST /api/feed/jobs). */
export interface JobFeedRequest {
  locations?: LocationFilter[];
  sources?: string[];
  is_remote?: boolean | null;
  posted_after?: string | null;
  cursor?: string | null;
  batch_size?: number;
}

/** Response from the jobs feed endpoint. */
export interface JobFeedResponse {
  jobs: Job[];
  next_cursor?: string | null;
  has_more: boolean;
}

/** Response from the expired job IDs endpoint. */
export interface ExpiredJobIdsResponse {
  job_ids: string[];
  next_cursor?: string | null;
  has_more: boolean;
}

/** Request body for the advanced search endpoint (POST /api/jobs/search). */
export interface JobSearchRequest {
  queries?: string[];
  locations?: string[];
  sources?: string[];
  is_remote?: boolean | null;
  posted_after?: string | null;
  page?: number;
  page_size?: number;
}

/** Response from the search endpoints. */
export interface JobSearchResponse {
  jobs: Job[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
