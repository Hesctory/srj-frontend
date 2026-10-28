import { Edit, SimpleForm } from "react-admin";
import SchoolFeeToolbar from "./school-fee-toolbar";
import { FORM_WIDTH, SchoolFeeInputs } from "./school-fee-inputs";

/**
 * Fee rows cannot be deleted (the contract has no DELETE), so the toolbar
 * offers Guardar only. Pessimistic, so a refused edit (422, 409) stays on the
 * form with the server's message instead of being undone after the fact.
 */
export const SchoolFeesEdit = () => (
  <Edit mutationMode="pessimistic" redirect="list" sx={FORM_WIDTH}>
    <SimpleForm toolbar={<SchoolFeeToolbar />}>
      <SchoolFeeInputs />
    </SimpleForm>
  </Edit>
);
