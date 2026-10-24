import { Edit, SimpleForm, TextInput } from "react-admin";
import { BackToListButton } from "@/shared/buttons/back-to-list-button";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const WorkAreasEdit = () => (
  <Edit actions={<BackToListButton />}>
    <SimpleForm toolbar={<CRUDToolBar save delete />}>
      <TextInput source="name" label="Área" />
    </SimpleForm>
  </Edit>
);
