import { Resource } from "react-admin";
import PaymentsIcon from "@mui/icons-material/Payments";
import { PaymentsList } from "./payments-list";
import { PaymentShow } from "./payment-show";

/**
 * List and show only. A payment is registered from the tuition counter and
 * corrected through a recovery case; it is never edited or deleted here.
 */
export const PaymentsResource = (
  <Resource
    name="payments"
    list={PaymentsList}
    show={PaymentShow}
    icon={PaymentsIcon}
    options={{ label: "Pagos" }}
  />
);
