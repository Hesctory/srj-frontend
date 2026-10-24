import {
  Create,
  NumberInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextInput,
} from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const GradesCreate = () => (
  <Create redirect="list" mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save />}>
      <TextInput source="name" label="Grado" />
      <NumberInput source="year" label="Año" />
      <ReferenceInput source="levelId" reference="levels">
        <SelectInput optionText="name" label="Nivel" />
      </ReferenceInput>
    </SimpleForm>
  </Create>
);
