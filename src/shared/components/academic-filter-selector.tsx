import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, useId, type ReactElement } from "react";
import { useListFilterContext } from "react-admin";
import { FILTER_DOWNSTREAM } from "@/shared/hooks/academic-cascade";
import {
  useGradeOptions,
  useLevelOptions,
  useSchoolYearOptions,
  useSectionOptions,
  useShiftOptions,
  type AcademicOption,
} from "@/shared/hooks/use-academic-filter-data";

/**
 * Año Escolar → Nivel → Grado → Turno → Sección, as five independent filter
 * inputs.
 *
 * They used to be one grouped `<Box>` handed to `<List filters>` as a single
 * element. React Admin lays out one cell per filter element, so the group had
 * to reserve room for the widest cascade it might grow into (`minWidth: 528`),
 * and that reservation showed as dead space on the filter row every time fewer
 * steps were open — which is most of the time, since a step only appears once
 * the one above it is chosen. Split up, each step is an ordinary cell and the
 * filter bar distributes them like any other filter.
 *
 * Spread `academicFilterInputs` into a `<List filters>` array; render the
 * default-exported `<AcademicFilterSelector>` where the cascade is shown
 * outside a filter bar (the cashier/tuition search panel), which lays the
 * same five inputs out on its own grid.
 *
 * Both forms read and write the surrounding list's filters through
 * `useListFilterContext`, so they must be rendered inside a list context.
 */

/**
 * RA passes `source`/`alwaysOn` to every element of `<List filters>`. The
 * cascade reads its own value out of the list context instead, so the steps
 * accept the props (otherwise the JSX below wouldn't type-check) and take
 * none: the annotation sits on the const, not on an ignored parameter.
 */
type AcademicFilterInput = (props: {
  alwaysOn?: boolean;
  source?: string;
}) => ReactElement | null;

interface CascadeSelectProps {
  /** Filter key this step writes, and the key `FILTER_DOWNSTREAM` clears by. */
  field: string;
  label: string;
  /** Label of the "no choice" option, omitted where a choice is required. */
  emptyLabel?: string;
  options: AcademicOption[];
}

const CascadeSelect = ({
  field,
  label,
  emptyLabel,
  options,
}: CascadeSelectProps) => {
  const { filterValues, setFilters, displayedFilters } = useListFilterContext();
  const labelId = useId();

  const apply = (value: string) => {
    const next = { ...filterValues, [field]: value !== "" ? value : undefined };
    // A narrower step still holding a value from the previous branch would
    // filter the list down to nothing, so clear everything below this one.
    FILTER_DOWNSTREAM[field]?.forEach((downstream) => delete next[downstream]);
    setFilters(next, displayedFilters);
  };

  return (
    <FormControl size="small" fullWidth>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        value={options.length > 0 ? (filterValues[field] ?? "") : ""}
        labelId={labelId}
        label={label}
        // Names MUI's hidden native input, which otherwise trips Chrome's
        // "form field should have an id or name" audit on every step.
        name={field}
        onChange={(event) => apply(event.target.value)}
      >
        {emptyLabel && (
          <MenuItem value="">
            <em>{emptyLabel}</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export const SchoolYearFilter: AcademicFilterInput = () => {
  const { filterValues, setFilters, displayedFilters } = useListFilterContext();
  const schoolYears = useSchoolYearOptions();

  // Every step below is scoped by the year, and a list answering for all years
  // at once is never what someone wants, so seed the current one as soon as the
  // years arrive. Runs on the year list, not on `filterValues`: a year the user
  // clears by hand must stay cleared.
  useEffect(() => {
    if (schoolYears.length === 0 || filterValues.schoolYearId) return;
    const currentYear = new Date().getFullYear();
    const match = schoolYears.find((year) => Number(year.name) === currentYear);
    if (!match) return;
    setFilters({ ...filterValues, schoolYearId: match.id }, displayedFilters);
  }, [schoolYears]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CascadeSelect
      field="schoolYearId"
      label="Año Escolar"
      options={schoolYears}
    />
  );
};

export const LevelFilter: AcademicFilterInput = () => {
  const levels = useLevelOptions();

  return (
    <CascadeSelect
      field="levelId"
      label="Nivel"
      emptyLabel="Todos"
      options={levels}
    />
  );
};

export const GradeFilter: AcademicFilterInput = () => {
  const { filterValues } = useListFilterContext();
  const grades = useGradeOptions(
    filterValues.schoolYearId,
    filterValues.levelId,
  );

  if (!filterValues.levelId) return null;

  return (
    <CascadeSelect
      field="gradeId"
      label="Grado"
      emptyLabel="Todos"
      options={grades}
    />
  );
};

export const ShiftFilter: AcademicFilterInput = () => {
  const { filterValues } = useListFilterContext();
  const shifts = useShiftOptions(
    filterValues.schoolYearId,
    filterValues.gradeId,
  );

  if (!filterValues.gradeId) return null;

  return (
    <CascadeSelect
      field="shiftId"
      label="Turno"
      emptyLabel="Todos"
      options={shifts}
    />
  );
};

export const SectionFilter: AcademicFilterInput = () => {
  const { filterValues } = useListFilterContext();
  const sections = useSectionOptions(
    filterValues.schoolYearId,
    filterValues.levelId,
    filterValues.gradeId,
    filterValues.shiftId,
  );

  if (!filterValues.shiftId) return null;

  return (
    <CascadeSelect
      field="sectionId"
      label="Sección"
      emptyLabel="Todas"
      options={sections}
    />
  );
};

/** The cascade as `<List filters>` elements — spread, don't nest, so each step
 *  gets its own cell of the filter bar. */
export const academicFilterInputs = [
  <SchoolYearFilter key="schoolYearId" source="schoolYearId" alwaysOn />,
  <LevelFilter key="levelId" source="levelId" alwaysOn />,
  <GradeFilter key="gradeId" source="gradeId" alwaysOn />,
  <ShiftFilter key="shiftId" source="shiftId" alwaysOn />,
  <SectionFilter key="sectionId" source="sectionId" alwaysOn />,
];

// Standalone layout: equal auto-filled tracks, so the panel hosting the cascade
// spreads whichever steps are open across its full width instead of leaving a
// ragged tail, and reflows as steps appear.
const standaloneGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "repeat(auto-fill, minmax(140px, 1fr))",
    sm: "repeat(auto-fill, minmax(180px, 1fr))",
  },
  gap: 1,
  alignItems: "start",
} as const;

const AcademicFilterSelector = () => (
  <Box sx={standaloneGridSx}>{academicFilterInputs}</Box>
);

export default AcademicFilterSelector;
