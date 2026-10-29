import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { HttpError, useDataProvider, useGetOne } from "react-admin";
import { useWatch } from "react-hook-form";
import type { AppDataProvider } from "@/app/data-provider";
import type { PreviewEnrollment } from "@/types/enrollment";
import { todayLocal } from "@/utils/date";

export const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** March: the first month with a pensión. */
const FIRST_BILLED_MONTH = 3;

/**
 * The month staff must decide to bill or skip, or null when there is no
 * choice: only an enrollment taken during a billed month (March to December)
 * of the school year's own year starts part-way through the pensiones. One
 * taken before March gets all ten, whatever the choice says.
 */
export const enrollmentMonthChoice = (
  schoolYear: number | null | undefined,
  today: string = todayLocal(),
): number | null => {
  if (!schoolYear) return null;
  const [year, month] = today.split("-").map(Number);
  return year === schoolYear && month >= FIRST_BILLED_MONTH ? month : null;
};

const toId = (value: unknown) =>
  value === null || value === undefined || value === "" ? null : Number(value);

/** Every enrollment choice the preview needs, read from the form. */
export const useEnrollmentChoices = (base: string) => {
  const [schoolYearId, levelId, gradeId, shiftId, conceptId, grace, bill] =
    useWatch({
      name: [
        `${base}schoolYearId`,
        `${base}levelId`,
        `${base}gradeId`,
        `${base}shiftId`,
        `${base}schoolFeeConceptId`,
        `${base}graceDays`,
        `${base}billEnrollmentMonth`,
      ],
    });

  const { data: schoolYear } = useGetOne<{ id: number; year: number }>(
    "school-years",
    { id: schoolYearId },
    { enabled: toId(schoolYearId) !== null },
  );
  const choiceMonth = enrollmentMonthChoice(
    schoolYear ? Number(schoolYear.year) : null,
  );

  return {
    schoolYearId: toId(schoolYearId),
    levelId: toId(levelId),
    gradeId: toId(gradeId),
    shiftId: toId(shiftId),
    schoolFeeConceptId: toId(conceptId),
    graceDays: toId(grace) ?? 0,
    billEnrollmentMonth: typeof bill === "boolean" ? bill : null,
    /** The month the first-month choice is about, or null when it is moot. */
    choiceMonth,
  };
};

/** A 422's `{ errors: { field: message } }`, or null for any other failure. */
export const fieldErrors = (error: unknown): Record<string, string> | null =>
  error instanceof HttpError && error.status === 422
    ? ((error.body as { errors?: Record<string, string> })?.errors ?? null)
    : null;

/** The server's words for a refused request, shown as they come. */
export const serverErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const errors = fieldErrors(error);
  if (errors) return Object.values(errors).join(" ");
  if (error instanceof HttpError && error.message) return error.message;
  return fallback;
};

/**
 * The charges the enrollment would raise today, asked again whenever a choice
 * changes. Nothing is asked until every choice is made: a half-filled form
 * would only earn a 422.
 */
export const useEnrollmentPreview = (
  base: string,
  studentId: number | null,
) => {
  const dataProvider = useDataProvider<AppDataProvider>();
  const choices = useEnrollmentChoices(base);
  const { choiceMonth, billEnrollmentMonth, ...ids } = choices;

  const complete =
    Object.values(ids).every((value) => value !== null) &&
    (choiceMonth === null || billEnrollmentMonth !== null);

  const body = complete
    ? ({
        ...ids,
        studentId,
        // No choice to make: the server bills every month from March anyway.
        billEnrollmentMonth: billEnrollmentMonth ?? true,
      } as PreviewEnrollment)
    : null;

  const query = useQuery({
    queryKey: ["enrollments", "preview", body],
    queryFn: () => dataProvider.previewEnrollment(body as PreviewEnrollment),
    enabled: body !== null,
    // A refused preview (404 no fees, 422) answers the same on a retry.
    retry: false,
    // Keeps the last charges on screen while the next ones load, so the
    // panel does not collapse and jump on every change.
    placeholderData: keepPreviousData,
  });

  return { ...query, complete, choiceMonth };
};
