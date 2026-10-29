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

export interface EnrollmentPreview {
  charges: EnrollmentPreviewCharge[];
  warnings: EnrollmentWarning[];
}

/** Grace on the matrícula and cuota de ingreso, in days. */
export const GRACE_DAYS_MAX = 2;
