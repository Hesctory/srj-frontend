import {
  Edit,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextInput,
} from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const InstitutionsEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save delete />}>
      <TextInput source="name" label="Nombre" />
      <TextInput source="ruc" label="RUC" />
      <ReferenceInput source="rucStateId" reference="ruc-states">
        <SelectInput optionText="name" label="Estado RUC" />
      </ReferenceInput>
    </SimpleForm>
  </Edit>
);
