import { useWatch, useFormContext } from "react-hook-form";

interface UseAcademicFormSelectorResult {
  schoolYearId: unknown;
  levelId: unknown;
  gradeId: unknown;
  shiftId: unknown;
  clearFields: (fields: string[]) => void;
}

export const useAcademicFormSelector = (
  base: string,
): UseAcademicFormSelectorResult => {
  const { setValue } = useFormContext();

  const schoolYearId = useWatch({ name: `${base}schoolYearId` });
  const levelId = useWatch({ name: `${base}levelId` });
  const gradeId = useWatch({ name: `${base}gradeId` });
  const shiftId = useWatch({ name: `${base}shiftId` });

  const clearFields = (fields: string[]) => {
    fields.forEach((f) => setValue(`${base}${f}`, null));
  };

  return { schoolYearId, levelId, gradeId, shiftId, clearFields };
};
