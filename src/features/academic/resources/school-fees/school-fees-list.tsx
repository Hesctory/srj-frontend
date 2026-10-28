import {
  DataTable,
  EditButton,
  FunctionField,
  List,
  ReferenceInput,
  SelectInput,
  SimpleList,
  useListContext,
} from "react-admin";
import { Typography, useMediaQuery, type Theme } from "@mui/material";
import SchoolYearFilter from "@/shared/components/school-year-filter";
import type { SchoolFee } from "@/types/school-fee";
import { formatMoney } from "@/utils/money";

// The year is always set; the rest sit behind "Agregar filtro" so a phone
// sees fees, not four selects, on its first screen.
const schoolFeesFilters = [
  <SchoolYearFilter key="schoolYearId" alwaysOn />,
  <ReferenceInput key="levelId" source="levelId" reference="levels">
    <SelectInput optionText="name" label="Nivel" />
  </ReferenceInput>,
  <ReferenceInput key="shiftId" source="shiftId" reference="shifts">
    <SelectInput optionText="name" label="Turno" />
  </ReferenceInput>,
  <ReferenceInput
    key="schoolFeeConceptId"
    source="schoolFeeConceptId"
    reference="school-fee-concepts"
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

/** "Nothing for this year yet" reads differently from "no match". */
const NoMatch = () => {
  const { filterValues } = useListContext();
  const narrowed = Object.keys(filterValues).some(
    (key) => key !== "schoolYearId" && filterValues[key] != null,
  );
  return (
    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
      {narrowed
        ? "No hay tarifas para estos filtros."
        : "Aún no hay tarifas para este año escolar. Usa Crear para agregar la primera."}
    </Typography>
  );
};

const describe = (record: SchoolFee) =>
  [record.levelName, record.shiftName, record.schoolFeeConceptName]
    .filter(Boolean)
    .join(" · ");

const amounts = (record: SchoolFee) =>
  `Matrícula ${formatMoney(record.enrollmentPrice)} · Pensión ${formatMoney(
    record.tuitionCost,
  )} · Cuota ${formatMoney(record.registrationFee)}`;

export const SchoolFeesList = () => {
  // The table needs ~840px; below "lg" the sidebar leaves less than that, so
  // one row per fee with the amounts below.
  const small = useMediaQuery<Theme>((theme) => theme.breakpoints.down("lg"));

  return (
    // Seven short columns: on a wide screen the card shrinks to them and
    // centres, instead of stretching a mostly empty frame across the page.
    <List
      filters={schoolFeesFilters}
      debounce={500}
      sx={{ width: "fit-content", maxWidth: "100%", mx: "auto" }}
    >
      {small ? (
        <SimpleList<SchoolFee>
          primaryText={describe}
          secondaryText={amounts}
          linkType="edit"
          empty={<NoMatch />}
        />
      ) : (
        <SchoolFeesTable />
      )}
    </List>
  );
};

const SchoolFeesTable = () => (
  // Fee rows cannot be deleted, so no row selection and no bulk Borrar. The
  // API ignores `sort` (the contract lists no sort fields), so no column
  // pretends to sort.
  <DataTable
    empty={<NoMatch />}
    bulkActionButtons={false}
    sx={{ "& th, & td": { whiteSpace: "nowrap" } }}
  >
    <DataTable.Col source="levelName" label="Nivel" disableSort />
    <DataTable.Col source="shiftName" label="Turno" disableSort />
    <DataTable.Col source="schoolFeeConceptName" label="Concepto" disableSort />
    <DataTable.Col
      source="enrollmentPrice"
      label="Matrícula"
      align="right"
      disableSort
    >
      <MoneyCol source="enrollmentPrice" />
    </DataTable.Col>
    <DataTable.Col
      source="tuitionCost"
      label="Pensión"
      align="right"
      disableSort
    >
      <MoneyCol source="tuitionCost" />
    </DataTable.Col>
    <DataTable.Col
      source="registrationFee"
      label="Cuota de ingreso"
      align="right"
      disableSort
    >
      <MoneyCol source="registrationFee" />
    </DataTable.Col>
    <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
      <EditButton />
    </DataTable.Col>
  </DataTable>
);
