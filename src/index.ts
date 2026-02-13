export { JoboClient } from "./client";
export type { JoboClientOptions } from "./client";

// Sub-clients
export { JobsFeedClient } from "./feed";
export { JobsSearchClient } from "./search";
export { LocationsClient } from "./locations";
export { AutoApplyClient } from "./auto-apply";

// Sub-client option types
export type { GetJobsFeedOptions, GetExpiredJobIdsOptions } from "./feed";
export type { SearchJobsOptions, SearchJobsAdvancedOptions } from "./search";

// Models
export type {
  // Jobs
  Job,
  JobCompany,
  JobLocation,
  JobCompensation,
  LocationFilter,
  JobFeedRequest,
  JobFeedResponse,
  ExpiredJobIdsResponse,
  JobSearchRequest,
  JobSearchResponse,
  // Geocoding
  GeocodeResultItem,
  GeocodedLocation,
  // AutoApply
  AutoApplySessionResponse,
  FieldAnswer,
  FieldAnswerFile,
  FormFieldInfo,
  FieldOption,
  FieldValidations,
  ValidationError,
  StartAutoApplySessionRequest,
  SetAutoApplyAnswersRequest,
} from "./models";

// Errors
export {
  JoboError,
  JoboAuthenticationError,
  JoboRateLimitError,
  JoboValidationError,
  JoboServerError,
} from "./errors";
