import { HttpTransport } from "./base";
import { JoboError } from "./errors";
import type {
  AutoApplySessionResponse,
  FieldAnswer,
  StartAutoApplySessionRequest,
  SetAutoApplyAnswersRequest,
} from "./models";

/**
 * Sub-client for the Auto Apply endpoints.
 *
 * Access via `client.autoApply`.
 */
export class AutoApplyClient {
  /** @internal */
  constructor(private readonly http: HttpTransport) {}

  /**
   * Start a new auto-apply session for a job posting.
   *
   * @param applyUrl - The apply URL from the job listing.
   * @returns An `AutoApplySessionResponse` with session details and form fields.
   */
  async startSession(applyUrl: string): Promise<AutoApplySessionResponse> {
    const body: StartAutoApplySessionRequest = { apply_url: applyUrl };
    return this.http.post<AutoApplySessionResponse>("/api/auto-apply/start", body);
  }

  /**
   * Set answers for an active auto-apply session.
   *
   * @param sessionId - The session ID from startSession.
   * @param answers - List of field answers.
   * @returns An `AutoApplySessionResponse` with updated session state.
   */
  async setAnswers(
    sessionId: string,
    answers: FieldAnswer[]
  ): Promise<AutoApplySessionResponse> {
    const body: SetAutoApplyAnswersRequest = {
      session_id: sessionId,
      answers,
    };
    return this.http.post<AutoApplySessionResponse>("/api/auto-apply/set-answers", body);
  }

  /**
   * End an auto-apply session.
   *
   * @param sessionId - The session ID to end.
   * @returns True if the session was successfully ended, false if not found.
   */
  async endSession(sessionId: string): Promise<boolean> {
    try {
      await this.http.delete(`/api/auto-apply/sessions/${sessionId}`);
      return true;
    } catch (error) {
      if (error instanceof JoboError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}
