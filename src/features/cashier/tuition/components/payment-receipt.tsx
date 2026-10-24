import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Alert, AlertTitle, Box, Stack, Typography } from "@mui/material";
import type { ConfirmPaymentResponse } from "@/types/payment";
import PaymentPlanSummary from "./payment-plan-summary";

interface PaymentReceiptProps {
  receipt: ConfirmPaymentResponse;
}

/**
 * The done step. Same plan as the review, past tense — every `obligationId` is
 * populated now, including the commission line that had none in the preview.
 *
 * `id` is the payment's, not a comprobante number: the comprobante is a
 * separate document with its own series and correlative, issued through
 * `/api/payment-documents`. `requiresPaymentDocument` says whether this payment
 * still owes one — and when it does, the notice names the consequence of
 * walking away, because the drawer's footer offers the action that avoids it.
 */
const PaymentReceipt = ({ receipt }: PaymentReceiptProps) => (
  <Stack spacing={3}>
    <Box display="flex" gap={1.5} alignItems="flex-start">
      <CheckCircleIcon color="success" />
      <Box minWidth={0}>
        <Typography variant="h6" component="h3">
          Pago registrado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pago N.º {receipt.id}
        </Typography>
      </Box>
    </Box>

    {receipt.requiresPaymentDocument ? (
      <Alert severity="warning">
        <AlertTitle>Falta emitir el comprobante</AlertTitle>
        El dinero ya está registrado. Si cierras sin emitirlo, este pago queda
        pendiente de facturar hasta que alguien lo haga.
      </Alert>
    ) : (
      <Alert severity="success">
        <AlertTitle>No hace falta comprobante</AlertTitle>
        Este pago canceló deuda que ya estaba facturada. No queda nada
        pendiente.
      </Alert>
    )}

    <PaymentPlanSummary plan={receipt.plan} totalLabel="Total cobrado" />
  </Stack>
);

export default PaymentReceipt;
