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

// ── Geocoding models ─────────────────────────────────────────────────

/** A resolved/geocoded location. */
export interface GeocodedLocation {
  display_name: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  country_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Response from the geocode endpoint. */
export interface GeocodeResultItem {
  input: string;
  succeeded: boolean;
  locations: GeocodedLocation[];
  method?: string | null;
  error?: string | null;
}

// ── AutoApply models ─────────────────────────────────────────────────

/** A file upload answer for auto-apply. */
export interface FieldAnswerFile {
  file_name: string;
  content_type: string;
  data: string; // Base64 encoded
}

/** A field answer for auto-apply. */
export interface FieldAnswer {
  field_id: string;
  value?: string | null;
  values?: string[] | null;
  files?: FieldAnswerFile[] | null;
}

/** Validation error from auto-apply. */
export interface ValidationError {
  field_id: string;
  message: string;
}

/** Option for a select/radio field. */
export interface FieldOption {
  value: string;
  label?: string | null;
}

/** Validations for a form field. */
export interface FieldValidations {
  min_length?: number | null;
  max_length?: number | null;
  pattern?: string | null;
}

/** Information about a form field in auto-apply. */
export interface FormFieldInfo {
  id: string;
  type: string;
  label?: string | null;
  required: boolean;
  placeholder?: string | null;
  options?: FieldOption[] | null;
  validations?: FieldValidations | null;
}

/** Response from an auto-apply session operation. */
export interface AutoApplySessionResponse {
  session_id: string;
  provider_id: string;
  provider_display_name: string;
  success: boolean;
  status: string;
  error?: string | null;
  current_url?: string | null;
  is_terminal: boolean;
  validation_errors: ValidationError[];
  fields: FormFieldInfo[];
}

/** Request to start an auto-apply session. */
export interface StartAutoApplySessionRequest {
  apply_url: string;
}

/** Request to set answers for an auto-apply session. */
export interface SetAutoApplyAnswersRequest {
  session_id: string;
  answers: FieldAnswer[];
}
