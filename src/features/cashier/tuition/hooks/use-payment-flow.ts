import { useCallback, useState } from "react";
import { useNotify, useRefresh } from "react-admin";
import type {
  ConfirmPaymentResponse,
  IsoDate,
  PaymentLine,
  PaymentPreviewResponse,
} from "@/types/payment";
import {
  confirmPayment,
  previewPayment,
  toPaymentError,
  type PaymentApiError,
} from "@/features/cashier/tuition/api/payments";

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
  const notify = useNotify();
  const refresh = useRefresh();

  const [preview, setPreview] = useState<PaymentPreviewResponse | null>(null);
  const [receipt, setReceipt] = useState<ConfirmPaymentResponse | null>(null);
  const [error, setError] = useState<PaymentApiError | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const step: PaymentStep = receipt ? "done" : preview ? "review" : "compose";

  const runPreview = useCallback(
    // `date` omitted falls back to the server's today in Peru.
    async (input: { date?: IsoDate; lines: PaymentLine[] }) => {
      setIsPreviewing(true);
      setError(null);
      try {
        setPreview(await previewPayment({ ...scope, ...input }));
      } catch (cause) {
        setError(toPaymentError(cause));
      } finally {
        setIsPreviewing(false);
      }
    },
    // `scope` is a fresh object each render; its contents are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scope.enrollmentId, scope.studentId, String(scope.obligationIds)],
  );

  const confirm = useCallback(async () => {
    if (!preview) return;
    setIsConfirming(true);
    setError(null);
    try {
      const response = await confirmPayment(preview.previewToken);
      setReceipt(response);
      notify("Pago registrado correctamente", { type: "success" });
      refresh();
    } catch (cause) {
      const failure = toPaymentError(cause);
      setError(failure);
      // 409 (stale plan) and 404 (dead or spent token) both mean the plan on
      // screen is fiction. Tear it down so the only way forward is a new one.
      if (failure.isStale || failure.status === 404) {
        setPreview(null);
        refresh();
      }
    } finally {
      setIsConfirming(false);
    }
  }, [preview, notify, refresh]);

  /** Back to the form, keeping the draft. The token is simply abandoned. */
  const editDraft = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    setReceipt(null);
    setError(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    step,
    preview,
    receipt,
    error,
    isPreviewing,
    isConfirming,
    runPreview,
    confirm,
    editDraft,
    reset,
    dismissError,
  };
};

export default usePaymentFlow;
