import { API_URL, httpClient } from "@/app/data-provider";
import type {
  ConfirmPaymentResponse,
  Payment,
  PaymentPreviewRequest,
  PaymentPreviewResponse,
} from "@/types/payment";

/**
 * The two payment endpoints, plus the one-shot receipt read.
 *
 * These stay outside the dataProvider on purpose: `enrollment-payments/preview`
 * is an RPC that writes nothing and returns a token, which none of React
 * Admin's verbs model. `httpClient` still carries the JWT and sets
 * `Content-Type`.
 *
 * The preview/confirm pair targets `POST /api/enrollment-payments/preview` and
 * `POST /api/enrollment-payments`. The older `POST /api/payment-preview` and
 * `POST /api/payments` are the deprecated predecessors (they answer with
 * `Deprecation: true` and a `Link` to these) and must not be used for new work.
 */

/** Computes the settlement plan. Writes nothing; the token dies in 5 minutes. */
export const previewPayment = async (
  request: PaymentPreviewRequest,
): Promise<PaymentPreviewResponse> => {
  const { json } = await httpClient(`${API_URL}/enrollment-payments/preview`, {
    method: "POST",
    body: JSON.stringify(request),
  });
  return json as PaymentPreviewResponse;
};

/** Redeems the token. The only request that moves money. */
export const confirmPayment = async (
  previewToken: string,
): Promise<ConfirmPaymentResponse> => {
  const { json } = await httpClient(`${API_URL}/enrollment-payments`, {
    method: "POST",
    body: JSON.stringify({ previewToken }),
  });
  return json as ConfirmPaymentResponse;
};

/** One registered payment, for re-reading a receipt. */
export const fetchPayment = async (id: number): Promise<Payment> => {
  const { json } = await httpClient(`${API_URL}/payments/${id}`);
  return json as Payment;
};

// ---- errors ----------------------------------------------------------------

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
  /** Populated on 422 only, keyed by request field. */
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
