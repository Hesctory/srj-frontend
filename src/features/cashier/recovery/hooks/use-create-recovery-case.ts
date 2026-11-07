import { useDataProvider } from "react-admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AppDataProvider } from "@/app/data-provider";
import type {
  CreatePaymentRecoveryCaseRequest,
  PaymentRecoveryCase,
} from "@/types/payment-recovery";
import {
  toRecoveryError,
  type RecoveryApiError,
} from "@/features/cashier/recovery/utils/recovery-error";
import { RECOVERY_CASES_KEY } from "./use-recovery-mutations";

interface Input {
  target: { documentId: number } | { paymentId: number };
  body: CreatePaymentRecoveryCaseRequest;
}

/**
 * Opens a correction on a comprobante (document actions) or on a payment
 * (payment actions). Refreshes the lists and the open-case lookups so the
 * rows lock at once.
 */
export const useCreateRecoveryCase = () => {
  const provider = useDataProvider<AppDataProvider>();
  const client = useQueryClient();
  return useMutation<PaymentRecoveryCase, RecoveryApiError, Input>({
    mutationFn: ({ target, body }) =>
      ("documentId" in target
        ? provider.createDocumentRecoveryCase(target.documentId, body)
        : provider.createPaymentRecoveryCase(target.paymentId, body)
      ).catch((cause) => {
        throw toRecoveryError(cause);
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: RECOVERY_CASES_KEY });
      void client.invalidateQueries({ queryKey: ["payments"] });
      void client.invalidateQueries({ queryKey: ["payment-documents"] });
    },
  });
};
