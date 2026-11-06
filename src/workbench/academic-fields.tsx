import { useState } from "react";
import { useWorkbench } from "./workbench-context";
import type { WorkbenchOptions } from "./types";

/** School year, grade, shift and fee concept: always chosen by the user. */
export interface AcademicValue {
  schoolYearId: string;
  gradeId: string;
  shiftId: string;
  schoolFeeConceptId: string;
}

export const EMPTY_ACADEMIC: AcademicValue = {
  schoolYearId: "",
  gradeId: "",
  shiftId: "",
  schoolFeeConceptId: "",
};

const shiftsFor = (options: WorkbenchOptions | null, value: AcademicValue) =>
  (options?.shifts ?? []).filter(
    (shift) =>
      String(shift.schoolYearId) === value.schoolYearId &&
      String(shift.gradeId) === value.gradeId,
  );

export const ACADEMIC_MISSING =
  "Elige el año escolar, el grado, el turno y el concepto de pensión.";

/** The academic part of a request body, or null while something is missing. */
export const academicBody = (
  options: WorkbenchOptions | null,
  value: AcademicValue,
) => {
  const shiftValid = shiftsFor(options, value).some(
    (shift) => String(shift.shiftId) === value.shiftId,
  );
  if (
    !value.schoolYearId ||
    !value.gradeId ||
    !shiftValid ||
    !value.schoolFeeConceptId
  )
    return null;
  return {
    schoolYearId: Number(value.schoolYearId),
    gradeId: Number(value.gradeId),
    shiftId: Number(value.shiftId),
    schoolFeeConceptId: Number(value.schoolFeeConceptId),
  };
};

/** A date field that follows the business date until the user changes it. */
export const useBusinessDateField = () => {
  const { status } = useWorkbench();
  const [own, setOwn] = useState<string | null>(null);
  return [own ?? status?.businessDate ?? "", setOwn] as const;
};

const Choose = () => <option value="">elegir…</option>;

export const AcademicFields = ({
  value,
  onChange,
}: {
  value: AcademicValue;
  onChange: (next: AcademicValue) => void;
}) => {
  const { options } = useWorkbench();
  const set = (patch: Partial<AcademicValue>) =>
    onChange({ ...value, ...patch });
  const shifts = shiftsFor(options, value);
  return (
    <>
      <label>
        Año escolar
        <select
          value={value.schoolYearId}
          onChange={(event) => set({ schoolYearId: event.target.value })}
        >
          <Choose />
          {options?.schoolYears.map((year) => (
            <option key={year.id} value={year.id}>
              {year.year}
              {year.active ? " (activo)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        Grado
        <select
          value={value.gradeId}
          onChange={(event) => set({ gradeId: event.target.value })}
        >
          <Choose />
          {options?.grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.levelName} · {grade.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Turno
        <select
          value={
            shifts.some((shift) => String(shift.shiftId) === value.shiftId)
              ? value.shiftId
              : ""
          }
          onChange={(event) => set({ shiftId: event.target.value })}
        >
          <Choose />
          {shifts.map((shift) => (
            <option key={shift.shiftId} value={shift.shiftId}>
              {shift.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Concepto de pensión
        <select
          value={value.schoolFeeConceptId}
          onChange={(event) => set({ schoolFeeConceptId: event.target.value })}
        >
          <Choose />
          {options?.feeConcepts.map((concept) => (
            <option key={concept.id} value={concept.id}>
              {concept.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
};
