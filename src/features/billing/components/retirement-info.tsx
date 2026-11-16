import { Alert, AlertTitle, Link as MuiLink } from "@mui/material";
import { useCreatePath } from "react-admin";
import { Link } from "react-router-dom";
import type { PaymentDocument, RetirementKind } from "@/types/payment-document";
import { formatIsoDateTime } from "@/utils/money";

const KIND_TEXT: Record<RetirementKind, string> = {
  LOCAL_DISCARD: "Se anuló en el sistema, sin nota de crédito.",
  FULL_CREDIT_NOTE: "Se anuló con una nota de crédito.",
  LEGACY_VOID: "Se anuló antes de existir el flujo de correcciones.",
};

/** Why and when a comprobante stopped being live; renders nothing for a live one. */
export const RetirementInfo = ({ document }: { document: PaymentDocument }) => {
  const createPath = useCreatePath();
  if (!document.isVoided && !document.retirementKind) return null;
  const credit = document.correctionDocumentId;
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <AlertTitle>Comprobante anulado</AlertTitle>
      {document.retirementKind && KIND_TEXT[document.retirementKind]}
      {document.retiredAt &&
        ` Fecha: ${formatIsoDateTime(document.retiredAt)}.`}
      {document.retirementReason && ` Motivo: ${document.retirementReason}`}
      {typeof credit === "number" && (
        <>
          {" "}
          <MuiLink
            component={Link}
            to={createPath({
              resource: "payment-documents",
              type: "show",
              id: credit,
            })}
          >
            Ver la nota de crédito
          </MuiLink>
        </>
      )}
    </Alert>
  );
};

export default RetirementInfo;
