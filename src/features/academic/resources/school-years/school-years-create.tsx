import {
  BooleanInput,
  Create,
  DateInput,
  NumberInput,
  SimpleForm,
} from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const SchoolYearsCreate = () => (
  <Create redirect="list" mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save />}>
      <NumberInput source="year" label="Año" />
      <DateInput source="startDate" label="Fecha de Inicio" />
      <DateInput source="endDate" label="Fecha de Fin" />
      <BooleanInput source="isActive" label="Activo" />
    </SimpleForm>
  </Create>
);
