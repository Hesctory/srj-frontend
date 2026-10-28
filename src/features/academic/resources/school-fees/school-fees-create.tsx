import { Create, SimpleForm } from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";
import { SchoolFeeInputs } from "./school-fee-inputs";

export const SchoolFeesCreate = () => (
  <Create redirect="list" mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save />} warnWhenUnsavedChanges>
      <SchoolFeeInputs />
    </SimpleForm>
  </Create>
);
