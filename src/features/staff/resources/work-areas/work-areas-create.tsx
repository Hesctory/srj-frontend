import { Create, SimpleForm, TextInput } from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const WorkAreasCreate = () => (
  <Create redirect="list" mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save />}>
      <TextInput source="name" label="Área" />
    </SimpleForm>
  </Create>
);
