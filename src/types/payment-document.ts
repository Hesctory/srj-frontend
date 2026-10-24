/**
 * Payment documents — `GET /api/payment-documents`,
 * `GET /api/payment-documents/{id}`, `POST /api/payment-documents`,
 * `POST /api/payment-documents/{id}/issue`.
 *
 * A comprobante is issued *from a payment* and nothing else: the series,
 * correlative, acquirer, lines and amounts are all derived server-side from the
 * `paymentId`. The only thing the client may add is the payer note — who handed
 * over the money — which is an observation on the document, not part of its
 * arithmetic.
 *
 * Two kinds of document share this one collection, and telling them apart is
 * what the whole list UI is built around:
 *
 * - **Electronic** (`FACTURA`, `BOLETA`, `NOTA_CREDITO`, `NOTA_DEBITO`) —
 *   declared to SUNAT, so they carry a `sunatStatusCode` lifecycle and,
 *   once filed, a `link` to the Nubefact page that renders them.
 * - **Internal** (`RECIBO_INTERNO`) — the school's own receipt. It is never
 *   declared, so it arrives as `NOT_APPLICABLE` with no link.
 *
 * That mapping (internal ⇔ NOT_APPLICABLE) is implied by the contract rather
 * than stated by it, and `SUNAT_STATUS_BY_SCOPE` below is where the UI relies
 * on it. If the backend ever files a recibo interno, that constant is the one
 * place to fix.
 */

export type VoucherTypeCode =
  | "FACTURA"
  | "BOLETA"
  | "NOTA_CREDITO"
  | "NOTA_DEBITO"
  | "RECIBO_INTERNO";

export type SunatStatusCode =
  | "PENDING"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "NOT_APPLICABLE";

export type PaymentForm = "contado" | "credito";

/** SUNAT Catálogo N° 06. */
export type AcquirerDocumentType = 0 | 1 | 4 | 6 | 7;

/** "YYYY-MM-DD". */
export type IsoDate = string;
/** ISO 8601 instant. */
export type IsoDateTime = string;

export interface PaymentDocument {
  id: number;
  paymentId: number | null;
  seriesId: number;
  series: string;
  correlative: string;
  /** `${series}-${correlative}` — the number people read and search by. */
  number: string;
  voucherTypeCode: VoucherTypeCode;
  voucherTypeName: string;
  sunatVoucherCode: string | null;
  paymentForm: PaymentForm | null;
  issueDate: IsoDate;
  dueDate: IsoDate | null;
  amount: number;
  acquirerDocumentType: AcquirerDocumentType | null;
  acquirerDocumentNumber: string | null;
  acquirerFullName: string | null;
  /** Nubefact page for this document. There is no PDF; `null` means no link. */
  link: string | null;
  isVoided: boolean;
  sunatStatusCode: SunatStatusCode;
  sunatStatusName: string;
  /** SUNAT's own words on a rejection. Display verbatim — never paraphrase. */
  sunatMessage: string | null;
  createdAt: IsoDateTime;
}

export interface PaymentDocumentLine {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  /** Negative on discount lines, which repeat the `obligationId` they reduce. */
  subtotal: number;
  obligationId: number | null;
}

export interface PaymentDocumentDetail {
  document: PaymentDocument;
  lines: PaymentDocumentLine[];
}

/**
 * What the dataProvider's `getOne` hands the UI: the document flattened so it
 * satisfies React Admin's "record has an id" contract, with its lines riding
 * along. See the `payment-documents` branch in `data-provider.ts`.
 */
export type PaymentDocumentRecord = PaymentDocument & {
  lines: PaymentDocumentLine[];
};

export interface PaymentDocumentFilter {
  paymentId?: number;
  seriesId?: number;
  institutionId?: number;
  voucherTypeCode?: VoucherTypeCode;
  sunatStatusCode?: SunatStatusCode[];
  issueDateFrom?: IsoDate;
  issueDateTo?: IsoDate;
  includeVoided?: boolean;
  id?: number[];
}

/**
 * Who handed over the money. Recorded as an observation on the comprobante —
 * it never changes the acquirer, which stays whoever the payment says it is.
 */
export type PayerRelationship = "MADRE" | "PADRE" | "APODERADO" | "OTRO";

export interface GeneratePaymentDocumentRequest {
  paymentId: number;
  /** Omit for no payer note at all. */
  payerRelationship?: PayerRelationship;
  /**
   * Required, and written verbatim, only when `payerRelationship` is `"OTRO"`.
   * The other three relationships name themselves, so they carry no name.
   */
  payerName?: string | null;
}

// ---- display maps ----------------------------------------------------------

export type SunatStatusColor =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info";

/**
 * Chip colour per status. The backend sends `sunatStatusName` for the label, so
 * this maps only the colour — there is no second Spanish vocabulary here.
 */
export const SUNAT_STATUS_COLOR: Record<SunatStatusCode, SunatStatusColor> = {
  PENDING: "warning",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "error",
  NOT_APPLICABLE: "default",
};

/** The payer-note options, in the order they are offered. */
export const PAYER_RELATIONSHIPS: readonly PayerRelationship[] = [
  "MADRE",
  "PADRE",
  "APODERADO",
  "OTRO",
];

export const PAYER_RELATIONSHIP_LABEL: Record<PayerRelationship, string> = {
  MADRE: "Madre",
  PADRE: "Padre",
  APODERADO: "Apoderado",
  OTRO: "Otro",
};

/** SUNAT Catálogo N° 06, for rendering `acquirerDocumentType`. */
export const ACQUIRER_DOCUMENT_TYPE_LABEL: Record<
  AcquirerDocumentType,
  string
> = {
  0: "Sin documento",
  1: "DNI",
  4: "C.E.",
  6: "RUC",
  7: "Pasaporte",
};

/**
 * A document is only actionable while SUNAT has not accepted it: `PENDING`
 * never went out, `REJECTED` came back. Both are resolved by the same
 * `POST /{id}/issue`.
 */
export const isDeclarable = (document: PaymentDocument): boolean =>
  !document.isVoided &&
  (document.sunatStatusCode === "PENDING" ||
    document.sunatStatusCode === "REJECTED");

/** Internal receipts have no SUNAT lifecycle at all — no status, no link, no action. */
export const isInternalReceipt = (document: PaymentDocument): boolean =>
  document.sunatStatusCode === "NOT_APPLICABLE";
