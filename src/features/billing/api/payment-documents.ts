import { API_URL, httpClient } from "@/app/data-provider";
import type {
  GeneratePaymentDocumentRequest,
  PaymentDocumentDetail,
} from "@/types/payment-document";
import type { PendingPaymentDocument } from "@/types/payment";

/**
 * The three payment-document calls React Admin cannot model.
 *
 * Reading the list and one document goes through the dataProvider like any
 * other resource. These three do not: generating a comprobante is a POST whose
 * body is a foreign key and a note rather than a record, filing it is a POST to a
 * sub-path with no body at all, and the pending-payments read is a sub-path of
 * a *different* resource. `httpClient` still carries the JWT.
 */

/**
 * Payments that owe a comprobante — the only list of payments the app can
 * reach. Deliberately asks for a generous page: this list is short by
 * definition, and if it is not, that is itself the finding.
 *
 * The endpoint accepts neither `filter` nor `sort`, so ordering happens in the
 * caller, over whatever page came back.
 */
export const fetchPendingPayments = async (
  perPage = 100,
): Promise<{ rows: PendingPaymentDocument[]; total: number }> => {
  const range = encodeURIComponent(JSON.stringify([0, perPage - 1]));
  const { json, headers } = await httpClient(
    `${API_URL}/payments/pending-documents?range=${range}`,
  );
  return {
    rows: (json ?? []) as PendingPaymentDocument[],
    total: parseContentRange(headers, (json ?? []).length),
  };
};

/**
 * How many payments are waiting, without pulling the rows.
 *
 * `range=[0,0]` asks for a single row purely so the `Content-Range` header
 * comes back with the total — the badge in the sidebar needs the count and
 * nothing else.
 */
export const fetchPendingPaymentsCount = async (): Promise<number> => {
  const range = encodeURIComponent(JSON.stringify([0, 0]));
  const { json, headers } = await httpClient(
    `${API_URL}/payments/pending-documents?range=${range}`,
  );
  return parseContentRange(headers, (json ?? []).length);
};

/**
 * Generates the comprobante for a payment. Everything but the payer note is
 * derived server-side.
 */
export const generatePaymentDocument = async (
  request: GeneratePaymentDocumentRequest,
): Promise<PaymentDocumentDetail> => {
  const { json } = await httpClient(`${API_URL}/payment-documents`, {
    method: "POST",
    body: JSON.stringify(toGenerateBody(request)),
  });
  return json as PaymentDocumentDetail;
};

/**
 * Both payer fields are optional and coupled: no relationship means no note at
 * all, and a name only travels with `OTRO`. Normalizing here rather than at the
 * call site keeps a stale name — typed under `OTRO`, then switched away from —
 * from riding along with a relationship that names itself.
 */
const toGenerateBody = ({
  paymentId,
  payerRelationship,
  payerName,
}: GeneratePaymentDocumentRequest) => {
  if (!payerRelationship) return { paymentId };
  if (payerRelationship !== "OTRO") return { paymentId, payerRelationship };
  return {
    paymentId,
    payerRelationship,
    payerName: payerName?.trim() || null,
  };
};

/** Files an already-generated document with SUNAT. Re-reads it afterwards. */
export const issuePaymentDocument = async (
  documentId: number,
): Promise<PaymentDocumentDetail> => {
  const { json } = await httpClient(
    `${API_URL}/payment-documents/${documentId}/issue`,
    { method: "POST" },
  );
  return json as PaymentDocumentDetail;
};

// ---- helpers ---------------------------------------------------------------

/**
 * `payments 0-24/37` → 37.
 *
 * Falls back to the row count so a proxy that strips the header degrades to
 * "as many as we can see" instead of showing zero.
 */
const parseContentRange = (headers: Headers | undefined, fallback: number) => {
  const raw = headers?.get("content-range");
  const total = raw ? Number(raw.split("/").pop()) : NaN;
  return Number.isFinite(total) ? total : fallback;
};

// ---- errors ----------------------------------------------------------------

/**
 * A backend refusal, flattened into what the UI reacts to. Mirrors
 * `toPaymentError` in cashier/tuition: every status but `422` carries
 * `{ message }`, and `422` carries `{ errors: { field: message } }` with no
 * message at all, so `HttpError.message` there degrades to the status text and
 * must not be shown.
 */
export interface PaymentDocumentApiError {
  status: number;
  /** Ready to render. Backend messages are Spanish and safe to display. */
  message: string;
  fieldErrors: Record<string, string>;
  /** `409` — usually "this payment already has a comprobante". */
  isConflict: boolean;
}

const GENERIC_MESSAGE: Record<number, string> = {
  400: "No se pudo completar la operación con los datos enviados.",
  401: "Tu sesión expiró. Vuelve a iniciar sesión.",
  403: "No tienes permiso para emitir comprobantes.",
  404: "El pago o el comprobante ya no existe.",
  409: "Este pago ya tiene un comprobante emitido.",
  422: "Revisa los datos del formulario.",
};

const FALLBACK_MESSAGE =
  "No se pudo completar la operación. Inténtalo nuevamente.";

export const toPaymentDocumentError = (
  cause: unknown,
): PaymentDocumentApiError => {
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
    isConflict: httpStatus === 409,
  };
};
