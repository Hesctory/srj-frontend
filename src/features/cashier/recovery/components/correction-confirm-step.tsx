import { Box, Stack, Typography } from "@mui/material";
import type { CorrectionForm } from "./correction-details-step";
import type { RecoveryAction } from "@/types/payment-recovery";
import { PAYER_RELATIONSHIP_LABEL } from "@/types/payment-document";
import {
  actionLabel,
  causeCommissionHint,
  causeLabel,
} from "@/features/cashier/recovery/utils/labels";
import {
  isPaymentAction,
  outcomeLines,
} from "@/features/cashier/recovery/utils/correction";

interface Props {
  form: CorrectionForm;
  needsReason: boolean;
  reasonName: string | null;
  targetLabel: string;
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.75 }}
  >
    <Typography variant="body2" color="text.secondary" flexShrink={0}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      textAlign="right"
      sx={{ overflowWrap: "anywhere" }}
    >
      {value}
    </Typography>
  </Box>
);

/** Step 3: what the person chose and what will happen, before anything is sent. */
export const CorrectionConfirmStep = ({
  form,
  needsReason,
  reasonName,
  targetLabel,
}: Props) => {
  const action = form.action as RecoveryAction;
  const payer =
    form.relationship === "OTRO"
      ? form.payerName.trim()
      : form.relationship
        ? PAYER_RELATIONSHIP_LABEL[form.relationship]
        : null;
  return (
    <Stack spacing={2}>
      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 1.5,
          px: 1.5,
          py: 1,
        }}
      >
        <Row label="Sobre" value={targetLabel} />
        <Row label="Qué se hará" value={actionLabel(action)} />
        <Row label="Causa" value={causeLabel(form.cause)} />
        {needsReason && reasonName && (
          <Row label="Motivo de la nota de crédito" value={reasonName} />
        )}
        {payer && <Row label="Pagó" value={payer} />}
        <Row label="Justificación" value={form.justification.trim()} />
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Qué va a pasar
        </Typography>
        <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
          {outcomeLines(action, needsReason).map((line) => (
            <Typography component="li" variant="body2" key={line}>
              {line}
            </Typography>
          ))}
          {isPaymentAction(action) && form.cause && (
            <Typography component="li" variant="body2">
              {causeCommissionHint(form.cause)}
            </Typography>
          )}
        </Stack>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Al crear la corrección, el sistema la sigue solo. El recorrido exacto
        aparece en el caso; si algo necesita una decisión, queda en
        Correcciones.
      </Typography>
    </Stack>
  );
};

export default CorrectionConfirmStep;
