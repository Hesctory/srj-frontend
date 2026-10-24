/**
 * Product type ids — a fixed backend enum, mirrored here because the *shape of
 * the form* depends on which one is selected, not just its label.
 *
 * The axis a product varies along follows from its type, and the three cases
 * are genuinely different things:
 *  - Uniforme: varies by **size**, and carries a garment gender and a size scale.
 *  - Libro:    varies by **grade**, and names a publisher (a change of publisher
 *              is a new version, not an edit).
 *  - Otro:     varies along **neither** — an agenda, a plan lector, cloth by the
 *              metre. It is just itself, and its versions get one `noAxis`
 *              variant.
 */
export const PRODUCT_TYPE_GARMENT = 1;
export const PRODUCT_TYPE_BOOK = 2;
export const PRODUCT_TYPE_OTHER = 3;

/** Which axis a type's variants run along. Drives every variant/price editor. */
export type ProductAxis = "size" | "grade" | "none";

export const axisForProductType = (productTypeId: number): ProductAxis => {
  if (productTypeId === PRODUCT_TYPE_GARMENT) return "size";
  if (productTypeId === PRODUCT_TYPE_BOOK) return "grade";
  return "none";
};

/**
 * Below this a stock figure reads as amber; at or under zero, red.
 *
 * A display threshold only — it decides a chip colour, never whether something
 * can be sold. The counter's answer to "is there enough?" comes from the
 * sale preview's `sufficientStock`, which is computed against the live shelf.
 */
export const LOW_STOCK_THRESHOLD = 10;
