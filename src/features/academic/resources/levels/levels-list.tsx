import { DataTable, EditButton, List, NumberField } from "react-admin";

export const LevelsList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="name" label="Nivel" sx={{ width: "80%" }} />
      <DataTable.Col source="orderIndex" label="Orden" sx={{ width: "15%" }}>
        <NumberField source="orderIndex" />
      </DataTable.Col>
      <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
