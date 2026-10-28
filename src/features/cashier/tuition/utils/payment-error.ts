/**
 * A backend refusal, flattened into what the UI reacts to.
 *
 * Every status but `422` carries `{ message }`; `422` carries
 * `{ errors: { field: message } }` and *no* message — so `HttpError.message`
 * degrades to the HTTP status text there and must not be shown. Read
 * `error.body` instead, which is what this does. Backend messages are Spanish
 * and safe to display verbatim.
 */
export interface PaymentApiError {
  status: number;
  /** Ready to render. */
  message: string;
  /** Populated on 422 only, keyed by request field (`lines[0].commission`). */
  fieldErrors: Record<string, string>;
  /**
   * `409` — an obligation moved between preview and confirmation. The token is
   * dead and only a fresh preview can recover.
   */
  isStale: boolean;
}

const GENERIC_MESSAGE: Record<number, string> = {
  400: "No se pudo calcular el plan con los datos enviados. Revisa el monto y el medio de pago.",
  401: "Tu sesión expiró. Vuelve a iniciar sesión.",
  403: "No tienes permiso para registrar pagos.",
  404: "El plan de pago ya no es válido. Vuelve a calcularlo.",
  409: "El estado de cuenta cambió mientras revisabas el plan. Vuelve a calcularlo.",
  422: "Revisa los datos del formulario.",
};

const FALLBACK_MESSAGE =
  "No se pudo completar la operación. Inténtalo nuevamente.";

export const toPaymentError = (cause: unknown): PaymentApiError => {
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
      GENERIC_MESSAGE[httpStatus] ??
      FALLBACK_MESSAGE,
    fieldErrors,
    isStale: httpStatus === 409,
  };
};

/** The 422 key for a boleta above S/ 700 whose payer has no DNI or CE. */
export const ACQUIRER_DOCUMENT_FIELD = "acquirerDocument";

/**
 * The 422s that belong to one tender line, by position: `lines[1].commission`
 * → `{ 1: { commission: "…" } }`. The form shows them on the field itself.
 */
export const lineFieldErrors = (
  fieldErrors: Record<string, string>,
): Record<number, Record<string, string>> => {
  const byLine: Record<number, Record<string, string>> = {};
  Object.entries(fieldErrors).forEach(([key, message]) => {
    const match = /^lines\[(\d+)\]\.(\w+)$/.exec(key);
    if (!match) return;
    const index = Number(match[1]);
    byLine[index] = { ...byLine[index], [match[2]]: message };
  });
  return byLine;
};
