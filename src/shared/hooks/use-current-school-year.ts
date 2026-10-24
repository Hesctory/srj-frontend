import { useMemo } from "react";
import { useGetList } from "react-admin";

export interface SchoolYear {
  id: number;
  year: string;
}

/**
 * The school year the app should default to, resolved from the backend.
 *
 * This replaces a `CURRENT_SCHOOL_YEAR_ID` constant that was hardcoded to 8 and
 * had drifted three years out of date — the kind of bug that silently prices
 * and counts stock against the wrong year rather than failing loudly. A
 * constant is the wrong shape for a value that changes every January; matching
 * the calendar year against the years the backend actually has is right every
 * year without an edit.
 *
 * `id` is `undefined` while the list loads *and* when no row matches the
 * calendar year (the school has not opened the year yet). Callers must gate on
 * it rather than defaulting to a number: a wrong year is worse than a disabled
 * form, because nothing about the result looks wrong afterwards.
 */
export const useCurrentSchoolYear = () => {
  const { data, isLoading } = useGetList<SchoolYear>("school-years", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "year", order: "DESC" },
  });

  const schoolYears = useMemo(() => data ?? [], [data]);

  const current = useMemo(() => {
    const calendarYear = new Date().getFullYear();
    return schoolYears.find((year) => Number(year.year) === calendarYear);
  }, [schoolYears]);

  return {
    schoolYears,
    /** The row for the running calendar year, when the school has one. */
    current,
    id: current?.id,
    isLoading,
  };
};

export default useCurrentSchoolYear;
