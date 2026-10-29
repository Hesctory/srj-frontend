import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDataProvider, useNotify, useRefresh } from "react-admin";
import type { AppDataProvider } from "@/app/data-provider";
import type {
  ConfirmPaymentResponse,
  IsoDate,
  PaymentLine,
  PaymentPlan,
  PaymentPreviewResponse,
} from "@/types/payment";
import {
  toPaymentError,
  type PaymentApiError,
} from "@/features/cashier/tuition/utils/payment-error";

/**
 * The two-request payment flow, as a three-step machine.
 *
 *   compose → review → done
 *
 * The step is *derived*, never stored: a preview in hand means there is a plan
 * to review, a receipt means the money moved. That way a failed confirmation
 * that invalidates the token drops the cashier straight back to the form
 * instead of stranding them on a plan the server no longer honours.
 */

export type PaymentStep = "compose" | "review" | "done";

/** One of `enrollmentId` / `studentId` / `obligationIds` — see the contract. */
export interface PaymentScope {
  enrollmentId?: number;
  studentId?: number;
  obligationIds?: number[];
}

const usePaymentFlow = (scope: PaymentScope) => {
  const dataProvider = useDataProvider<AppDataProvider>();
  const notify = useNotify();
  const refresh = useRefresh();

  const [preview, setPreview] = useState<PaymentPreviewResponse | null>(null);
  // Outlives "Volver a editar", so the form can show each card line's
  // suggested commission while the cashier types the one on the slip.
  const [lastPlan, setLastPlan] = useState<PaymentPlan | null>(null);
  const [receipt, setReceipt] = useState<ConfirmPaymentResponse | null>(null);
  const [error, setError] = useState<PaymentApiError | null>(null);

  const step: PaymentStep = receipt ? "done" : preview ? "review" : "compose";

  const previewMutation = useMutation({
    // `date` omitted falls back to the server's today in Peru.
    mutationFn: (input: { date?: IsoDate; lines: PaymentLine[] }) =>
      dataProvider.previewEnrollmentPayment({ ...scope, ...input }),
    onMutate: () => setError(null),
    onSuccess: (response) => {
      setPreview(response);
      setLastPlan(response.plan);
    },
    onError: (cause) => setError(toPaymentError(cause)),
  });

  const confirmMutation = useMutation({
    mutationFn: (previewToken: string) =>
      dataProvider.confirmEnrollmentPayment(previewToken),
    onMutate: () => setError(null),
    onSuccess: (response) => {
      setReceipt(response);
      notify("Pago registrado correctamente", { type: "success" });
      refresh();
    },
    onError: (cause) => {
      const failure = toPaymentError(cause);
      setError(failure);
      // 409 (stale plan) and 404 (dead or spent token) both mean the plan on
      // screen is fiction. Tear it down so the only way forward is a new one.
      if (failure.isStale || failure.status === 404) {
        setPreview(null);
        refresh();
      }
    },
  });

  const { mutate: runPreview } = previewMutation;
  const { mutate: confirmToken } = confirmMutation;

  const confirm = useCallback(() => {
    if (preview) confirmToken(preview.previewToken);
  }, [preview, confirmToken]);

  /** Back to the form, keeping the draft. The token is simply abandoned. */
  const editDraft = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    setLastPlan(null);
    setReceipt(null);
    setError(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    step,
    preview,
    lastPlan,
    receipt,
    error,
    isPreviewing: previewMutation.isPending,
    isConfirming: confirmMutation.isPending,
    runPreview,
    confirm,
    editDraft,
    reset,
    dismissError,
  };
};

export default usePaymentFlow;
