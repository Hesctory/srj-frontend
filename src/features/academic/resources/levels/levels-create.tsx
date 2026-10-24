import { Create, NumberInput, SimpleForm, TextInput } from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const LevelsCreate = () => (
  <Create redirect="list" mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save />}>
      <TextInput source="name" label="Nivel" />
      <NumberInput source="orderIndex" label="Orden" />
    </SimpleForm>
  </Create>
);
