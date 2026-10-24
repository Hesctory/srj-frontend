import { useCallback, useState } from "react";
import { useNotify, useRefresh } from "react-admin";
import { useInvalidatePendingPayments } from "./use-pending-payments";
import type {
  GeneratePaymentDocumentRequest,
  PaymentDocumentDetail,
} from "@/types/payment-document";
import {
  generatePaymentDocument,
  issuePaymentDocument,
  toPaymentDocumentError,
  type PaymentDocumentApiError,
} from "@/features/billing/api/payment-documents";

/**
 * Generating a comprobante and then filing it with SUNAT — two requests, one
 * hook, because the second only ever follows the first.
 *
 * The step is derived from what is in hand, never stored: no document means
 * there is nothing to file yet, and a document whose status left `PENDING`
 * means the filing went through. A failed `issue` therefore leaves the caller
 * looking at a document it can retry, not at a dead end.
 */
export type IssueStep = "idle" | "generated";

const useIssueDocument = () => {
  const notify = useNotify();
  const refresh = useRefresh();
  const invalidatePending = useInvalidatePendingPayments();

  const [detail, setDetail] = useState<PaymentDocumentDetail | null>(null);
  const [error, setError] = useState<PaymentDocumentApiError | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  const step: IssueStep = detail ? "generated" : "idle";

  const generate = useCallback(
    async (request: GeneratePaymentDocumentRequest) => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generatePaymentDocument(request);
        setDetail(result);
        notify("Comprobante generado", { type: "success" });
        // The payment left the backlog, so the sidebar badge, the toolbar badge
        // and the picker are all stale — they share one query key.
        void invalidatePending();
        refresh();
        return result;
      } catch (cause) {
        setError(toPaymentDocumentError(cause));
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [notify, refresh, invalidatePending],
  );

  const issue = useCallback(
    async (documentId: number) => {
      setIsIssuing(true);
      setError(null);
      try {
        const result = await issuePaymentDocument(documentId);
        setDetail(result);
        notify("Comprobante enviado a SUNAT", { type: "success" });
        refresh();
        return result;
      } catch (cause) {
        setError(toPaymentDocumentError(cause));
        return null;
      } finally {
        setIsIssuing(false);
      }
    },
    [notify, refresh],
  );

  const reset = useCallback(() => {
    setDetail(null);
    setError(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    step,
    detail,
    error,
    isGenerating,
    isIssuing,
    generate,
    issue,
    reset,
    dismissError,
  };
};

export default useIssueDocument;
