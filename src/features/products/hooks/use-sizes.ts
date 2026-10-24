import { useMemo } from "react";
import { useGetList } from "react-admin";
import type { Size } from "@/types/product";

/**
 * The size ladder, from the backend.
 *
 * This replaces a hardcoded `sizeChoices` array that had drifted from what the
 * school sells in both directions: it offered a size 18 the school has never
 * sold, and omitted 2, 3, 4, 5, 6 and 8 — sizes it sells every year. A fixed
 * list is a reasonable shape for a fixed list, but only if something keeps it
 * honest, and nothing did.
 *
 * Ordering is by `sortOrder`, never by `code`. The ladder runs `2 4 6 … 16`
 * then `XS S M L XL XXL`, so a string sort puts "10" before "2" and scrambles
 * the letters against the numbers. That order is also a price fact — the school
 * prices runs of consecutive sizes and steps them up — so getting it wrong
 * silently corrupts the band editor, not just the display.
 */
export const useSizes = (sizeScaleId?: number | string | null) => {
  const { data, isLoading } = useGetList<Size>("sizes", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "sortOrder", order: "ASC" },
  });

  const sizes = useMemo(() => {
    const rows = data ?? [];
    // Coerced, not compared strictly: a select hands its value back as a string
    // ("2"), while the API sends a number (2). Strict equality between the two
    // silently yields an empty ladder — a form that offers no sizes at all,
    // which looks like missing data rather than a type mismatch.
    const scopeId =
      sizeScaleId == null || sizeScaleId === ("" as unknown)
        ? null
        : Number(sizeScaleId);
    const scoped =
      scopeId == null || Number.isNaN(scopeId)
        ? rows
        : rows.filter((size) => Number(size.sizeScaleId) === scopeId);
    // The server sorts, but a client-side re-sort costs nothing and makes the
    // ladder invariant local — every consumer below can rely on it.
    return [...scoped].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [data, sizeScaleId]);

  return { sizes, isLoading };
};

export default useSizes;
