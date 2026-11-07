import { useState } from "react";
import { useGetOne } from "react-admin";
import { Alert, AlertTitle, Button } from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import type { Payment } from "@/types/payment";
import IssueDocumentDialog from "@/features/billing/components/issue-document-dialog";

/**
 * A replacement payment is recorded without a comprobante. Once the case is
 * complete, offer to issue it, unless the new payment already has one.
 */
export const IssueReplacementDocument = ({
  paymentId,
}: {
  paymentId: number;
}) => {
  const [open, setOpen] = useState(false);
  const { data: payment } = useGetOne<Payment>("payments", { id: paymentId });

  if (!payment || payment.activeDocumentId != null) return null;

  return (
    <>
      <Alert
        severity="info"
        sx={{ mb: 2 }}
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<ReceiptLongIcon />}
            onClick={() => setOpen(true)}
          >
            Emitir comprobante del pago nuevo
          </Button>
        }
      >
        <AlertTitle>El pago nuevo no tiene comprobante</AlertTitle>
        La corrección registró el pago correcto, pero el comprobante se emite
        aparte.
      </Alert>
      <IssueDocumentDialog
        open={open}
        onClose={() => setOpen(false)}
        paymentId={paymentId}
        payerName={payment.partyName}
      />
    </>
  );
};

export default IssueReplacementDocument;
