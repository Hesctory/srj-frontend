import { useMemo } from "react";
import { useGetList } from "react-admin";

/**
 * The reference lists behind the academic cascade, one hook per step.
 *
 * Each step is its own filter input, so each one asks only for the list it
 * renders instead of every list in the cascade. React Query dedupes the shared
 * ones (school years and levels are also read by the steps below them), so the
 * split costs no extra requests.
 *
 * Every hook returns the same `{ id, name }` shape, so one select component can
 * render any step — `school-years` and `sections` name their label field
 * differently and are normalised here rather than at each call site.
 */

export interface AcademicOption {
  id: string | number;
  name: string;
}

interface SchoolYear {
  id: string | number;
  year: string;
}

interface Section {
  id: string | number;
  section: string;
}

/** Stable empty array so a pending query doesn't re-render its consumers. */
const NO_OPTIONS: AcademicOption[] = [];

/** These lists are short reference tables; one page holds all of them. */
const ALL = { page: 1, perPage: 100 };

export const useSchoolYearOptions = (): AcademicOption[] => {
  const { data } = useGetList<SchoolYear>("school-years", {
    pagination: ALL,
    sort: { field: "year", order: "DESC" },
  });

  return useMemo(
    () =>
      data?.map(({ id, year }) => ({ id, name: String(year) })) ?? NO_OPTIONS,
    [data],
  );
};

export const useLevelOptions = (): AcademicOption[] => {
  const { data } = useGetList<AcademicOption>("levels", { pagination: ALL });
  return data ?? NO_OPTIONS;
};

export const useGradeOptions = (
  schoolYearId: unknown,
  levelId: unknown,
): AcademicOption[] => {
  const { data } = useGetList<AcademicOption>(
    "grades",
    {
      pagination: ALL,
      filter: { ...(schoolYearId ? { schoolYearId } : {}), levelId },
    },
    { enabled: !!levelId },
  );
  return data ?? NO_OPTIONS;
};

export const useShiftOptions = (
  schoolYearId: unknown,
  gradeId: unknown,
): AcademicOption[] => {
  const { data } = useGetList<AcademicOption>(
    "shifts",
    {
      pagination: ALL,
      filter: { ...(schoolYearId ? { schoolYearId } : {}), gradeId },
    },
    { enabled: !!gradeId },
  );
  return data ?? NO_OPTIONS;
};

export const useSectionOptions = (
  schoolYearId: unknown,
  levelId: unknown,
  gradeId: unknown,
  shiftId: unknown,
): AcademicOption[] => {
  const { data } = useGetList<Section>(
    "sections",
    {
      pagination: ALL,
      filter: {
        ...(schoolYearId ? { schoolYearId } : {}),
        ...(levelId ? { levelId } : {}),
        gradeId,
        shiftId,
      },
    },
    { enabled: !!shiftId },
  );

  return useMemo(
    () => data?.map(({ id, section }) => ({ id, name: section })) ?? NO_OPTIONS,
    [data],
  );
};
