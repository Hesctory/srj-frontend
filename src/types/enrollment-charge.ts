/**
 * Estado de cuenta — `GET /api/enrollment-charges` (read-only).
 *
 * Subset of the backend contract kept deliberately small: only the fields the
 * cashier screen actually renders or decides on. Accounting-plan fields
 * (`accountId`/`accountCode`/`accountName`) and the raw `statusCode`/`statusName`
 * are omitted — the UI always displays the *effective* status.
 */

/** "YYYY-MM-DD". */
export type IsoDate = string;

export const ChargeType = {
  Admission: 1, // Cuota de Ingreso
  Enrollment: 2, // Matrícula
  Tuition: 3, // Mensualidad / Pensión
} as const;

export type ChargeTypeId = (typeof ChargeType)[keyof typeof ChargeType];

export type ObligationStatusCode =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE" // only ever appears in `effectiveStatusCode`
  | "CANCELLED";

/** Present on every row, settleable or not. */
interface EnrollmentChargeBase {
  /** Charge id — the row key. Not the obligation id. */
  id: number;
  studentId: number;
  enrollmentId: number;
  /** Academic year name (e.g. 2026). Display this, not `schoolYearId`. */
  year: number;

  chargeTypeId: ChargeTypeId;
  chargeTypeName: string;
  /** `null` on everything except pensión. */
  month: number | null;
  monthName: string | null;

  /** Gross list price, before discount. */
  amount: number;
  discount: number;
  discountReason: string | null;
  /** `amount - discount` — what was actually owed. */
  netAmount: number;
  /** Ready-to-display label, e.g. "Pensión Abril - 2026". */
  description: string | null;

  /** The discount cancelled the whole charge: no payment data at all. */
  isFullyWaived: boolean;
  /** Cancelled, repriced or withdrawn: kept for the record, owes nothing. */
  isChargeVoided: boolean;

  /** Past due with money still owed. Independent of the status codes. */
  isOverdue: boolean;
  daysOverdue: number;
  /** `false` on a charge scheduled for a future month: visible, not yet owed. */
  isEffective: boolean;
  /** Server date `isOverdue`/`isEffective` were evaluated against. */
  asOf: IsoDate;
}

/** The charge raised a debt: every payment field is populated. */
export interface SettleableCharge extends EnrollmentChargeBase {
  obligationId: number;
  dueDate: IsoDate;
  paidAmount: number;
  outstandingAmount: number;
  /** `true` for PAID and CANCELLED — then `outstandingAmount` is meaningless. */
  statusIsTerminal: boolean;
  /** Display this, not the stored `statusCode`. */
  effectiveStatusCode: ObligationStatusCode;
  effectiveStatusName: string;
}

/** Raised no obligation (fully waived, say): there is no payment data. */
export interface NonSettleableCharge extends EnrollmentChargeBase {
  obligationId: null;
  dueDate: null;
  paidAmount: null;
  outstandingAmount: null;
  statusIsTerminal: null;
  effectiveStatusCode: null;
  effectiveStatusName: null;
}

/**
 * Discriminated union on `obligationId` — narrowing on it gives non-null
 * payment fields for free:
 *
 *   if (charge.obligationId !== null) charge.outstandingAmount.toFixed(2);
 */
export type EnrollmentCharge = SettleableCharge | NonSettleableCharge;

export interface EnrollmentChargeFilter {
  studentId?: number;
  enrollmentId?: number;
  schoolYearId?: number;
  chargeTypeId?: ChargeTypeId;
  month?: number;
  statusCode?: ObligationStatusCode[];
  onlyOverdue?: boolean;
  onlyOutstanding?: boolean;
  dueDateFrom?: IsoDate;
  dueDateTo?: IsoDate;
  includeVoided?: boolean;
  id?: number[];
}
