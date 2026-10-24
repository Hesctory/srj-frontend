import type { CreateProduct } from "@/types/product";
import type { PriceCell } from "@/features/products/utils/price-grid";
import { UNIQUE_COLUMN_KEY } from "@/features/products/utils/grid-columns";
import { axisForProductType } from "./product-constants";
import { productLineTransform } from "./product-line";

/** The flat shape the create form holds, before it becomes a tree. */
export interface ProductCreateFormValues {
  name: string;
  productTypeId: number;
  garmentGenderId?: number | null;
  sizeScaleId?: number | null;
  isActive?: boolean;
  versionLabel?: string | null;
  publisherId?: number | null;
  versionNotes?: string | null;
  schoolYearId: number;
  /** Grid columns chosen for the first version: `s<sizeId>` or `g<gradeId>`. */
  columnKeys?: string[];
  /** Prices typed in the grid, by column key. */
  prices?: Record<string, PriceCell>;
}

/**
 * Folds the create form into the tree `POST /api/products` expects: one line,
 * one version, one variant per chosen column, and an offering for each variant
 * given a sale price. A variant left unpriced exists but is not on sale.
 *
 * Only the columns of the type's own axis count: keys left over from a type
 * the user switched away from would create variants nobody asked for.
 */
export const productCreateTransform = (
  data: ProductCreateFormValues,
): CreateProduct => {
  const line = productLineTransform(data as unknown as Record<string, unknown>);
  const axis = axisForProductType(line.productTypeId);
  const prefix = axis === "size" ? "s" : "g";
  const keys =
    axis === "none"
      ? [UNIQUE_COLUMN_KEY]
      : (data.columnKeys ?? []).filter((key) => key.startsWith(prefix));

  return {
    ...line,
    versions: [
      {
        label: data.versionLabel?.trim() || null,
        // Only a book names a publisher; a change of it is a new version.
        publisherId: axis === "grade" ? (data.publisherId ?? null) : null,
        notes: data.versionNotes?.trim() || null,
        variants: keys.map((key) => {
          const id = Number(key.slice(1));
          const cell = data.prices?.[key];
          return {
            sizeId: axis === "size" ? id : null,
            gradeId: axis === "grade" ? id : null,
            offerings:
              cell?.sale == null
                ? []
                : [
                    {
                      schoolYearId: Number(data.schoolYearId),
                      salePrice: cell.sale,
                      purchasePrice: cell.cost ?? null,
                    },
                  ],
          };
        }),
      },
    ],
  };
};

/** The chosen columns: a sized or graded product needs at least one. */
export const validateColumnKeys = (
  keys: string[] | undefined,
  values: ProductCreateFormValues,
) => {
  const axis = axisForProductType(Number(values.productTypeId));
  if (!values.productTypeId || axis === "none") return undefined;
  const prefix = axis === "size" ? "s" : "g";
  return (keys ?? []).some((key) => key.startsWith(prefix))
    ? undefined
    : axis === "size"
      ? "Marca al menos una talla."
      : "Marca al menos un grado.";
};

/** A cost with no sale price cannot become an offering. */
export const validatePrices = (
  prices: Record<string, PriceCell> | undefined,
) =>
  Object.values(prices ?? {}).some(
    (cell) => cell.sale == null && cell.cost != null,
  )
    ? "Hay costos sin precio de venta: ponles precio o borra el costo."
    : undefined;
