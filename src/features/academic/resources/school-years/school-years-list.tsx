import {
  BooleanField,
  DataTable,
  DateField,
  EditButton,
  List,
  TextField,
} from "react-admin";

export const SchoolYearsList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="year" label="Año" sx={{ width: "10%" }}>
        <TextField source="year" />
      </DataTable.Col>
      <DataTable.Col
        source="startDate"
        label="Fecha de Inicio"
        sx={{ width: "35%" }}
      >
        <DateField source="startDate" />
      </DataTable.Col>
      <DataTable.Col
        source="endDate"
        label="Fecha de Fin"
        sx={{ width: "35%" }}
      >
        <DateField source="endDate" />
      </DataTable.Col>
      <DataTable.Col source="isActive" label="Activo" sx={{ width: "15%" }}>
        <BooleanField source="isActive" />
      </DataTable.Col>
      <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
