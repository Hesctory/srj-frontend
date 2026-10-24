import { Edit, NumberInput, SimpleForm, TextInput } from "react-admin";
import { BackToListButton } from "@/shared/buttons/back-to-list-button";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const ClassroomsEdit = () => (
  <Edit actions={<BackToListButton />}>
    <SimpleForm toolbar={<CRUDToolBar save delete />}>
      <TextInput source="name" label="Nombre" />
      <NumberInput source="capacity" label="Capacidad" min={1} />
    </SimpleForm>
  </Edit>
);
