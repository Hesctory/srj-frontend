import type { DiscountCondition } from "@/types/school-fee-concept";
import { Identifier } from "react-admin";

export interface EnrollmentSummary {
  id: Identifier;
  year: string | number;
  level: string;
  grade: string;
  shift: string;
  section: string;
  state: string;
}

/** Catalog item from `GET /required-documents` — the school-owned document list. */
export interface RequiredDocument {
  id: number;
  name: string;
}

/** Per-enrollment submission state for a single required document. */
export interface EnrollmentDocument {
  requiredDocumentId: number;
  submitted: boolean;
}

/**
 * `POST /api/enrollments/preview` — what the enroll form has chosen so far.
 * Writes nothing; the create with the same inputs on the same day raises
 * exactly the charges it returns.
 */
export interface PreviewEnrollment {
  /** Null on the new-student form: the student is not registered yet. */
  studentId: number | null;
  schoolYearId: number;
  levelId: number;
  gradeId: number;
  shiftId: number;
  schoolFeeConceptId: number;
  /** Days of grace on the matrícula and cuota de ingreso, 0–2. */
  graceDays: number;
  /** Whether the pensión of the month the student starts in is billed. */
  billEnrollmentMonth: boolean;
  /**
   * The familiars typed so far, for the eligibility check when there is no
   * student yet. A blank number is not usable, so those are left out.
   */
  familiarDocuments?: FamiliarDocument[] | null;
}

export interface FamiliarDocument {
  documentTypeId: number;
  idDocumentNumber: string | null;
}

/** 1 cuota de ingreso, 2 matrícula, 3 pensión. */
export type ChargeTypeId = 1 | 2 | 3;

export interface EnrollmentPreviewCharge {
  chargeTypeId: ChargeTypeId;
  /** The pensión's month (3–12); null for the other charges. */
  month: number | null;
  description: string | null;
  /** Gross, before the discount. */
  amount: number;
  discountAmount: number;
  /** What the family will owe. */
  netAmount: number;
  discountReason: string | null;
  /** YYYY-MM-DD */
  dueDate: string;
}

export type EnrollmentWarningCode =
  | "SIBLING_NOT_FOUND"
  | "STAFF_PARENT_NOT_FOUND"
  | "LATE_ENROLLMENT"
  | "DISCOUNT_UNVERIFIED";

/** Something staff should check first. Never blocks the enrollment. */
export interface EnrollmentWarning {
  code: EnrollmentWarningCode | null;
  message: string | null;
}

/** Null `eligibility` means the concept has no condition to check. */
export interface EnrollmentEligibility {
  condition: DiscountCondition | null;
  /** True: someone qualifies. False: nobody does. Null: nothing to check. */
  met: boolean | null;
  /** The enrolled siblings, or the staff members, that qualify. */
  matches: { personId: number; fullName: string | null }[];
}

export interface EnrollmentPreview {
  charges: EnrollmentPreviewCharge[];
  warnings: EnrollmentWarning[];
  eligibility: EnrollmentEligibility | null;
  /** The API's today (YYYY-MM-DD), the day the enrollment would take. */
  enrollmentDate: string;
  /** The month whose pensión staff must decide on; null when there is no choice. */
  enrollmentMonthChoice: number | null;
}

/** What happens to money a pensión holds beyond its new price. */
export type ExcessTreatment = "REFUND" | "CREDIT";

/**
 * How the money a change gives back is settled. Required by the API only when
 * the change leaves an excess; `refundPaymentMethodId` is required with a
 * `REFUND`, and with a `CREDIT` that finds no debt to go to.
 */
export interface ExcessSettlement {
  excessTreatment: ExcessTreatment;
  refundPaymentMethodId: number | null;
}

/** `PUT /api/enrollments/:id`. `stateName` makes the request a state change. */
export interface UpdateEnrollment {
  levelId: number;
  gradeId: number;
  shiftId: number;
  sectionId: number;
  schoolFeeConceptId: number;
  previousSchool: string | null;
  documents: EnrollmentDocument[];
  stateName?: string;
  /**
   * YYYY-MM-DD, with `stateName: "Retirada"`: up to 15 days before or after
   * today, never before the enrollment. Today when omitted.
   */
  withdrawalDate?: string;
  excessTreatment?: ExcessTreatment;
  refundPaymentMethodId?: number | null;
  /** Days of grace, 0–2, on the charges a reactivation raises. */
  graceDays?: number;
  /** Whether a reactivation bills the pensión of the month it happens in. */
  billEnrollmentMonth?: boolean;
}

/** What the `PUT` answers: the enrollment, plus what it issued. */
export interface UpdatedEnrollment {
  id: Identifier;
  /**
   * The notas de crédito and boletas a change of a paid pensión issued, not
   * yet sent to SUNAT; null or empty when it issued none.
   */
  issuedDocumentIds?: number[] | null;
  /**
   * What was refunded because a `CREDIT` found no pending charge to go to (all
   * of it, or the part left over); 0 when nothing fell back.
   */
  refundedInsteadOfCredit?: number;
  /** For staff, when the change did something other than what they chose. */
  notice?: string | null;
}

export interface EnrollmentChangePreviewRequest {
  levelId: number;
  shiftId: number;
  schoolFeeConceptId: number;
}

/**
 * `IN_FORCE`: its month has started, so it keeps its price. The other two are
 * months not yet in force, whose price changes (paid or not) or stays.
 */
export type EnrollmentChangeOutcome = "REPRICED" | "UNCHANGED" | "IN_FORCE";

/** One live pensión, and what the proposed change does to it. */
export interface EnrollmentChangeLine {
  month: number;
  description: string | null;
  currentNet: number;
  /** What the pensión already holds. */
  paid: number;
  newGross: number;
  newDiscount: number;
  newNet: number;
  /** What it would hold beyond its new price. */
  excess: number;
  /** Whether giving the excess back issues a nota de crédito. */
  creditNote: boolean;
  outcome: EnrollmentChangeOutcome | null;
}

export interface EnrollmentChangePreview {
  /** The first month not yet in force; null when every month has started. */
  fromMonth: number | null;
  /** What the change would give back to the family, refunded or credited. */
  totalExcess: number;
  lines: EnrollmentChangeLine[];
  /**
   * How much of the excess a `CREDIT` could apply now, capped at
   * `totalExcess`; the rest would be refunded. An estimate: the confirm
   * computes it again.
   */
  creditable: number;
  /** Why a `CREDIT` would be refused (a 409 at confirm), or null. */
  creditRefusal: string | null;
}

export interface EnrollmentWithdrawalLine {
  month: number;
  description: string | null;
  net: number;
}

/** A paid pensión the withdrawal stops: all it holds goes back. */
export interface EnrollmentWithdrawalReversal extends EnrollmentWithdrawalLine {
  paid: number;
  /** The same as `paid`: a pensión that stops costs nothing. */
  excess: number;
  /** Whether giving it back issues a nota de crédito. */
  creditNote: boolean;
}

export interface EnrollmentWithdrawalSibling {
  enrollmentId: number;
  studentId: number;
  fullName: string | null;
  conceptName: string | null;
  /**
   * The first billable month starting after both the withdrawal and today,
   * the month a reprice made that day starts from; null if none is left.
   */
  repriceFromMonth: number | null;
}

export interface EnrollmentWithdrawalPreview {
  /** YYYY-MM-DD: the date the withdrawal takes (today when none was sent). */
  withdrawalDate: string;
  /** YYYY-MM-DD: the earliest and latest dates it may take today. */
  minDate: string;
  maxDate: string;
  /** What goes back to the family, refunded or credited. */
  totalExcess: number;
  voided: EnrollmentWithdrawalLine[];
  reversed: EnrollmentWithdrawalReversal[];
  siblings: EnrollmentWithdrawalSibling[];
  /** As in `EnrollmentChangePreview`. */
  creditable: number;
  creditRefusal: string | null;
}
