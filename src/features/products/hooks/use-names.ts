import { useMemo } from "react";
import { useGetList } from "react-admin";

interface Named {
  id: number;
  name: string | null;
}

/** id → name for a small reference list (product types, genders, scales). */
export const useNames = (resource: string) => {
  const { data } = useGetList<Named>(resource, {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "id", order: "ASC" },
  });
  return useMemo(
    () => new Map((data ?? []).map((row) => [row.id, row.name])),
    [data],
  );
};

export default useNames;
