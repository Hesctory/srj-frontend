import {
  DataTable,
  EditButton,
  List,
  NumberField,
  TextField,
} from "react-admin";

export const ClassroomsList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="name" label="Nombre" sx={{ width: "70%" }}>
        <TextField source="name" />
      </DataTable.Col>
      <DataTable.Col source="capacity" label="Capacidad" sx={{ width: "20%" }}>
        <NumberField source="capacity" />
      </DataTable.Col>
      <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
