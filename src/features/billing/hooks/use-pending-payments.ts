import { useMemo } from "react";
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { PendingPaymentDocument } from "@/types/payment";
import {
  fetchPendingPayments,
  fetchPendingPaymentsCount,
} from "@/features/billing/api/payment-documents";

/**
 * Payments still waiting for a comprobante.
 *
 * Two components want this at once — the sidebar badge and the list toolbar —
 * and a third (the issuing dialog) wants the rows. They go through react-query
 * under a shared key so all of that collapses into one request, and so that
 * issuing a document can invalidate every reader at once. Doing it with
 * `useState` + `useEffect` meant four fetches on mount and a badge that stayed
 * stale after the backlog changed.
 */

export const PENDING_PAYMENTS_KEY = ["payments", "pending-documents"] as const;

/** Call after anything that removes a payment from the backlog. */
export const invalidatePendingPayments = (client: QueryClient) =>
  client.invalidateQueries({ queryKey: PENDING_PAYMENTS_KEY });

/**
 * The rows, oldest first.
 *
 * The endpoint takes neither `filter` nor `sort`, so the ordering is applied
 * here over the page that came back. That is honest only within the loaded
 * page — which is fine, since a list long enough for that to matter is itself
 * the problem being surfaced.
 */
export const usePendingPayments = (enabled = true) => {
  const query = useQuery({
    queryKey: [...PENDING_PAYMENTS_KEY, "list"],
    queryFn: () => fetchPendingPayments(),
    enabled,
    // A stale backlog is worse than a refetch: the whole point is knowing what
    // is still owed right now.
    staleTime: 0,
  });

  const rows = useMemo(
    () =>
      [...(query.data?.rows ?? [])].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      ),
    [query.data],
  );

  return {
    rows: rows as PendingPaymentDocument[],
    total: query.data?.total ?? 0,
    isLoading: query.isPending,
    error: query.error,
    reload: query.refetch,
  };
};

/**
 * Just the number, for the sidebar badge. Asks for a single row and reads the
 * total off `Content-Range` — the rows themselves are never needed here.
 *
 * Returns `null` rather than throwing or notifying: a badge is decoration, and
 * one that cannot be read should simply not appear. `retry: false` keeps a
 * logged-out or unreachable backend from being hammered on every render of the
 * shell.
 */
export const usePendingPaymentsCount = (): number | null => {
  const { data } = useQuery({
    queryKey: [...PENDING_PAYMENTS_KEY, "count"],
    queryFn: fetchPendingPaymentsCount,
    retry: false,
    staleTime: 30_000,
  });

  return data ?? null;
};

/** Handle for callers that need to invalidate without importing the client. */
export const useInvalidatePendingPayments = () => {
  const client = useQueryClient();
  return () => invalidatePendingPayments(client);
};
