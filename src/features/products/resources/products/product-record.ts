import type { ProductDetail, ProductVersion } from "@/types/product";

/**
 * Guards against the two ways the editor can be handed a record it cannot use.
 *
 * **1. A list row masquerading as a detail.** `useGetList` optimistically seeds
 * the `getOne` cache with every row it fetches (ra-core `useGetList`,
 * "optimistically populate the getOne cache"). A row from `GET /api/products`
 * is a `ProductList`, which has no `versions` at all — so clicking a row in the
 * list renders `<Edit>` with a record whose `versions` is `undefined`, and any
 * `.find`/`.map` on it throws. A hard refresh worked only because an empty
 * cache forced a real `getOne`.
 *
 * The distinction that matters is `undefined` vs `null`: absent means "this is
 * the list projection, the detail is still coming", while null or empty means
 * "the backend says this product genuinely has no versions". Conflating them
 * would show "this product has no versions" for a heartbeat on every navigation.
 *
 * **2. Nullable arrays.** `versions`, `variants` and `offerings` are each
 * nullable in the contract, so every level needs a floor before anything
 * iterates it.
 */

export interface NormalizedProduct extends ProductDetail {
  versions: ProductVersion[];
}

export interface ProductRecordState {
  /** Safe to render: every array is present. Null while the detail is pending. */
  product: NormalizedProduct | null;
  /** True when all we have is the cached list row. */
  isPartial: boolean;
}

export const normalizeProductRecord = (
  record: Partial<ProductDetail> | undefined,
): ProductRecordState => {
  if (!record) return { product: null, isPartial: false };

  // Absent (not null) means the record came from the list cache.
  if (record.versions === undefined) {
    return { product: null, isPartial: true };
  }

  const versions = (record.versions ?? []).map<ProductVersion>((version) => ({
    ...version,
    variants: (version.variants ?? []).map((variant) => ({
      ...variant,
      offerings: variant.offerings ?? [],
    })),
  }));

  return {
    product: { ...(record as ProductDetail), versions },
    isPartial: false,
  };
};
