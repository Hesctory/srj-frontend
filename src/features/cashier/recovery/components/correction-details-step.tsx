import { useCallback } from "react";
import {
  Alert,
  Box,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Payment } from "@/types/payment";
import type { PayerRelationship } from "@/types/payment-document";
import type { RecoveryAction, RecoveryCause } from "@/types/payment-recovery";
import FormGrid, { fullRowField } from "@/shared/components/form-grid";
import PayerNote from "@/features/billing/components/payer-note";
import { formatMoney } from "@/utils/money";
import { useCreditNoteReasons } from "@/features/cashier/recovery/hooks/use-credit-note-reasons";
import {
  causeCommissionHint,
  causeLabel,
} from "@/features/cashier/recovery/utils/labels";
import {
  causesFor,
  isPaymentAction,
} from "@/features/cashier/recovery/utils/correction";
import ReplacementPaymentSection from "./replacement-payment-section";

export interface CorrectionForm {
  action: RecoveryAction | "";
  cause: RecoveryCause | "";
  justification: string;
  reasonCode: string;
  relationship: PayerRelationship | "";
  payerName: string;
  token: string | null;
}

interface Props {
  form: CorrectionForm;
  onChange: (patch: Partial<CorrectionForm>) => void;
  /** The relevant comprobante is ACCEPTED by SUNAT, so a credit-note reason is due. */
  needsReason: boolean;
  payment: Payment | null;
  paymentId: number | null;
  expiredToken: string | null;
  disabled: boolean;
  /** Validation message per field, already filtered for what to show now. */
  errorFor: (field: string) => string | undefined;
}

/** Step 2: the cause, the reason SUNAT needs, and whatever the chosen action asks for. */
export const CorrectionDetailsStep = ({
  form,
  onChange,
  needsReason,
  payment,
  paymentId,
  expiredToken,
  disabled,
  errorFor,
}: Props) => {
  const { data: reasons = [] } = useCreditNoteReasons(needsReason);
  const { action, cause } = form;
  const paymentAction = isPaymentAction(action);
  const onTokenChange = useCallback(
    (token: string | null) => onChange({ token }),
    [onChange],
  );

  return (
    <Stack spacing={2.5}>
      <FormGrid minColumnWidth={240}>
        <TextField
          select
          label="Causa"
          value={cause}
          onChange={(event) =>
            onChange({ cause: event.target.value as RecoveryCause })
          }
          error={Boolean(errorFor("cause"))}
          helperText={
            errorFor("cause") ??
            (paymentAction && cause ? causeCommissionHint(cause) : " ")
          }
          disabled={disabled}
          fullWidth
        >
          {causesFor(action).map((option) => (
            <MenuItem key={option} value={option}>
              {causeLabel(option)}
            </MenuItem>
          ))}
        </TextField>

        {needsReason && (
          <TextField
            select
            label="Motivo de la nota de crédito"
            value={form.reasonCode}
            onChange={(event) => onChange({ reasonCode: event.target.value })}
            error={Boolean(errorFor("creditNoteReasonCode"))}
            helperText={
              errorFor("creditNoteReasonCode") ??
              "SUNAT ya aceptó el comprobante: se anula con una nota de crédito."
            }
            disabled={disabled}
            fullWidth
          >
            {reasons.map((reason) => (
              <MenuItem key={reason.code} value={reason.code ?? ""}>
                {reason.code} · {reason.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          label="Justificación"
          value={form.justification}
          onChange={(event) => onChange({ justification: event.target.value })}
          error={Boolean(errorFor("justification"))}
          helperText={
            errorFor("justification") ?? "Queda en el historial del caso."
          }
          multiline
          minRows={3}
          disabled={disabled}
          fullWidth
          sx={fullRowField}
        />
      </FormGrid>

      {action === "REPLACE_DOCUMENT" && (
        <Box>
          <PayerNote
            relationship={form.relationship}
            name={form.payerName}
            onRelationshipChange={(relationship) => onChange({ relationship })}
            onNameChange={(payerName) => onChange({ payerName })}
            disabled={disabled}
          />
          {errorFor("payerName") && (
            <Typography variant="caption" color="error">
              {errorFor("payerName")}
            </Typography>
          )}
        </Box>
      )}

      {action === "VOID_PAYMENT" && (
        <AllocationsBackToPending payment={payment} />
      )}

      {action === "REPLACE_PAYMENT" && paymentId !== null && (
        <Box>
          <ReplacementPaymentSection
            paymentId={paymentId}
            cause={cause}
            expiredToken={expiredToken}
            onTokenChange={onTokenChange}
          />
          {errorFor("replacementPreviewToken") && (
            <Typography variant="caption" color="error">
              {errorFor("replacementPreviewToken")}
            </Typography>
          )}
        </Box>
      )}
    </Stack>
  );
};

/** The cuotas the voided payment gives back, so the person sees the reach. */
const AllocationsBackToPending = ({ payment }: { payment: Payment | null }) => {
  const live = (payment?.allocations ?? []).filter((a) => !a.isVoided);
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Vuelven a quedar pendientes
      </Typography>
      {live.length === 0 ? (
        <Alert severity="info">Este pago no tiene cuotas aplicadas.</Alert>
      ) : (
        <Stack
          component="ul"
          spacing={0.5}
          sx={{ m: 0, p: 0, listStyle: "none" }}
        >
          {live.map((allocation) => (
            <Box
              component="li"
              key={allocation.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                border: 1,
                borderColor: "divider",
                borderRadius: 1.5,
                px: 1.5,
                py: 1,
              }}
            >
              <Typography variant="body2">
                {allocation.description ??
                  `Obligación N.º ${allocation.obligationId}`}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {formatMoney(allocation.amountApplied)}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default CorrectionDetailsStep;
