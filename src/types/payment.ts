/**
 * Enrollment payments — `POST /api/enrollment-payments/preview`,
 * `POST /api/enrollment-payments`, `GET /api/payments/pending-documents`,
 * `GET /api/payments/{id}`, `GET /api/payment-methods`.
 *
 * `POST /api/payment-preview` and `POST /api/payments` are the deprecated
 * predecessors of the first two and are not called anymore.
 *
 * Registering a payment takes **two requests**. The preview computes the whole
 * settlement plan server-side and returns a `previewToken`; the confirmation
 * sends that token back and nothing else. The token is single-use and expires
 * after five minutes. The client never computes an allocation, a commission or
 * a total — it renders what the plan says.
 *
 * The settle target is `obligationId`, never the charge `id` (see
 * `@/types/enrollmentCharge`). A fully waived charge has no obligation and
 * cannot be paid.
 *
 * Amounts arrive as JSON numbers with non-normalized decimals (`300`, `52.8`,
 * `310.0`). Compare and format them numerically, never as strings.
 */

/** "YYYY-MM-DD". */
export type IsoDate = string;

/** ISO 8601 instant. */
export type IsoInstant = string;

export type AllocationKind =
  | "ENROLLMENT_CHARGE"
  | "CARD_COMMISSION"
  | "ADMISSION_REFUND";

export type ObligationStatusCode =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

// ---- requests --------------------------------------------------------------

/** One tender: a single medium of payment inside one payment. */
export interface PaymentLine {
  paymentMethodId: number;
  /**
   * What the payer puts *toward the debt*. Any card commission is added on top
   * by the server and must never be included here.
   */
  amount: number;
  /** Bank or POS operation number. Belongs to the line, not to the payment. */
  reference?: string | null;
  /**
   * Card commission in soles, read off the terminal's slip and charged on top
   * of `amount`. `null` takes the server's suggestion; `0` charges none. A
   * value above 0 on a method with no card rate is refused (422).
   */
  commission?: number | null;
}

export interface PaymentPreviewRequest {
  /** Every enrollment of this student, across years. */
  studentId?: number;
  /** One enrollment; the server allocates oldest due date first. */
  enrollmentId?: number;
  /**
   * Settle these obligations instead of oldest-first. The only way to pay a
   * charge that is not yet effective.
   */
  obligationIds?: number[];
  /** Operative date. Defaults to today in Peru; the commission rate in force is read against it. */
  date?: IsoDate;
  /** At least one. */
  lines: PaymentLine[];
}

export interface ConfirmPaymentRequest {
  previewToken: string;
}

// ---- the plan --------------------------------------------------------------

export interface PaymentPlanTender {
  paymentMethodId: number;
  paymentMethodName: string;
  /** Toward the debt. */
  amount: number;
  /** `null` when this method takes no commission — then `commission` is 0. */
  rate: number | null;
  /** The commission applied: the one staff typed, or the suggestion. */
  commission: number;
  /** `amount + commission` — what the payer is charged on this tender. */
  charged: number;
  /** Reaches the account; equals `amount`. */
  netToAccount: number;
  cashAccountId: number;
  cashAccountName: string;
  reference: string | null;
  /** Rate × amount, rounded up to S/ 0.10. `null` on a method with no card rate. */
  suggestedCommission: number | null;
  /** True when `commission` is what staff typed rather than the suggestion. */
  commissionTyped: boolean;
}

export interface PaymentPlanLine {
  /**
   * `null` on `CARD_COMMISSION` lines **in a preview only** — the obligation
   * does not exist until the payment is confirmed. Always check `kind` before
   * treating this as a link to a charge.
   */
  obligationId: number | null;
  kind: AllocationKind;
  description: string;
  allocated: number;
  outstandingBefore: number;
  outstandingAfter: number;
  newStatusCode: ObligationStatusCode;
  newStatusName: string;
  dueDate: IsoDate | null;
}

/**
 * Three totals, all correct at once whenever a card is involved:
 * `amount` is charged to the payer, `baseAmount` is what reduces the debt, and
 * `totalToAccounts` is what actually lands in the school's account (the
 * acquirer keeps its commission on the way).
 */
export interface PaymentPlan {
  date: IsoDate;
  /** Reduces the debt — the sum of the `lines[].amount` sent. */
  baseAmount: number;
  commissionTotal: number;
  /** `baseAmount + commissionTotal` — what the payer is charged. */
  amount: number;
  /** Reaches the accounts; equals `baseAmount`. */
  totalToAccounts: number;
  tenders: PaymentPlanTender[];
  /** Commission lines first, then oldest due date first. */
  allocations: PaymentPlanLine[];
}

// ---- responses -------------------------------------------------------------

export interface PaymentPreviewResponse {
  previewToken: string;
  expiresAt: IsoInstant;
  plan: PaymentPlan;
}

export interface ConfirmPaymentResponse {
  id: number;
  /**
   * Whether this payment still owes a comprobante. `false` when it only settles
   * debt that was already invoiced, so no document is due. Issuing the document
   * is a separate resource — `/api/payment-documents`.
   */
  requiresPaymentDocument: boolean;
  /** The previewed plan, with every `obligationId` now populated. */
  plan: PaymentPlan;
}

/**
 * `GET /api/payments/pending-documents` — payments that should have a
 * comprobante and do not. Registering the payment and issuing its document are
 * separate requests, so a session interrupted between them leaves rows here.
 */
export interface PendingPaymentDocument {
  paymentId: number;
  date: IsoDate;
  /** What the payer was charged, commission included. */
  amount: number;
  /** `null` when the payer has no name on record. */
  payerName: string | null;
  createdAt: IsoInstant;
}

export interface PaymentTender {
  /** Money-movement id, not the payment id. */
  id: number;
  paymentMethodId: number;
  paymentMethodName: string;
  cashAccountId: number;
  cashAccountName: string;
  /** What reached the account. */
  amount: number;
  reference: string | null;
  isVoided: boolean;
}

export interface PaymentAllocation {
  /** Allocation id, not the payment id. */
  id: number;
  obligationId: number;
  description: string | null;
  amountApplied: number;
  originTypeCode: AllocationKind;
  isVoided: boolean;
}

/** `GET /api/payments/{id}`. */
export interface Payment {
  id: number;
  date: IsoDate;
  /** What the payer was charged. */
  amount: number;
  totalAllocated: number;
  /** Short of `amount` by any retained commission. */
  totalToAccounts: number;
  isVoided: boolean;
  createdAt: IsoInstant;
  createdBy: number | null;
  tenders: PaymentTender[];
  allocations: PaymentAllocation[];
}

export interface PaymentMethod {
  id: number;
  name: string;
  /** The card rate in force today; `null` when the method takes no commission. */
  rate: number | null;
}
