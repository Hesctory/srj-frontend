import {
  DataTable,
  EditButton,
  List,
  NumberField,
  ReferenceField,
  TextField,
} from "react-admin";

export const GradesList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="name" label="Grado" sx={{ width: "50%" }} />
      <DataTable.Col source="year" label="Año" sx={{ width: "10%" }}>
        <NumberField source="year" />
      </DataTable.Col>
      <DataTable.Col source="levelId" label="Nivel" sx={{ width: "35%" }}>
        <ReferenceField source="levelId" reference="levels" link={false}>
          <TextField source="name" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
