import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import { Alert, Box, Chip, Stack } from "@mui/material";
import type { PaymentPreviewResponse } from "@/types/payment";
import {
  formatCountdown,
  PREVIEW_TTL_SECONDS,
} from "@/features/cashier/tuition/utils/payments";
import PaymentPlanSummary from "./payment-plan-summary";

interface PaymentPlanReviewProps {
  preview: PaymentPreviewResponse;
  secondsLeft: number;
}

/** Below this the plan is about to die, so the chip stops being decorative. */
const URGENT_SECONDS = 60;

/**
 * The review step. Nothing has been written yet: this is a server-computed plan
 * held open by a single-use token that dies five minutes after it was issued.
 * The countdown is the only piece of state the client owns here, and it exists
 * so an expired token surfaces as an explanation rather than as a failed
 * confirmation.
 */
const PaymentPlanReview = ({
  preview,
  secondsLeft,
}: PaymentPlanReviewProps) => {
  const expired = secondsLeft === 0;

  return (
    <Stack spacing={2}>
      {expired ? (
        <Alert severity="warning">
          El plan expiró. Vuelve al formulario y calcúlalo de nuevo para
          registrar el pago.
        </Alert>
      ) : (
        <Box display="flex" justifyContent="flex-end">
          <Chip
            size="small"
            variant="outlined"
            color={secondsLeft <= URGENT_SECONDS ? "warning" : "default"}
            icon={<TimerOutlinedIcon fontSize="small" />}
            label={`Válido por ${formatCountdown(secondsLeft)}`}
            role="timer"
            aria-label={`El plan de pago vence en ${formatCountdown(secondsLeft)} minutos`}
            title={`Los planes de pago vencen a los ${PREVIEW_TTL_SECONDS / 60} minutos`}
          />
        </Box>
      )}

      <PaymentPlanSummary plan={preview.plan} totalLabel="Total a cobrar" />
    </Stack>
  );
};

export default PaymentPlanReview;
