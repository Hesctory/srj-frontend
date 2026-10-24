import { Resource } from "react-admin";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { PaymentDocumentsList } from "./payment-documents-list";
import { PaymentDocumentShow } from "./payment-document-show";

/**
 * Resource registration for `payment-documents`.
 *
 * List and show only. A comprobante is generated from a payment
 * (`POST /api/payment-documents` takes nothing but a `paymentId`), so there is
 * no create form and no edit page — `create`/`edit` are omitted on purpose so
 * neither route exists. Nothing in the contract deletes one either.
 */
export const PaymentDocumentsResource = (
  <Resource
    name="payment-documents"
    list={PaymentDocumentsList}
    show={PaymentDocumentShow}
    icon={ReceiptLongIcon}
    options={{ label: "Comprobantes de Pago" }}
  />
);
