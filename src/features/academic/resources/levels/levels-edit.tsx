import { Edit, NumberInput, SimpleForm, TextInput } from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const LevelsEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save delete />}>
      <TextInput source="name" label="Nivel" />
      <NumberInput source="orderIndex" label="Orden" />
    </SimpleForm>
  </Edit>
);
