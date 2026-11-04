import type {
  EnrollmentSummary,
  UpdateEnrollment,
  UpdatedEnrollment,
} from "@/types/enrollment";

export const ENROLLMENT_STATE = {
  active: "Activa",
  cancelled: "Cancelada",
  withdrawn: "Retirada",
} as const;

/**
 * The fields a `PUT` takes, whatever else the values carry. Naming them keeps
 * a date, a settlement or a grace answer from one request out of the next.
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

/**
 * What to tell staff after annulling an enrollment, read from a refetch of the
 * student's enrollments: the API decides, and a returning student's enrollment
 * is marked Retirada instead. `useGetList`'s `refetch` hands back the
 * provider's `{ data, total }`, whatever its type says: only the hook's own
 * `data` is unwrapped to the rows.
 */
export const annulledMessage = (
  refetched: { data?: unknown; isError: boolean },
  enrollmentId: unknown,
) => {
  // A failed refetch leaves the old rows: they cannot tell the outcome.
  if (refetched.isError)
    return "Se anularon los cobros de la matrícula, pero no se pudo leer su nuevo estado. Abre sus matrículas para verlo.";
  const rows =
    (refetched.data as { data?: EnrollmentSummary[] } | undefined)?.data ?? [];
  const state = rows.find((row) => row.id === enrollmentId)?.state;
  return state === ENROLLMENT_STATE.withdrawn
    ? "La matrícula queda como Retirada porque el estudiante tiene otra matrícula. Sus cobros salieron de Caja."
    : "Matrícula anulada. Sus cobros salieron de Caja.";
};

/**
 * A change of a paid pensión issues notas de crédito and boletas the API does
 * not send to SUNAT itself: staff send them from Comprobantes, where they wait
 * as pending. Empty when the `PUT` issued none.
 */
export const issuedDocumentsNote = (updated: unknown) => {
  const count =
    (updated as UpdatedEnrollment | undefined)?.issuedDocumentIds?.length ?? 0;
  if (count === 0) return "";
  return count === 1
    ? ". Se emitió 1 comprobante: envíalo a SUNAT desde Comprobantes."
    : `. Se emitieron ${count} comprobantes: envíalos a SUNAT desde Comprobantes.`;
};
