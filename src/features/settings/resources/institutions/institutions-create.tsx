import {
  Create,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextInput,
} from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const InstitutionsCreate = () => (
  <Create redirect="list" mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save />}>
      <TextInput source="name" label="Nombre" />
      <TextInput source="ruc" label="RUC" />
      <ReferenceInput source="rucStateId" reference="ruc-states">
        <SelectInput optionText="name" label="Estado RUC" />
      </ReferenceInput>
    </SimpleForm>
  </Create>
);
