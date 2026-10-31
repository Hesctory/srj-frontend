import {
  DataTable,
  EditButton,
  FunctionField,
  List,
  SimpleList,
} from "react-admin";
import { Typography, useMediaQuery, type Theme } from "@mui/material";
import {
  DISCOUNT_CONDITION_LABELS,
  type SchoolFeeConcept,
} from "@/types/school-fee-concept";
import { formatMoney } from "@/utils/money";

const condition = (record: SchoolFeeConcept) =>
  record.discountCondition
    ? DISCOUNT_CONDITION_LABELS[record.discountCondition]
    : "Ninguna";

/** Only the discounts it gives: "Pensión −S/ 50.00", or "Sin descuento". */
const discounts = (record: SchoolFeeConcept) =>
  [
    record.enrollmentDiscount > 0 &&
      `Matrícula −${formatMoney(record.enrollmentDiscount)}`,
    record.tuitionDiscount > 0 &&
      `Pensión −${formatMoney(record.tuitionDiscount)}`,
  ]
    .filter(Boolean)
    .join(" · ") || "Sin descuento";

const MoneyCol = ({
  source,
}: {
  source: "enrollmentDiscount" | "tuitionDiscount";
}) => (
  <FunctionField<SchoolFeeConcept>
    source={source}
    render={(record) => formatMoney(record[source])}
    sx={{ fontVariantNumeric: "tabular-nums" }}
  />
);

const Empty = () => (
  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
    Aún no hay conceptos de cobro. Usa Crear para agregar el primero.
  </Typography>
);

/**
 * A handful of rows with no filters in the contract. The API ignores `sort`,
 * so no column pretends to sort.
 */
export const SchoolFeeConceptsList = () => {
  const small = useMediaQuery<Theme>((theme) => theme.breakpoints.down("md"));

  return (
    <List
      pagination={false}
      perPage={100}
      sx={{ width: "fit-content", maxWidth: "100%", mx: "auto" }}
    >
      {small ? (
        <SimpleList<SchoolFeeConcept>
          primaryText={(record) => record.name ?? ""}
          secondaryText={(record) =>
            `${discounts(record)} · ${condition(record)}`
          }
          linkType="edit"
          empty={<Empty />}
          // Room under the last row for the floating Crear button.
          sx={{ pb: 14 }}
        />
      ) : (
        <DataTable
          empty={<Empty />}
          bulkActionButtons={false}
          sx={{ "& th, & td": { whiteSpace: "nowrap" } }}
        >
          <DataTable.Col source="name" label="Concepto" disableSort />
          <DataTable.Col
            source="enrollmentDiscount"
            label="Dscto. matrícula"
            align="right"
            disableSort
          >
            <MoneyCol source="enrollmentDiscount" />
          </DataTable.Col>
          <DataTable.Col
            source="tuitionDiscount"
            label="Dscto. por pensión"
            align="right"
            disableSort
          >
            <MoneyCol source="tuitionDiscount" />
          </DataTable.Col>
          <DataTable.Col
            source="discountCondition"
            label="Condición"
            disableSort
          >
            <FunctionField<SchoolFeeConcept> render={condition} />
          </DataTable.Col>
          <DataTable.Col label="" sx={{ width: 1, whiteSpace: "nowrap" }}>
            <EditButton />
          </DataTable.Col>
        </DataTable>
      )}
    </List>
  );
};
