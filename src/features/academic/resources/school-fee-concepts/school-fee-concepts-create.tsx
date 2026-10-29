import { Create, SimpleForm } from "react-admin";
import GuardedFormToolbar from "@/features/academic/components/guarded-form-toolbar";
import {
  FORM_WIDTH,
  NEW_CONCEPT_DEFAULTS,
  SchoolFeeConceptInputs,
} from "./school-fee-concept-inputs";

export const SchoolFeeConceptsCreate = () => (
  <Create redirect="list" mutationMode="pessimistic" sx={FORM_WIDTH}>
    <SimpleForm
      toolbar={<GuardedFormToolbar />}
      defaultValues={NEW_CONCEPT_DEFAULTS}
    >
      <SchoolFeeConceptInputs />
    </SimpleForm>
  </Create>
);
