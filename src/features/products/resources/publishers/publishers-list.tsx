import { DataTable, EditButton, List } from "react-admin";

export const PublishersList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="name" label="Descripción" sx={{ width: "100%" }} />
      <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
