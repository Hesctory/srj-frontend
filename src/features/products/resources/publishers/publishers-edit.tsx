import { Edit, SimpleForm, TextInput } from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const PublishersEdit = () => (
  <Edit actions={null}>
    <SimpleForm toolbar={<CRUDToolBar save delete />}>
      <TextInput source="name" label="Descripción" />
    </SimpleForm>
  </Edit>
);
