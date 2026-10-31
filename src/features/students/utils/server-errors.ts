import { HttpError } from "react-admin";

/** A 422's `{ errors: { field: message } }`, or null for any other failure. */
export const fieldErrors = (error: unknown): Record<string, string> | null =>
  error instanceof HttpError && error.status === 422
    ? ((error.body as { errors?: Record<string, string> })?.errors ?? null)
    : null;

/** The server's words for a refused request, shown as they come. */
export const serverErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const errors = fieldErrors(error);
  if (errors) return Object.values(errors).join(" ");
  if (error instanceof HttpError && error.message) return error.message;
  return fallback;
};

/**
 * Splits a 422 into the messages a form can put on its own fields and the
 * rest. A message set on a field the form does not show (`studentId`,
 * `documents[0]…`, a hidden question) would be invisible, so those are
 * returned as text to notify instead.
 */
export const splitFieldErrors = (
  errors: Record<string, string>,
  shown: (field: string) => boolean,
) => {
  const onFields: Record<string, string> = {};
  const elsewhere: string[] = [];
  for (const [field, message] of Object.entries(errors)) {
    if (shown(field)) onFields[field] = message;
    else elsewhere.push(message);
  }
  return { onFields, elsewhere: elsewhere.join(" ") };
};
