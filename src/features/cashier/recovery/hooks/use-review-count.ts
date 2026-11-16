import { useDataProvider } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import { RECOVERY_CASES_KEY } from "./use-recovery-mutations";

/**
 * Cases waiting for a person, for the sidebar badge. One row asked for, the
 * total read off `Content-Range`. `null` while loading or when it fails: a
 * badge is decoration and must not nag.
 */
export const useRecoveryReviewCount = (): number | null => {
  const dataProvider = useDataProvider();
  const { data } = useQuery({
    queryKey: [...RECOVERY_CASES_KEY, "review-count"],
    queryFn: async () => {
      const { total } = await dataProvider.getList("payment-recovery-cases", {
        pagination: { page: 1, perPage: 1 },
        sort: { field: "id", order: "DESC" },
        filter: { status: ["NEEDS_REVIEW"] },
      });
      return total ?? 0;
    },
    retry: false,
    staleTime: 30_000,
  });
  return data ?? null;
};
