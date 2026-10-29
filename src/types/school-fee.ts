/**
 * School fees (Tarifas) — `api/school-fees`.
 *
 * One row per school year, level, shift and fee concept: a second row for the
 * same four is refused (409). The matrícula may not exceed the same row's
 * pensión (422 on `enrollmentPrice`). Each amount runs from 0 to 999.99 with
 * at most two decimals. Rows cannot be deleted.
 */

/** `POST /api/school-fees` and `PUT /api/school-fees/:id`. */
export interface SaveSchoolFee {
  schoolYearId: number;
  levelId: number;
  shiftId: number;
  schoolFeeConceptId: number;
  /** The matrícula. */
  enrollmentPrice: number;
  /** The monthly pensión. */
  tuitionCost: number;
  /** The cuota de ingreso. */
  registrationFee: number;
  description: string | null;
}

/** `GET /api/school-fees` (per row) and `GET /api/school-fees/:id`. */
export interface SchoolFee extends SaveSchoolFee {
  id: number;
  /** The calendar year, e.g. 2027. */
  schoolYear: number;
  levelName: string | null;
  shiftName: string | null;
  schoolFeeConceptName: string | null;
}

export const SCHOOL_FEE_AMOUNT_MAX = 999.99;
