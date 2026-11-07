/**
 * A backend refusal, flattened into what the UI reacts to.
 *
 * Every status but `422` carries `{ message }`; `422` carries
 * `{ errors: { field: message } }` and *no* message, so `HttpError.message`
 * degrades to the HTTP status text there and must not be shown. This reads
 * `error.body` instead. Backend messages are Spanish and safe to display
 * verbatim; `fallbacks` only covers the case where the body has none.
 */
export interface ApiError {
  status: number;
  /** Ready to render. */
  message: string;
  /** Populated on 422 only, keyed by request field. */
  fieldErrors: Record<string, string>;
}

export const toApiError = (
  cause: unknown,
  fallbacks: Record<number, string>,
  defaultMessage: string,
): ApiError => {
  const { status, body } = (cause ?? {}) as { status?: number; body?: unknown };
  const payload = (body ?? {}) as {
    message?: string;
    errors?: Record<string, string>;
  };
  const fieldErrors = payload.errors ?? {};
  const httpStatus = typeof status === "number" ? status : 0;

  return {
    status: httpStatus,
    message:
      payload.message ??
      Object.values(fieldErrors)[0] ??
      fallbacks[httpStatus] ??
      defaultMessage,
    fieldErrors,
  };
};
