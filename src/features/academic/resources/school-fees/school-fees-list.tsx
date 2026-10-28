import {
  DataTable,
  EditButton,
  FunctionField,
  List,
  ReferenceInput,
  SelectInput,
} from "react-admin";
import { Typography } from "@mui/material";
import SchoolYearFilter from "@/shared/components/school-year-filter";
import type { SchoolFee } from "@/types/school-fee";
import { formatMoney } from "@/utils/money";

const schoolFeesFilters = [
  <SchoolYearFilter key="schoolYearId" alwaysOn />,
  <ReferenceInput key="levelId" source="levelId" reference="levels" alwaysOn>
    <SelectInput optionText="name" label="Nivel" />
  </ReferenceInput>,
  <ReferenceInput key="shiftId" source="shiftId" reference="shifts" alwaysOn>
    <SelectInput optionText="name" label="Turno" />
  </ReferenceInput>,
  <ReferenceInput
    key="schoolFeeConceptId"
    source="schoolFeeConceptId"
    reference="school-fee-concepts"
    alwaysOn
  >
    <SelectInput optionText="name" label="Concepto" />
  </ReferenceInput>,
];

const MoneyCol = ({ source }: { source: keyof SchoolFee }) => (
  <FunctionField<SchoolFee>
    source={source}
    render={(record) => formatMoney(record[source] as number)}
    sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
  />
);

const NoMatch = () => (
  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
    No hay tarifas para estos filtros.
  </Typography>
);

export const SchoolFeesList = () => (
  <List filters={schoolFeesFilters} debounce={500}>
    <DataTable empty={<NoMatch />}>
      <DataTable.Col source="levelName" label="Nivel" />
      <DataTable.Col source="shiftName" label="Turno" />
      <DataTable.Col source="schoolFeeConceptName" label="Concepto" />
      <DataTable.Col source="enrollmentPrice" label="Matrícula" align="right">
        <MoneyCol source="enrollmentPrice" />
      </DataTable.Col>
      <DataTable.Col source="tuitionCost" label="Pensión" align="right">
        <MoneyCol source="tuitionCost" />
      </DataTable.Col>
      <DataTable.Col
        source="registrationFee"
        label="Cuota de ingreso"
        align="right"
      >
        <MoneyCol source="registrationFee" />
      </DataTable.Col>
      <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
