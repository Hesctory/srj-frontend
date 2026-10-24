import {
  BooleanInput,
  DateInput,
  NumberInput,
  ReferenceInput,
  SelectInput,
} from "react-admin";

/**
 * List filters for `payment-documents` (backend repo:
 * `Documentation/Payment Document/PaymentDocumentContract.md`).
 *
 * Always on: the axes someone narrows by every day — voucher type and the
 * issue-date range. Behind "Añadir filtro": series, institution, the payment
 * number, and voided rows.
 *
 * Two filters from the contract are deliberately absent. `sunatStatusCode` is
 * owned by the tab strip, which would fight a duplicate control here. `id[]`
 * is for internal links, not for typing ids by hand.
 */

const voucherTypeChoices = [
  { id: "BOLETA", name: "Boleta de venta" },
  { id: "FACTURA", name: "Factura" },
  { id: "NOTA_CREDITO", name: "Nota de crédito" },
  { id: "NOTA_DEBITO", name: "Nota de débito" },
  { id: "RECIBO_INTERNO", name: "Recibo interno" },
];

export const paymentDocumentFilters = [
  <SelectInput
    key="voucherTypeCode"
    source="voucherTypeCode"
    label="Tipo"
    choices={voucherTypeChoices}
    alwaysOn
  />,
  <DateInput
    key="issueDateFrom"
    source="issueDateFrom"
    label="Emitido desde"
    alwaysOn
  />,
  <DateInput
    key="issueDateTo"
    source="issueDateTo"
    label="Emitido hasta"
    alwaysOn
  />,
  <ReferenceInput key="seriesId" source="seriesId" reference="voucher-series">
    <SelectInput optionText="series" label="Serie" />
  </ReferenceInput>,
  <ReferenceInput
    key="institutionId"
    source="institutionId"
    reference="institutions"
  >
    <SelectInput optionText="name" label="Institución" />
  </ReferenceInput>,
  <NumberInput key="paymentId" source="paymentId" label="N.º de pago" />,
  <BooleanInput
    key="includeVoided"
    source="includeVoided"
    label="Incluir anulados"
  />,
];
