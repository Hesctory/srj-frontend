import { Create, SimpleForm, TextInput } from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const AccountingPlanCreate = () => (
  <Create
    redirect="list"
    mutationMode="pessimistic"
    transform={(data: Record<string, unknown>) => ({
      ...data,
      parentAccountId: null,
    })}
  >
    <SimpleForm toolbar={<CRUDToolBar save />}>
      <TextInput source="code" label="Código" />
      <TextInput source="printCode" label="Cód. Impresión" />
      <TextInput source="name" label="Nombre" />
    </SimpleForm>
  </Create>
);
