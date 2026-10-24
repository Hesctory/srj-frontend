import { Create, NumberInput, SimpleForm, TextInput } from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const ClassroomsCreate = () => (
  <Create redirect="list" mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save />}>
      <TextInput source="name" label="Nombre" />
      <NumberInput source="capacity" label="Capacidad" min={1} />
    </SimpleForm>
  </Create>
);
