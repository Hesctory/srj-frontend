import { useDataProvider } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import type { PaymentRecoveryCase } from "@/types/payment-recovery";
import { RECOVERY_CASES_KEY } from "./use-recovery-mutations";
import { OPEN_STATUSES } from "@/features/cashier/recovery/utils/tabs";

export type RecoveryTarget = { documentId: number } | { paymentId: number };

/**
 * The correction in progress on a comprobante or a payment, if any.
 *
 * Until the backend exposes `openRecoveryCaseId` this asks the list for the
 * target's cases that are not finished. Pass `null` while the target is not
 * known yet; the query then stays idle.
 */
export const useOpenRecoveryCase = (target: RecoveryTarget | null) => {
  const dataProvider = useDataProvider();
  const query = useQuery({
    queryKey: [...RECOVERY_CASES_KEY, "open", target],
    enabled: target !== null,
    queryFn: async () => {
      const { data } = await dataProvider.getList<PaymentRecoveryCase>(
        "payment-recovery-cases",
        {
          pagination: { page: 1, perPage: 1 },
          sort: { field: "id", order: "DESC" },
          filter: { ...target, status: OPEN_STATUSES },
        },
      );
      return data[0] ?? null;
    },
  });

  return {
    openCase: query.data ?? null,
    isLoading: query.isPending && target !== null,
    error: query.error,
  };
};
