import { Edit, SimpleForm, TextInput } from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const AccountingPlanEdit = () => (
  <Edit redirect="list" mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save delete />}>
      <TextInput source="code" label="Código" />
      <TextInput source="printCode" label="Cód. Impresión" />
      <TextInput source="name" label="Nombre" />
    </SimpleForm>
  </Edit>
);
