import { Identifier } from "react-admin";
import type { EnrollmentWithdrawalSibling } from "@/types/enrollment";

/**
 * Row shape returned by `GET /students` (the list endpoint).
 *
 * The academic fields are the student's *current* enrollment placement, already
 * resolved to display names by the backend — lists render them directly instead
 * of joining the levels/grades/shifts/sections catalogs client-side.
 *
 * They are nullable on purpose: a student created but not yet enrolled has no
 * placement, so every list must render a placeholder rather than an empty cell.
 * The detail endpoint (`GET /students/:id`) returns the full record used by the
 * create/edit forms and is intentionally not modelled here.
 */
export interface StudentListItem {
  id: Identifier;
  fullName: string;
  dni: string;
  enrollmentCode: string | null;
  level: string | null;
  grade: string | null;
  shift: string | null;
  section: string | null;
}

/** What deleting the student would do: `GET /students/:id/deletion-preview`. */
export type StudentDeletionOutcome =
  | "DELETE"
  | "CANCEL_ENROLLMENT"
  | "WITHDRAW"
  | "KEEP"
  | "WAIT";

export type StudentDeletionReason =
  | "IN_PROCESS"
  | "STUDIED_BEFORE"
  | "HAS_PAYMENTS"
  | "HAS_ISSUED_RECEIPTS"
  | "HAS_OTHER_CHARGES";

export type StudentDeletionWarningCode =
  | "CLASSES_STARTED"
  | "OVERDUE_DEBT"
  | "SIBLING_DISCOUNT"
  | "VOIDED_PAYMENT";

/** Something staff must tick before a DELETE goes ahead. */
export interface StudentDeletionWarning {
  code: StudentDeletionWarningCode | null;
  message: string | null;
  /** The overdue debt, for `OVERDUE_DEBT`; null otherwise. */
  amount: number | null;
}

/** The same sibling a withdrawal lists, with the price to review. */
export type StudentDeletionSibling = EnrollmentWithdrawalSibling;

export interface StudentDeletionPreview {
  outcome: StudentDeletionOutcome | null;
  /** Null when the student can be deleted. */
  reason: StudentDeletionReason | null;
  message: string | null;
  /** The enrollment that CANCEL_ENROLLMENT or WITHDRAW acts on. */
  enrollmentId: number | null;
  warnings: StudentDeletionWarning[];
  /** Siblings holding a sibling discount, for `SIBLING_DISCOUNT`. */
  siblings: StudentDeletionSibling[];
}
