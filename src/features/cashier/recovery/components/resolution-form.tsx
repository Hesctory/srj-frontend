import { useEffect, useState } from "react";
import { useGetOne } from "react-admin";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  PaymentRecoveryCase,
  RecoveryAction,
  RecoveryCause,
} from "@/types/payment-recovery";
import type { PaymentDocumentRecord } from "@/types/payment-document";
import FormGrid, { fullRowField } from "@/shared/components/form-grid";
import UnsavedChangesGuard from "@/shared/components/unsaved-changes-guard";
import { useResolveRecoveryCase } from "@/features/cashier/recovery/hooks/use-recovery-mutations";
import { useCreditNoteReasons } from "@/features/cashier/recovery/hooks/use-credit-note-reasons";
import {
  actionDescription,
  actionLabel,
  causeCommissionHint,
  causeLabel,
} from "@/features/cashier/recovery/utils/labels";
import {
  VERSION_CONFLICT_MESSAGE,
  type RecoveryApiError,
} from "@/features/cashier/recovery/utils/recovery-error";
import ReplacementPaymentSection from "./replacement-payment-section";

const ACTIONS: RecoveryAction[] = [
  "VOID_DOCUMENT",
  "REPLACE_DOCUMENT",
  "VOID_PAYMENT",
  "REPLACE_PAYMENT",
  "REPAIR_INCONSISTENCY",
];

const CAUSES: RecoveryCause[] = [
  "TYPING_ERROR",
  "PAYER_CHANGED_AMOUNT",
  "OTHER",
  "INCONSISTENCY_DETECTED",
];

const isPaymentAction = (action: RecoveryAction | "") =>
  action === "VOID_PAYMENT" || action === "REPLACE_PAYMENT";

/** An inconsistency is never the reason to undo or redo a payment. */
const causesFor = (action: RecoveryAction | "") =>
  isPaymentAction(action)
    ? CAUSES.filter((cause) => cause !== "INCONSISTENCY_DETECTED")
    : CAUSES;

interface Props {
  record: PaymentRecoveryCase;
  onResolved: (updated: PaymentRecoveryCase) => void;
  onDirtyChange: (dirty: boolean) => void;
}

/**
 * How a person settles a case that needs one. Opens with the case's current
 * action and cause so only what changes has to be touched; a cause that the new
 * action forbids is cleared, not silently rewritten.
 */
export const ResolutionForm = ({
  record,
  onResolved,
  onDirtyChange,
}: Props) => {
  const mutation = useResolveRecoveryCase();

  const initialCause =
    record.action && isPaymentAction(record.action)
      ? record.cause === "INCONSISTENCY_DETECTED"
        ? ""
        : (record.cause ?? "")
      : (record.cause ?? "");

  const [action, setAction] = useState<RecoveryAction | "">(
    record.action ?? "",
  );
  const [cause, setCause] = useState<RecoveryCause | "">(initialCause);
  const [justification, setJustification] = useState("");
  const [reasonCode, setReasonCode] = useState(
    record.creditNoteReasonCode ?? "",
  );
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<RecoveryApiError | null>(null);
  const [conflict, setConflict] = useState(false);
  const [touched, setTouched] = useState(false);

  const dirty =
    action !== (record.action ?? "") ||
    cause !== initialCause ||
    justification !== "" ||
    reasonCode !== (record.creditNoteReasonCode ?? "");
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  // The reason is only asked when SUNAT already accepted the comprobante.
  const { data: document } = useGetOne<PaymentDocumentRecord>(
    "payment-documents",
    { id: record.documentId ?? 0 },
    { enabled: record.documentId !== null },
  );
  const needsReason = document?.sunatStatusCode === "ACCEPTED";
  const { data: reasons = [] } = useCreditNoteReasons(needsReason);

  const switchingToReplacement =
    action === "REPLACE_PAYMENT" && record.action !== "REPLACE_PAYMENT";
  const canPreview = switchingToReplacement && record.paymentId !== null;

  const changeAction = (next: RecoveryAction) => {
    setAction(next);
    if (isPaymentAction(next) && cause === "INCONSISTENCY_DETECTED") {
      setCause("");
    }
  };

  const problems: Record<string, string> = {};
  if (!action) problems.action = "Elige qué hacer con el caso.";
  if (!cause) problems.cause = "Elige la causa.";
  if (!justification.trim())
    problems.justification = "Explica por qué se resuelve así.";
  if (needsReason && !reasonCode)
    problems.creditNoteReasonCode = "Elige el motivo de la nota de crédito.";
  if (switchingToReplacement && !token)
    problems.replacementPreviewToken =
      "Calcula el pago correcto antes de guardar.";

  const serverProblems = error?.status === 422 ? error.fieldErrors : {};
  const fieldError = (field: string) =>
    (touched ? problems[field] : undefined) ?? serverProblems[field];
  const generalError =
    error && !conflict && Object.keys(serverProblems).length === 0
      ? error.message
      : null;

  const submit = () => {
    setTouched(true);
    if (Object.keys(problems).length > 0 || !action || !cause) return;
    setError(null);
    setConflict(false);
    mutation.mutate(
      {
        id: record.id,
        body: {
          expectedVersion: record.version,
          action,
          cause,
          justification: justification.trim(),
          creditNoteReasonCode: needsReason ? reasonCode : null,
          replacementPreviewToken: switchingToReplacement ? token : null,
        },
      },
      {
        onSuccess: (updated) => {
          onDirtyChange(false);
          onResolved(updated);
        },
        onError: (failure) => {
          setError(failure);
          setConflict(failure.isConflict);
        },
      },
    );
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <UnsavedChangesGuard when={dirty && !mutation.isPending} />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Elige cómo terminar este caso. El sistema lo continúa solo apenas lo
        guardes.
      </Typography>

      {conflict && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {VERSION_CONFLICT_MESSAGE}
        </Alert>
      )}
      {generalError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {generalError}
        </Alert>
      )}

      <Stack spacing={3}>
        <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
          <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
            Acción
          </Typography>
          <RadioGroup
            value={action}
            onChange={(event) =>
              changeAction(event.target.value as RecoveryAction)
            }
          >
            {ACTIONS.map((option) => (
              <FormControlLabel
                key={option}
                value={option}
                control={<Radio />}
                sx={{
                  alignItems: "flex-start",
                  m: 0,
                  mb: 1,
                  px: 1.5,
                  py: 1,
                  border: 1,
                  borderRadius: 1.5,
                  borderColor: action === option ? "primary.main" : "divider",
                }}
                label={
                  <Box sx={{ pt: 0.75 }}>
                    <Typography fontWeight={600}>
                      {actionLabel(option)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {actionDescription(option)}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
          {fieldError("action") && (
            <Typography variant="caption" color="error">
              {fieldError("action")}
            </Typography>
          )}
        </Box>

        <FormGrid minColumnWidth={260}>
          <TextField
            select
            label="Causa"
            value={cause}
            onChange={(event) => setCause(event.target.value as RecoveryCause)}
            error={Boolean(fieldError("cause"))}
            helperText={
              fieldError("cause") ??
              (cause
                ? causeCommissionHint(cause)
                : isPaymentAction(action)
                  ? "«Inconsistencia detectada» no sirve para anular o reemplazar un pago."
                  : " ")
            }
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
              value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value)}
              error={Boolean(fieldError("creditNoteReasonCode"))}
              helperText={
                fieldError("creditNoteReasonCode") ??
                "SUNAT ya aceptó el comprobante: se anula con una nota de crédito."
              }
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
            value={justification}
            onChange={(event) => setJustification(event.target.value)}
            error={Boolean(fieldError("justification"))}
            helperText={fieldError("justification") ?? " "}
            multiline
            minRows={3}
            fullWidth
            sx={fullRowField}
          />
        </FormGrid>

        {switchingToReplacement &&
          (canPreview ? (
            <ReplacementPaymentSection
              paymentId={record.paymentId as number}
              cause={cause}
              onTokenChange={setToken}
            />
          ) : (
            <Alert severity="warning">
              Este caso no tiene un pago asociado, así que no se puede
              reemplazar un pago.
            </Alert>
          ))}
        {touched && problems.replacementPreviewToken && canPreview && (
          <Typography variant="caption" color="error">
            {problems.replacementPreviewToken}
          </Typography>
        )}

        <Box>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
            startIcon={
              mutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            Guardar resolución
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default ResolutionForm;
