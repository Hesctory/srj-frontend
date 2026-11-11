import { useDataProvider } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import type { PaymentRecoveryCase } from "@/types/payment-recovery";
import { RECOVERY_CASES_KEY } from "./use-recovery-mutations";
import { OPEN_STATUSES } from "@/features/cashier/recovery/utils/tabs";

export type RecoveryTarget = { documentId: number } | { paymentId: number };

/** The part of a payment or comprobante record this hook reads. */
export interface RecordWithOpenCase {
  openRecoveryCaseId?: number | null;
}

/**
 * The correction in progress on a comprobante or a payment, if any.
 *
 * With the record in hand, its `openRecoveryCaseId` is the answer: a number
 * loads that case, `null` means there is none (no list query at all). Without
 * a record (or a record from before the field existed, where it is
 * `undefined`) it asks the list for the target's cases that are not finished.
 * Pass `null` as the target while it is not known yet; the hook stays idle.
 */
export const useOpenRecoveryCase = (
  target: RecoveryTarget | null,
  record?: RecordWithOpenCase | null,
) => {
  const dataProvider = useDataProvider();
  const knownId = record?.openRecoveryCaseId;
  const hasAnswer = knownId !== undefined;

  const byId = useQuery({
    queryKey: [...RECOVERY_CASES_KEY, "open-by-id", knownId],
    enabled: typeof knownId === "number",
    queryFn: async () => {
      const { data } = await dataProvider.getOne<PaymentRecoveryCase>(
        "payment-recovery-cases",
        { id: knownId as number },
      );
      return data;
    },
  });

  const byList = useQuery({
    queryKey: [...RECOVERY_CASES_KEY, "open", target],
    enabled: target !== null && !hasAnswer,
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

  if (hasAnswer) {
    return {
      openCase: byId.data ?? null,
      isLoading: typeof knownId === "number" && byId.isPending,
      error: byId.error,
    };
  }
  return {
    openCase: byList.data ?? null,
    isLoading: byList.isPending && target !== null,
    error: byList.error,
  };
};
