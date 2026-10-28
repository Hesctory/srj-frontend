import { Create, SimpleForm } from "react-admin";
import SchoolFeeToolbar from "./school-fee-toolbar";
import { FORM_WIDTH, SchoolFeeInputs } from "./school-fee-inputs";

export const SchoolFeesCreate = () => (
  <Create redirect="list" mutationMode="pessimistic" sx={FORM_WIDTH}>
    <SimpleForm toolbar={<SchoolFeeToolbar />}>
      <SchoolFeeInputs />
    </SimpleForm>
  </Create>
);
