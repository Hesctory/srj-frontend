/**
 * Fee concepts (Conceptos de cobro) — `api/school-fee-concepts`.
 *
 * An enrollment's concept decides every discount on its charges: the
 * matrícula discount comes off the matrícula, the pensión discount off each
 * pensión, and the cuota de ingreso is never discounted. The condition only
 * says which eligibility warning the enrollment preview runs.
 */

/** What the discount assumes about the student, checked only to warn. */
export type DiscountCondition = "SIBLING" | "STAFF_CHILD";

/** `POST /api/school-fee-concepts` and `PUT /api/school-fee-concepts/:id`. */
export interface SaveSchoolFeeConcept {
  name: string | null;
  /** Soles off the matrícula, 0–999.99. */
  enrollmentDiscount: number;
  /** Soles off each pensión, 0–999.99. */
  tuitionDiscount: number;
  discountCondition: DiscountCondition | null;
}

/** `GET /api/school-fee-concepts` (per row) and `GET …/:id`. */
export interface SchoolFeeConcept extends SaveSchoolFeeConcept {
  id: number;
}

export const DISCOUNT_CONDITION_LABELS: Record<DiscountCondition, string> = {
  SIBLING: "Tiene un hermano matriculado",
  STAFF_CHILD: "Es hijo de un trabajador",
};
