import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, type FC } from "react";
import { useListFilterContext } from "react-admin";
import useCurrentSchoolYear from "@/shared/hooks/use-current-school-year";

interface SchoolYearFilterProps {
  /**
   * Read by React Admin off the element, never by this component — but it has
   * to be declared or every `<SchoolYearFilter alwaysOn />` in the app is a
   * type error. Three lists were already carrying that error silently.
   */
  alwaysOn?: boolean;
}

/**
 * List filter for the school year, defaulting to the running one.
 *
 * The "which year is current" question moved to `useCurrentSchoolYear` once the
 * catalogue needed the same answer outside a list context — this component is
 * now just the select around it.
 */
const SchoolYearFilter: FC<SchoolYearFilterProps> = () => {
  const { filterValues, setFilters, displayedFilters } = useListFilterContext();
  const { schoolYears, id: currentId } = useCurrentSchoolYear();

  const schoolYearId = filterValues.schoolYearId ?? "";

  useEffect(() => {
    if (currentId === undefined || filterValues.schoolYearId) return;
    setFilters({ ...filterValues, schoolYearId: currentId }, displayedFilters);
  }, [currentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = (value: string) => {
    const next = {
      ...filterValues,
      schoolYearId: value !== "" ? value : undefined,
    };
    setFilters(next, displayedFilters);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel>Año Escolar</InputLabel>
      <Select
        value={schoolYearId}
        label="Año Escolar"
        onChange={(e) => apply(e.target.value)}
      >
        {schoolYears.map((sy) => (
          <MenuItem key={sy.id} value={sy.id}>
            {sy.year}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SchoolYearFilter;
