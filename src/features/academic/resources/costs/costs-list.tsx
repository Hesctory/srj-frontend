import {
  DataTable,
  EditButton,
  List,
  NumberField,
  ReferenceField,
  TextField,
} from "react-admin";
import SchoolYearFilter from "@/shared/components/school-year-filter";

const costsFilters = [<SchoolYearFilter key="schoolYearId" alwaysOn />];

export const CostsList = () => (
  <List filters={costsFilters} debounce={500}>
    <DataTable>
      <DataTable.Col source="levelId" label="Nivel" sx={{ width: "20%" }}>
        <ReferenceField source="levelId" reference="levels" link={false}>
          <TextField source="level" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="shift" label="Turno" sx={{ width: "10%" }}>
        <TextField source="shift" />
      </DataTable.Col>
      <DataTable.Col
        source="inscription"
        label="Inscripción"
        sx={{ width: "15%" }}
      >
        <NumberField source="inscription" />
      </DataTable.Col>
      <DataTable.Col
        source="enrollment"
        label="Matrícula"
        sx={{ width: "15%" }}
      >
        <NumberField source="enrollment" />
      </DataTable.Col>
      <DataTable.Col source="monthly" label="Mensualidad" sx={{ width: "15%" }}>
        <NumberField source="monthly" />
      </DataTable.Col>
      <DataTable.Col
        source="schoolYearId"
        label="Año Escolar"
        sx={{ width: "15%" }}
      >
        <ReferenceField
          source="schoolYearId"
          reference="school-years"
          link={false}
        >
          <TextField source="year" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
