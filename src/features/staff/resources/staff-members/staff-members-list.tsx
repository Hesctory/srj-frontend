import { DataTable, EditButton, List, TextInput } from "react-admin";

const staffFilters = [
  <TextInput key="fullName" source="fullName" label="Nombre" alwaysOn />,
  <TextInput
    key="documentNumber"
    source="documentNumber"
    label="N° Documento"
    alwaysOn
  />,
  <TextInput
    key="employeeCode"
    source="employeeCode"
    label="Código Empleado"
  />,
];

export const StaffMembersList = () => (
  <List filters={staffFilters} debounce={500}>
    <DataTable bulkActionButtons={false}>
      <DataTable.Col source="fullName" label="Nombre Completo" />
      <DataTable.Col source="documentNumber" label="N° Documento" />
      <DataTable.Col source="employeeCode" label="Código Empleado" />
      <DataTable.Col source="professionalTitle" label="Título Profesional" />
      <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
