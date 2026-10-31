import { Edit, SimpleForm, useRecordContext } from "react-admin";
import GuardedFormToolbar from "@/features/academic/components/guarded-form-toolbar";
import type { SchoolFeeConcept } from "@/types/school-fee-concept";
import {
  FORM_WIDTH,
  SchoolFeeConceptInputs,
} from "./school-fee-concept-inputs";

const SchoolFeeConceptTitle = () => {
  const record = useRecordContext<SchoolFeeConcept>();
  return record ? <span>{`Concepto ${record.name ?? ""}`}</span> : null;
};

/**
 * Pessimistic, so a refused edit or delete (422, 409 for a concept in use)
 * stays on the form with the server's message.
 */
export const SchoolFeeConceptsEdit = () => (
  <Edit
    mutationMode="pessimistic"
    redirect="list"
    sx={FORM_WIDTH}
    title={<SchoolFeeConceptTitle />}
  >
    <SimpleForm toolbar={<GuardedFormToolbar delete />}>
      <SchoolFeeConceptInputs />
    </SimpleForm>
  </Edit>
);
