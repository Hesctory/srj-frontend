import type { UpdateProductLine } from "@/types/product";
import { PRODUCT_TYPE_GARMENT } from "./product-constants";

/** The line's own fields: what `PUT /api/products/:id/line` accepts. */
export const LINE_FIELDS = [
  "name",
  "productTypeId",
  "garmentGenderId",
  "sizeScaleId",
  "isActive",
] as const;

/**
 * Only a garment names a gender and a size scale. Switching the type away
 * leaves the hidden inputs holding their old values, so they are cleared here
 * rather than sent.
 */
export const productLineTransform = (
  data: Partial<Record<(typeof LINE_FIELDS)[number], unknown>>,
): UpdateProductLine => {
  const isGarment = Number(data.productTypeId) === PRODUCT_TYPE_GARMENT;
  return {
    name: (data.name as string | null) ?? null,
    productTypeId: Number(data.productTypeId),
    garmentGenderId: isGarment
      ? ((data.garmentGenderId as number | null) ?? null)
      : null,
    sizeScaleId: isGarment
      ? ((data.sizeScaleId as number | null) ?? null)
      : null,
    isActive: (data.isActive as boolean | undefined) ?? true,
  };
};
