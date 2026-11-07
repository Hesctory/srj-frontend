import { NumberInput, SelectInput } from "react-admin";
import {
  actionLabel,
  originLabel,
} from "@/features/cashier/recovery/utils/labels";

/**
 * The backend takes `action` and `origin` as arrays; the UI picks one, so the
 * input stores a single value as a one-item array.
 */
const asArray = (value: string | undefined) => (value ? [value] : undefined);
const fromArray = (value: string[] | string | undefined) =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

const ACTIONS = [
  "VOID_PAYMENT",
  "REPLACE_PAYMENT",
  "VOID_DOCUMENT",
  "REPLACE_DOCUMENT",
  "REPAIR_INCONSISTENCY",
].map((id) => ({ id, name: actionLabel(id) }));

const ORIGINS = ["USER", "SCANNER"].map((id) => ({
  id,
  name: originLabel(id),
}));

/**
 * Status is owned by the tab strip. Action and origin are always on; the two
 * ids sit behind «Añadir filtro» because they are for following a link, not
 * for everyday narrowing.
 */
export const recoveryCaseFilters = [
  <SelectInput
    key="action"
    source="action"
    label="Acción"
    choices={ACTIONS}
    format={fromArray}
    parse={asArray}
    alwaysOn
  />,
  <SelectInput
    key="origin"
    source="origin"
    label="Origen"
    choices={ORIGINS}
    format={fromArray}
    parse={asArray}
    alwaysOn
  />,
  <NumberInput key="paymentId" source="paymentId" label="N.º de pago" />,
  <NumberInput
    key="documentId"
    source="documentId"
    label="N.º de comprobante"
  />,
];
