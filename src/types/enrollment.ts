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
   * The month (3–12) a new price starts from. Sent only with a change of
   * price: a month sent with nothing changed reprices too.
   */
  repriceFromMonth?: number;
  /** YYYY-MM-DD. Required with `stateName: "Retirada"`. */
  withdrawalDate?: string;
  /** Days of grace, 0–2, on the charges a reactivation raises. */
  graceDays?: number;
  /** Whether a reactivation bills the pensión of the month it happens in. */
  billEnrollmentMonth?: boolean;
}

export interface EnrollmentChangePreviewRequest {
  levelId: number;
  shiftId: number;
  schoolFeeConceptId: number;
  repriceFromMonth: number;
}

export type EnrollmentChangeOutcome =
  | "REPRICED"
  | "UNCHANGED"
  | "PAID"
  | "BEFORE_FROM_MONTH";

/** One live pensión, and what the proposed change does to it. */
export interface EnrollmentChangeLine {
  month: number;
  description: string | null;
  currentNet: number;
  newGross: number;
  newDiscount: number;
  newNet: number;
  outcome: EnrollmentChangeOutcome | null;
}

export interface EnrollmentChangePreview {
  lines: EnrollmentChangeLine[];
}

export interface EnrollmentWithdrawalLine {
  month: number;
  description: string | null;
  net: number;
}

export interface EnrollmentWithdrawalSibling {
  enrollmentId: number;
  studentId: number;
  fullName: string | null;
  conceptName: string | null;
  /** The first billable month after the withdrawal; null if none is left. */
  repriceFromMonth: number | null;
}

export interface EnrollmentWithdrawalPreview {
  voided: EnrollmentWithdrawalLine[];
  keptPaid: EnrollmentWithdrawalLine[];
  siblings: EnrollmentWithdrawalSibling[];
}
