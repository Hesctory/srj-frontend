import { Edit, SimpleForm } from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";
import { SchoolFeeInputs } from "./school-fee-inputs";

/**
 * Fee rows cannot be deleted (the contract has no DELETE), so the toolbar
 * offers Guardar only. Pessimistic, so a refused edit (422, 409) stays on the
 * form with the server's message instead of being undone after the fact.
 */
export const SchoolFeesEdit = () => (
  <Edit mutationMode="pessimistic" redirect="list">
    <SimpleForm toolbar={<CRUDToolBar save />} warnWhenUnsavedChanges>
      <SchoolFeeInputs />
    </SimpleForm>
  </Edit>
);
