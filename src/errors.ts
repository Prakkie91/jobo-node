/** Base error for all Jobo client errors. */
export class JoboError extends Error {
  public readonly statusCode?: number;
  public readonly detail?: string;
  public readonly responseBody?: unknown;

  constructor(
    message: string,
    options?: { statusCode?: number; detail?: string; responseBody?: unknown }
  ) {
    super(message);
    this.name = "JoboError";
    this.statusCode = options?.statusCode;
    this.detail = options?.detail;
    this.responseBody = options?.responseBody;
  }
}

/** Raised when the API key is missing or invalid (401). */
export class JoboAuthenticationError extends JoboError {
  constructor(
    message: string,
    options?: { statusCode?: number; detail?: string; responseBody?: unknown }
  ) {
    super(message, options);
    this.name = "JoboAuthenticationError";
  }
}

/** Raised when the rate limit is exceeded (429). */
export class JoboRateLimitError extends JoboError {
  public readonly retryAfter?: number;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      detail?: string;
      responseBody?: unknown;
      retryAfter?: number;
    }
  ) {
    super(message, options);
    this.name = "JoboRateLimitError";
    this.retryAfter = options?.retryAfter;
  }
}

/** Raised when the request is invalid (400). */
export class JoboValidationError extends JoboError {
  constructor(
    message: string,
    options?: { statusCode?: number; detail?: string; responseBody?: unknown }
  ) {
    super(message, options);
    this.name = "JoboValidationError";
  }
}

/** Raised when the server returns a 5xx error. */
export class JoboServerError extends JoboError {
  constructor(
    message: string,
    options?: { statusCode?: number; detail?: string; responseBody?: unknown }
  ) {
    super(message, options);
    this.name = "JoboServerError";
  }
}
