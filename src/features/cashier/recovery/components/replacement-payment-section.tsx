import { useEffect, useMemo, useState } from "react";
import { useDataProvider, useGetList } from "react-admin";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import type { AppDataProvider } from "@/app/data-provider";
import type { PaymentMethod, PaymentPreviewResponse } from "@/types/payment";
import type { RecoveryCause } from "@/types/payment-recovery";
import { formatMoney } from "@/utils/money";
import TenderLinesEditor from "@/features/cashier/tuition/components/tender-lines-editor";
import usePaymentDraft from "@/features/cashier/tuition/hooks/use-payment-draft";
import { lineFieldErrors } from "@/features/cashier/tuition/utils/payment-error";
import {
  toRecoveryError,
  type RecoveryApiError,
} from "@/features/cashier/recovery/utils/recovery-error";

const NO_METHODS: PaymentMethod[] = [];

interface Props {
  paymentId: number;
  cause: RecoveryCause | "";
  /** The single-use token while it still matches the lines and cause on screen; `null` otherwise. */
  onTokenChange: (token: string | null) => void;
  /** A token the backend refused: it is dropped here and the person recalculates. */
  expiredToken?: string | null;
}

/**
 * The correct payment, for a case being resolved as REPLACE_PAYMENT.
 *
 * "Calcular" asks the backend what it would record and returns a single-use
 * token bound to this payment and cause. Changing a line or the cause kills the
 * token on screen at once: the person recalculates instead of sending a token
 * the backend would refuse.
 */
export const ReplacementPaymentSection = ({
  paymentId,
  cause,
  onTokenChange,
  expiredToken = null,
}: Props) => {
  const dataProvider = useDataProvider<AppDataProvider>();
  const { data: methods = NO_METHODS, isLoading } = useGetList<PaymentMethod>(
    "payment-methods",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "id", order: "ASC" },
    },
  );
  const draft = usePaymentDraft(0, "", methods);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<RecoveryApiError | null>(null);
  const [preview, setPreview] = useState<{
    response: PaymentPreviewResponse;
    signature: string;
  } | null>(null);

  const signature = useMemo(
    () => JSON.stringify({ cause, lines: draft.lines }),
    [cause, draft.lines],
  );
  const current =
    preview?.signature === signature &&
    preview.response.previewToken !== expiredToken
      ? preview.response
      : null;
  const token = current?.previewToken ?? null;

  useEffect(() => onTokenChange(token), [token, onTokenChange]);

  const mutation = useMutation({
    mutationFn: (input: { cause: RecoveryCause; signature: string }) =>
      dataProvider
        .previewPaymentReplacement(paymentId, {
          cause: input.cause,
          lines: draft.lines ?? [],
        })
        .then((response) => ({ response, signature: input.signature }))
        .catch((failure) => {
          throw toRecoveryError(failure);
        }),
    onMutate: () => setError(null),
    onSuccess: setPreview,
    onError: (failure: RecoveryApiError) => setError(failure),
  });

  const calculate = () => {
    if (!draft.lines || !cause) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    mutation.mutate({ cause, signature });
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Pago correcto
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Registra cómo se pagó realmente. El pago anterior se deshace y este
        queda en su lugar, sin comprobante.
      </Typography>

      <TenderLinesEditor
        draft={draft}
        hideDate
        methods={methods}
        loadingMethods={isLoading}
        showErrors={showErrors}
        serverErrors={lineFieldErrors(error?.fieldErrors ?? {})}
        lastPlan={preview?.response.plan ?? null}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      )}

      {current ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          Listo para registrar un pago de {formatMoney(current.plan.amount)}. Si
          cambias algo, vuelve a calcular.
        </Alert>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={calculate}
            disabled={mutation.isPending}
            startIcon={
              mutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {preview ? "Recalcular" : "Calcular"}
          </Button>
          {!cause && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1.5 }}
            >
              Elige la causa primero.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ReplacementPaymentSection;
