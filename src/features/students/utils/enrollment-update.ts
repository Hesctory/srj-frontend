import type { UpdateEnrollment } from "@/types/enrollment";

export const ENROLLMENT_STATE = {
  active: "Activa",
  cancelled: "Cancelada",
  withdrawn: "Retirada",
} as const;

/**
 * The fields a `PUT` takes, whatever else the values carry. Naming them keeps
 * a month, a date or a grace answer from one request out of the next.
 */
export const updateBodyOf = (
  values: Record<string, unknown>,
  extra: Partial<UpdateEnrollment> = {},
): UpdateEnrollment => ({
  levelId: values.levelId as number,
  gradeId: values.gradeId as number,
  shiftId: values.shiftId as number,
  sectionId: values.sectionId as number,
  schoolFeeConceptId: values.schoolFeeConceptId as number,
  previousSchool: (values.previousSchool as string | null) ?? null,
  documents: (values.documents as UpdateEnrollment["documents"]) ?? [],
  ...extra,
});

const PRICE_FIELDS = ["schoolFeeConceptId", "levelId", "shiftId"];

/** The concept, level and shift set the price; grade and section do not. */
export const changesPrice = (
  next: Record<string, unknown>,
  current: Record<string, unknown>,
) =>
  PRICE_FIELDS.some((field) => Number(next[field]) !== Number(current[field]));
