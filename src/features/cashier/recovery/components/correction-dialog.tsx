import { useCallback, useState } from "react";
import { useCreatePath, useGetOne } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { Payment } from "@/types/payment";
import type { PaymentDocumentRecord } from "@/types/payment-document";
import type { RecoveryAction } from "@/types/payment-recovery";
import { useCreateRecoveryCase } from "@/features/cashier/recovery/hooks/use-create-recovery-case";
import { useCreditNoteReasons } from "@/features/cashier/recovery/hooks/use-credit-note-reasons";
import {
  DOCUMENT_ACTIONS,
  PAYMENT_ACTIONS,
  correctionChoice,
  isPaymentAction,
} from "@/features/cashier/recovery/utils/correction";
import { createCaseErrorMessage } from "@/features/cashier/recovery/utils/recovery-error";
import CorrectionConfirmStep from "./correction-confirm-step";
import CorrectionDetailsStep, {
  type CorrectionForm,
} from "./correction-details-step";

export interface CorrectionDialogProps {
  open: boolean;
  onClose: () => void;
  /** The comprobante to correct; `null` when the target has none (document actions are not offered). */
  documentId: number | null;
  /** Its payment; `null` hides the payment actions. */
  paymentId: number | null;
  /** Shown as what is being corrected, e.g. "B001-00000012". */
  documentNumber?: string | null;
}

const STEPS = ["Qué corregir", "Detalles", "Confirmar"];

const EMPTY_FORM: CorrectionForm = {
  action: "",
  cause: "",
  justification: "",
  reasonCode: "",
  relationship: "",
  payerName: "",
  token: null,
};

/**
 * Opens a correction in three steps: what to correct, the details, and a plain
 * summary before it is sent. Document actions open the case on the
 * comprobante; payment actions open it on the payment.
 *
 * A request id is minted when the dialog opens and kept for every retry, so a
 * double submit opens one case.
 */
export const CorrectionDialog = (props: CorrectionDialogProps) =>
  props.open ? <CorrectionDialogBody {...props} /> : null;

const CorrectionDialogBody = ({
  onClose,
  documentId,
  paymentId,
  documentNumber,
}: CorrectionDialogProps) => {
  const navigate = useNavigate();
  const createPath = useCreatePath();
  const fullScreen = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down("sm"),
  );
  const [requestId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CorrectionForm>(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [expiredToken, setExpiredToken] = useState<string | null>(null);
  const mutation = useCreateRecoveryCase();
  const change = useCallback(
    (patch: Partial<CorrectionForm>) =>
      setForm((current) => ({ ...current, ...patch })),
    [],
  );

  const { action } = form;
  const paymentAction = isPaymentAction(action);

  const payment = useGetOne<Payment>(
    "payments",
    { id: paymentId ?? 0 },
    { enabled: paymentId !== null },
  );
  const relevantId = paymentAction
    ? (payment.data?.activeDocumentId ?? null)
    : documentId;
  const relevant = useGetOne<PaymentDocumentRecord>(
    "payment-documents",
    { id: relevantId ?? 0 },
    { enabled: relevantId !== null },
  );
  const needsReason =
    relevant.data?.sunatStatusCode === "ACCEPTED" && !relevant.data.isVoided;
  const { data: reasons = [] } = useCreditNoteReasons(needsReason);
  const reasonName =
    reasons.find((reason) => reason.code === form.reasonCode)?.name ?? null;

  const lookingUp =
    (paymentAction && paymentId !== null && payment.isPending) ||
    (relevantId !== null && relevant.isPending);
  const lookupFailed =
    (paymentAction && payment.isError) ||
    (relevantId !== null && relevant.isError);

  const dirty =
    form.justification.trim() !== "" ||
    form.cause !== "" ||
    form.payerName !== "" ||
    form.token !== null;

  const requestClose = () => {
    if (mutation.isPending) return;
    if (
      dirty &&
      !window.confirm("Hay datos sin guardar. ¿Cerrar y descartarlos?")
    )
      return;
    onClose();
  };

  const problems: Record<string, string> = {};
  if (!form.cause) problems.cause = "Elige la causa.";
  if (!form.justification.trim())
    problems.justification = "Explica por qué se corrige.";
  if (needsReason && !form.reasonCode)
    problems.creditNoteReasonCode = "Elige el motivo de la nota de crédito.";
  if (
    action === "REPLACE_DOCUMENT" &&
    form.relationship === "OTRO" &&
    !form.payerName.trim()
  )
    problems.payerName = "Escribe el nombre de quien pagó.";
  if (action === "REPLACE_PAYMENT" && !form.token)
    problems.replacementPreviewToken =
      "Calcula el pago correcto antes de continuar.";

  const error = mutation.error;
  const serverFields = error?.status === 422 ? error.fieldErrors : {};
  const errorFor = (field: string) =>
    (touched ? problems[field] : undefined) ?? serverFields[field];
  const generalError =
    error && Object.keys(serverFields).length === 0
      ? createCaseErrorMessage(error)
      : null;

  const chooseAction = (next: RecoveryAction) => {
    mutation.reset();
    // Each action asks different things: a token or a payer note must not travel along.
    setForm((current) => ({
      ...current,
      action: next,
      cause: "",
      reasonCode: "",
      relationship: "",
      payerName: "",
      token: null,
    }));
    setTouched(false);
  };

  const next = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    setTouched(true);
    if (Object.keys(problems).length === 0) setStep(2);
  };

  const submit = () => {
    if (!action || !form.cause) return;
    const target =
      paymentAction && paymentId !== null
        ? { paymentId }
        : { documentId: documentId as number };
    mutation.mutate(
      {
        target,
        body: {
          requestId,
          action,
          cause: form.cause,
          justification: form.justification.trim(),
          ...(needsReason ? { creditNoteReasonCode: form.reasonCode } : {}),
          ...(action === "REPLACE_PAYMENT"
            ? { replacementPreviewToken: form.token }
            : {}),
          ...(action === "REPLACE_DOCUMENT" && form.relationship
            ? {
                payerRelationship: form.relationship,
                ...(form.relationship === "OTRO"
                  ? { payerName: form.payerName.trim() }
                  : {}),
              }
            : {}),
        },
      },
      {
        onSuccess: (created) => {
          onClose();
          navigate(
            createPath({
              resource: "payment-recovery-cases",
              type: "show",
              id: created.id,
            }),
          );
        },
        onError: (failure) => {
          // The single-use token is spent or refused: only a new preview helps.
          if (
            action === "REPLACE_PAYMENT" &&
            (failure.status === 409 ||
              failure.fieldErrors.replacementPreviewToken)
          ) {
            setExpiredToken(form.token);
          }
          if (failure.status === 422) setStep(1);
        },
      },
    );
  };

  const available = [
    ...(documentId !== null ? DOCUMENT_ACTIONS : []),
    ...(paymentId !== null ? PAYMENT_ACTIONS : []),
  ];
  const targetLabel =
    paymentAction && paymentId !== null
      ? `Pago N.º ${paymentId}`
      : `Comprobante ${documentNumber ?? `N.º ${documentId}`}`;
  const sending = mutation.isPending;

  return (
    <Dialog
      open
      onClose={requestClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      aria-labelledby="correction-title"
    >
      <DialogTitle id="correction-title">Corregir</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {generalError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}
        {error?.status === 422 && Object.keys(serverFields).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}
        {lookupFailed && (
          <Alert severity="error" sx={{ mb: 2 }}>
            No se pudo cargar el pago o el comprobante. Cierra e inténtalo de
            nuevo.
          </Alert>
        )}

        {step === 0 && (
          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
            <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
              ¿Qué quieres corregir?
            </Typography>
            <RadioGroup
              value={action}
              onChange={(event) =>
                chooseAction(event.target.value as RecoveryAction)
              }
            >
              {available.map((option) => {
                const choice = correctionChoice(option);
                return (
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
                      borderColor:
                        action === option ? "primary.main" : "divider",
                    }}
                    label={
                      <Box sx={{ pt: 0.75 }}>
                        <Typography fontWeight={600}>{choice.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {choice.text}
                        </Typography>
                      </Box>
                    }
                  />
                );
              })}
            </RadioGroup>
          </Box>
        )}

        {/* Kept mounted once reached: the replacement payment lives in it. */}
        {action && step >= 1 && (
          <Box hidden={step !== 1}>
            <CorrectionDetailsStep
              form={form}
              onChange={change}
              needsReason={needsReason}
              payment={payment.data ?? null}
              paymentId={paymentId}
              expiredToken={expiredToken}
              disabled={sending}
              errorFor={errorFor}
            />
          </Box>
        )}
        {step === 2 && (
          <CorrectionConfirmStep
            form={form}
            needsReason={needsReason}
            reasonName={reasonName}
            targetLabel={targetLabel}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={requestClose} disabled={sending}>
          Cancelar
        </Button>
        <Box flexGrow={1} />
        {step > 0 && (
          <Button onClick={() => setStep(step - 1)} disabled={sending}>
            Atrás
          </Button>
        )}
        {step < 2 ? (
          <Button
            variant="contained"
            onClick={next}
            disabled={!action || lookingUp || lookupFailed}
          >
            Continuar
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={submit}
            disabled={sending}
            startIcon={
              sending ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            Crear corrección
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CorrectionDialog;
