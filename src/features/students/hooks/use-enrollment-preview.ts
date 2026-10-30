import { useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useDataProvider } from "react-admin";
import { useWatch } from "react-hook-form";
import type { AppDataProvider } from "@/app/data-provider";
import type { FamiliarDocument, PreviewEnrollment } from "@/types/enrollment";

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

export const UNANSWERED_MONTH_MESSAGE =
  "Indica si se cobra la pensión de este mes.";

/**
 * The enrollment as the create sends it: with no first-month question to
 * answer, `billEnrollmentMonth` is the API's default `true`, exactly what the
 * preview sent, instead of being left out.
 */
export const withBillDefault = <T extends Record<string, unknown>>(
  enrollment: T,
) => ({
  ...enrollment,
  billEnrollmentMonth: enrollment.billEnrollmentMonth ?? true,
});

const toId = (value: unknown) =>
  value === null || value === undefined || value === "" ? null : Number(value);

/** The familiars' documents the API can look up: a blank number is unusable. */
export const familiarDocumentsOf = (familiars: unknown): FamiliarDocument[] =>
  (Array.isArray(familiars) ? familiars : []).flatMap((familiar) => {
    const documentTypeId = toId(familiar?.documentTypeId);
    const idDocumentNumber = String(familiar?.idDocumentNumber ?? "").trim();
    return documentTypeId !== null && idDocumentNumber
      ? [{ documentTypeId, idDocumentNumber }]
      : [];
  });

interface EnrollmentChoices {
  schoolYearId?: unknown;
  levelId?: unknown;
  gradeId?: unknown;
  shiftId?: unknown;
  schoolFeeConceptId?: unknown;
  graceDays?: unknown;
  billEnrollmentMonth?: unknown;
}

/**
 * The preview request for what is chosen so far, or null until every id is
 * there: a half-filled form would only earn a 422. With a student the API
 * finds the familiars itself, so their documents only go without one. An
 * unanswered first-month question asks as `true`, the API's default.
 */
export const previewBodyOf = (
  choices: EnrollmentChoices | undefined,
  studentId: number | null,
  familiars: unknown,
): PreviewEnrollment | null => {
  const ids = {
    schoolYearId: toId(choices?.schoolYearId),
    levelId: toId(choices?.levelId),
    gradeId: toId(choices?.gradeId),
    shiftId: toId(choices?.shiftId),
    schoolFeeConceptId: toId(choices?.schoolFeeConceptId),
  };
  if (Object.values(ids).some((id) => id === null)) return null;
  return {
    ...(ids as Record<keyof typeof ids, number>),
    studentId,
    graceDays: toId(choices?.graceDays) ?? 0,
    billEnrollmentMonth:
      typeof choices?.billEnrollmentMonth === "boolean"
        ? choices.billEnrollmentMonth
        : true,
    ...(studentId === null
      ? { familiarDocuments: familiarDocumentsOf(familiars) }
      : {}),
  };
};

/**
 * The charges the enrollment would raise today, asked again whenever a choice
 * changes. The API also says whether the first-month question applies, so it
 * is asked as soon as the ids are chosen, answered or not; the API's today can
 * be pinned for testing, and the browser's date is never used for this.
 */
export const useEnrollmentPreview = (
  base: string,
  studentId: number | null,
) => {
  const dataProvider = useDataProvider<AppDataProvider>();
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
  const familiars = useWatch({ name: "familiars" });

  const body = previewBodyOf(
    {
      schoolYearId,
      levelId,
      gradeId,
      shiftId,
      schoolFeeConceptId: conceptId,
      graceDays: grace,
      billEnrollmentMonth: bill,
    },
    studentId,
    familiars,
  );

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

  const complete = body !== null;
  const choiceMonth = complete
    ? (query.data?.enrollmentMonthChoice ?? null)
    : null;
  const billEnrollmentMonth = typeof bill === "boolean" ? bill : null;

  return {
    ...query,
    complete,
    /** The month the first-month question is about, or null when it is moot. */
    choiceMonth,
    billEnrollmentMonth,
    awaitingAnswer: choiceMonth !== null && billEnrollmentMonth === null,
    /** The API has answered for exactly these choices: no question applies. */
    noQuestion:
      complete &&
      !!query.data &&
      !query.isPlaceholderData &&
      query.data.enrollmentMonthChoice === null,
  };
};

/**
 * The stop between clicking enroll and enrolling: asks the preview once more,
 * with everything typed so far, and waits for staff to read the answer.
 * Nothing here can refuse: a warning, or a check that failed, still lets them
 * go on, and the create has the last word.
 */
export const useEnrollmentConfirmation = () => {
  const dataProvider = useDataProvider<AppDataProvider>();
  const [open, setOpen] = useState(false);
  const decide = useRef<(go: boolean) => void>(() => undefined);

  const check = useMutation({
    mutationFn: (body: PreviewEnrollment) =>
      dataProvider.previewEnrollment(body),
  });

  /**
   * Opens the dialog; the promise settles on Matricular or Cancelar. If the
   * first-month question was still loading when they clicked, the answer is
   * `unanswered` instead: the form shows the question now, so it comes first.
   */
  const ask = async (
    body: PreviewEnrollment | null,
    hasMonthAnswer: boolean,
  ): Promise<{ go: boolean; unanswered: boolean }> => {
    setOpen(true);
    const preview = body
      ? await check.mutateAsync(body).catch(() => null)
      : null;
    if (preview && preview.enrollmentMonthChoice !== null && !hasMonthAnswer) {
      setOpen(false);
      return { go: false, unanswered: true };
    }
    const go = await new Promise<boolean>((resolve) => {
      decide.current = resolve;
    });
    return { go, unanswered: false };
  };

  const close = () => setOpen(false);

  return {
    ask,
    close,
    dialog: {
      open,
      checking: check.isPending,
      preview: check.data ?? null,
      error: check.error,
      onConfirm: () => decide.current(true),
      onCancel: () => {
        decide.current(false);
        setOpen(false);
      },
    },
  };
};
