import { DataTable, EditButton, List, TextField } from "react-admin";

export const WorkAreasList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="name" label="Área" sx={{ width: "90%" }}>
        <TextField source="name" />
      </DataTable.Col>
      <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
