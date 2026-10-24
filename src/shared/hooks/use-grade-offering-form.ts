import { useEffect, useRef } from "react";
import { useWatch, useFormContext } from "react-hook-form";

/**
 * Presentation-layer hook for the grade-offering form.
 * Handles cascade logic: resets gradeId when the user picks a different level.
 *
 * Edit-mode initialization of _levelId is handled by passing defaultValues
 * to SimpleForm (see GradeOfferingsEditForm), so this hook is mode-agnostic.
 *
 * Must be called inside a <SimpleForm>.
 */
export const useGradeOfferingForm = (): number | null => {
  const { setValue } = useFormContext();
  const levelId = useWatch({ name: "_levelId" }) ?? null;
  const initialized = useRef(false);

  // Cascade: reset gradeId when level changes (skip first render)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    setValue("gradeId", null);
  }, [levelId, setValue]);

  return levelId;
};
