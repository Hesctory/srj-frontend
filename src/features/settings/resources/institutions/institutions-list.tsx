import {
  DataTable,
  List,
  ReferenceField,
  TextInput,
  TextField,
} from "react-admin";

const institutionsFilters = [
  <TextInput key="name" source="name" label="Nombre" alwaysOn />,
];

export const InstitutionsList = () => (
  <List filters={institutionsFilters} debounce={500}>
    <DataTable>
      <DataTable.Col source="name" label="Nombre" sx={{ width: "50%" }} />
      <DataTable.Col source="ruc" label="RUC" sx={{ width: "20%" }} />
      <DataTable.Col
        source="rucStateId"
        label="Estado RUC"
        sx={{ width: "25%" }}
      >
        <ReferenceField source="rucStateId" reference="ruc-states" link={false}>
          <TextField source="name" />
        </ReferenceField>
      </DataTable.Col>
    </DataTable>
  </List>
);
