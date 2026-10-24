import {
  BooleanInput,
  DateInput,
  Edit,
  NumberInput,
  SimpleForm,
} from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";

export const SchoolYearsEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={<CRUDToolBar save delete />}>
      <NumberInput source="year" label="Año" />
      <DateInput source="startDate" label="Fecha de Inicio" />
      <DateInput source="endDate" label="Fecha de Fin" />
      <BooleanInput source="isActive" label="Activo" />
    </SimpleForm>
  </Edit>
);
