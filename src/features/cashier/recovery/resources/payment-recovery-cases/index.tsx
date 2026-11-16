import { Resource } from "react-admin";
import RuleFolderIcon from "@mui/icons-material/RuleFolder";
import { PaymentRecoveryCasesList } from "./payment-recovery-cases-list";
import { PaymentRecoveryCaseShow } from "./payment-recovery-case-show";

/**
 * List and show only. Cases are opened from a payment or a comprobante and
 * advance by themselves; nothing here creates, edits or deletes one (the
 * resolution is a dedicated PUT, see the dataProvider's `recovery` group).
 */
export const PaymentRecoveryCasesResource = (
  <Resource
    name="payment-recovery-cases"
    list={PaymentRecoveryCasesList}
    show={PaymentRecoveryCaseShow}
    icon={RuleFolderIcon}
    options={{ label: "Correcciones" }}
  />
);
