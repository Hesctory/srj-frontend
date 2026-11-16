import { DateInput, SelectInput, TextInput } from "react-admin";

const voidedChoices = [
  { id: false, name: "Vigentes" },
  { id: true, name: "Anulados" },
];

const openCaseChoices = [
  { id: true, name: "Con corrección en curso" },
  { id: false, name: "Sin corrección en curso" },
];

/** Date range and comprobante number always on; the rest behind "Añadir filtro". */
export const paymentFilters = [
  <DateInput key="dateFrom" source="dateFrom" label="Desde" alwaysOn />,
  <DateInput key="dateTo" source="dateTo" label="Hasta" alwaysOn />,
  <TextInput
    key="documentNumber"
    source="documentNumber"
    label="N.º de comprobante"
    alwaysOn
    resettable
  />,
  <SelectInput
    key="isVoided"
    source="isVoided"
    label="Estado"
    choices={voidedChoices}
  />,
  <SelectInput
    key="hasOpenRecoveryCase"
    source="hasOpenRecoveryCase"
    label="Corrección"
    choices={openCaseChoices}
  />,
];
