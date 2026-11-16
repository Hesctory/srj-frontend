import { useDataProvider } from "react-admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AppDataProvider } from "@/app/data-provider";
import type {
  PaymentRecoveryCase,
  PaymentRecoveryScanResult,
  ResolvePaymentRecoveryCaseRequest,
} from "@/types/payment-recovery";
import {
  toRecoveryError,
  type RecoveryApiError,
} from "@/features/cashier/recovery/utils/recovery-error";

/** Prefix of every React Admin and badge query about cases. */
export const RECOVERY_CASES_KEY = ["payment-recovery-cases"] as const;

const useRecoveryProvider = () => useDataProvider<AppDataProvider>();

/** Reloads every list, detail and the menu badge after a write. */
const useInvalidateCases = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: RECOVERY_CASES_KEY });
};

export const useResumeRecoveryCase = () => {
  const provider = useRecoveryProvider();
  const invalidate = useInvalidateCases();
  return useMutation<PaymentRecoveryCase, RecoveryApiError, number>({
    mutationFn: (id) =>
      provider.resumeRecoveryCase(id).catch((cause) => {
        throw toRecoveryError(cause);
      }),
    onSettled: invalidate,
  });
};

export const useResolveRecoveryCase = () => {
  const provider = useRecoveryProvider();
  const invalidate = useInvalidateCases();
  return useMutation<
    PaymentRecoveryCase,
    RecoveryApiError,
    { id: number; body: ResolvePaymentRecoveryCaseRequest }
  >({
    mutationFn: ({ id, body }) =>
      provider.resolveRecoveryCase(id, body).catch((cause) => {
        throw toRecoveryError(cause);
      }),
    onSettled: invalidate,
  });
};

export const useScanRecoveryCases = () => {
  const provider = useRecoveryProvider();
  const invalidate = useInvalidateCases();
  return useMutation<PaymentRecoveryScanResult, RecoveryApiError, void>({
    mutationFn: () =>
      provider.scanRecoveryCases().catch((cause) => {
        throw toRecoveryError(cause);
      }),
    onSettled: invalidate,
  });
};
