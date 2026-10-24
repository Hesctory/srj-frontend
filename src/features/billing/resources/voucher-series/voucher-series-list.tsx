import {
  DataTable,
  EditButton,
  List,
  ReferenceField,
  TextField,
} from "react-admin";

export const VoucherSeriesList = () => (
  <List>
    <DataTable>
      <DataTable.Col
        source="voucherType"
        label="Tipo de Comprobante"
        sx={{ width: "50%" }}
      >
        <TextField source="voucherType" />
      </DataTable.Col>
      <DataTable.Col
        source="institutionId"
        label="Institución"
        sx={{ width: "30%" }}
      >
        <ReferenceField
          source="institutionId"
          reference="institutions"
          link={false}
        >
          <TextField source="name" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="series" label="Serie" sx={{ width: "20%" }}>
        <TextField source="series" />
      </DataTable.Col>
      <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
