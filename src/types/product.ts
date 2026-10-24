/**
 * The sellable catalogue, as `Contracts/ProductsContract.md` models it.
 *
 * The single idea the whole module turns on: **what the school sells is an
 * offering, never a product.** A product is a name the school keeps for years
 * ("Polo buzo"); a *version* is that garment as it was last redesigned ("Polo
 * buzo 2023"); a *variant* is one size or grade of that version; an *offering*
 * is that variant priced for one school year. Only the last of those has a
 * price and a stock figure, and only the last of those can be sold.
 *
 * That is why the tree is four levels deep and why nothing here carries a
 * `price` above the offering: two cuts of the same garment sell side by side at
 * different prices until the older one runs out, and a size 8 shirt costs less
 * than an XL of the same shirt in the same year.
 */

// ---- reference data --------------------------------------------------------

export type ProductType = {
  id: number;
  name: string | null;
};

export type GarmentGender = {
  id: number;
  name: string | null;
};

export type SizeScale = {
  id: number;
  code: string | null;
  name: string | null;
};

/**
 * One rung of a size ladder.
 *
 * `sortOrder` is the whole point of this record. The ladder runs `2 4 6 8 10 12
 * 14 16` and then `XS S M L XL XXL`, so sorting the codes as strings puts "10"
 * before "2" and XS after XL — both wrong. It also carries a price fact the
 * band editor depends on: the bigger the size, the higher the price, and the
 * school prices *runs* of consecutive sizes.
 */
export type Size = {
  id: number;
  sizeScaleId: number;
  code: string | null;
  name: string | null;
  sortOrder: number;
};

// ---- the catalogue tree ----------------------------------------------------

/** One priced, countable thing, for one school year. The sellable unit. */
export type ProductOffering = {
  id: number;
  schoolYearId: number;
  salePrice: number;
  purchasePrice: number | null;
  currentStock: number;
  /** The variant's stock at the moment this offering was created. */
  openingStock: number;
};

/** A size (garment) or a grade (book) of one version. Neither, for a tie. */
export type ProductVariant = {
  id: number;
  sizeId: number | null;
  gradeId: number | null;
  offerings: ProductOffering[];
};

/** A cut of a garment, or an edition of a book from a named publisher. */
export type ProductVersion = {
  id: number;
  label: string | null;
  publisherId: number | null;
  notes: string | null;
  variants: ProductVariant[];
};

/** The line with every version, variant and per-year offering it has. */
export type ProductDetail = {
  id: number;
  name: string | null;
  productTypeId: number;
  garmentGenderId: number | null;
  sizeScaleId: number | null;
  isActive: boolean;
  versions: ProductVersion[];
};

/**
 * A product LINE as the catalogue list renders it.
 *
 * `variantsOnOffer` is null when the list was fetched without a school-year
 * filter — "on offer" is meaningless without a year to be on offer *in*.
 */
export type ProductListItem = {
  id: number;
  name: string | null;
  productTypeId: number;
  garmentGenderId: number | null;
  sizeScaleId: number | null;
  isActive: boolean;
  versionCount: number;
  variantsOnOffer: number | null;
};

/**
 * The flat sellable grid: one row per variant on sale in a school year.
 *
 * This is the shape the stock and sales screens read; `ProductDetail` is the
 * shape the catalogue editor writes. They describe the same rows from opposite
 * ends and are deliberately not the same type.
 *
 * The rows arrive in ladder order by default — `productName, versionLabel,
 * sizeSortOrder, gradeId` — so the grid renders a readable price ladder with no
 * `sort` param at all. Rely on that rather than re-sorting client-side, and
 * never sort `sizeCode` as a string: it puts "10" before "2".
 *
 * `isActive` is the line's flag, carried down so the grid can grey out rows
 * that are hidden from the pickers without a second fetch.
 */
export type ProductOfferingListItem = {
  id: number;
  productId: number;
  productName: string | null;
  productTypeId: number;
  productVersionId: number;
  versionLabel: string | null;
  garmentGenderId: number | null;
  publisherId: number | null;
  publisherName: string | null;
  productVariantId: number;
  sizeId: number | null;
  sizeCode: string | null;
  /** The size's place on the ladder (`sizes.sortOrder`). */
  sizeSortOrder: number | null;
  gradeId: number | null;
  gradeName: string | null;
  schoolYearId: number;
  salePrice: number;
  purchasePrice: number | null;
  currentStock: number;
  /** The variant's stock at the moment this offering was created. */
  openingStock: number;
  isActive: boolean;
};

/**
 * Filters `GET /api/products/offerings` accepts inside its `filter` JSON.
 *
 * `q` matches the version label as well as the product name — searching "2023"
 * finds the 2023 cut, which matters because the version is half of what
 * identifies a garment.
 */
export type ProductOfferingFilter = {
  q?: string;
  schoolYearId?: number;
  productTypeId?: number;
  sizeId?: number;
  gradeId?: number;
  publisherId?: number;
  garmentGenderId?: number;
  isActive?: boolean;
  inStockOnly?: boolean;
  lowStockOnly?: boolean;
  /** Defaults to 5 server-side when `lowStockOnly` is set. */
  lowStockThreshold?: number;
};

// ---- uniform sets ----------------------------------------------------------

export type UniformSetListItem = {
  id: number;
  name: string | null;
  garmentGenderId: number | null;
  levelId: number | null;
  isActive: boolean;
  itemCount: number;
};

export type UniformSetItem = {
  id: number;
  productId: number;
  productName: string | null;
  quantity: number;
  isOptional: boolean;
};

export type UniformSetOffering = {
  id: number;
  schoolYearId: number;
  bundlePrice: number | null;
};

export type UniformSetDetail = {
  id: number;
  name: string | null;
  garmentGenderId: number | null;
  levelId: number | null;
  isActive: boolean;
  items: UniformSetItem[];
  offerings: UniformSetOffering[];
};

// ---- the stock ledger ------------------------------------------------------

/**
 * Where a movement came from. Every movement is written by the document that
 * caused it — there are no stock-write endpoints — so this always names
 * something the UI can link to.
 */
export type StockSourceKind =
  | "sale"
  | "purchase"
  | "return"
  | "initial"
  | "legacy";

/** A kardex row as the read-only movements list returns it. */
export type ProductStockMovement = {
  id: number;
  productVariantId: number;
  /** Null on a migrated row. */
  productOfferingId: number | null;
  productId: number;
  productName: string | null;
  versionLabel: string | null;
  sizeCode: string | null;
  gradeName: string | null;
  schoolYearId: number | null;
  movementTypeId: number;
  movementTypeCode: string | null;
  movementTypeName: string | null;
  quantityDelta: number;
  /** False before the variant's last counted school year: listed, not counted. */
  countsTowardStock: boolean;
  sourceKind: StockSourceKind | null;
  sourceId: number | null;
  sourceLabel: string | null;
  unitValue: number | null;
  notes: string | null;
  movedAt: string;
  createdBy: number | null;
  createdByName: string | null;
};

/** One row of a kardex, with its running balance already folded in. */
export type KardexMovement = {
  id: number;
  movedAt: string;
  movementTypeId: number;
  movementTypeCode: string | null;
  movementTypeName: string | null;
  sourceKind: StockSourceKind | null;
  sourceId: number | null;
  sourceLabel: string | null;
  quantityIn: number;
  quantityOut: number;
  /** False on a movement from before the variant's last counted school year; it does not move `balance`. */
  countsTowardStock: boolean;
  balance: number;
  unitValue: number | null;
  notes: string | null;
  createdByName: string | null;
};

/** One variant's ledger over a period, across school years. */
export type Kardex = {
  productOfferingId: number;
  productVariantId: number;
  productId: number;
  productName: string | null;
  versionLabel: string | null;
  sizeCode: string | null;
  gradeName: string | null;
  schoolYearId: number;
  from: string | null;
  to: string | null;
  opening: number;
  totalIn: number;
  totalOut: number;
  closing: number;
  movements: KardexMovement[];
};

// ---- write bodies ----------------------------------------------------------

/**
 * The whole-tree body accepted by `POST /api/products`.
 *
 * `PUT /api/products/:id` accepts it too, but must not be used for maintenance:
 * children absent from the payload are **deleted**, which throws away versions
 * that still have sales history. Editing goes through the incremental endpoints
 * below instead.
 */
export type CreateProduct = {
  productTypeId: number;
  name: string | null;
  garmentGenderId: number | null;
  sizeScaleId: number | null;
  isActive: boolean;
  versions: {
    label: string | null;
    publisherId: number | null;
    notes: string | null;
    variants: {
      sizeId: number | null;
      gradeId: number | null;
      offerings: {
        schoolYearId: number;
        salePrice: number;
        purchasePrice: number | null;
      }[];
    }[];
  }[];
};

/** The line's own fields. Editing a name no longer rewrites the tree beneath it. */
export type UpdateProductLine = {
  productTypeId: number;
  name: string | null;
  garmentGenderId: number | null;
  sizeScaleId: number | null;
  isActive: boolean;
};

export type CreateProductVersion = {
  label: string | null;
  publisherId: number | null;
  notes: string | null;
  /** Optional: create the version's variants in the same call. */
  sizeIds?: number[] | null;
  gradeIds?: number[] | null;
};

export type UpdateProductVersion = {
  label: string | null;
  publisherId: number | null;
  notes: string | null;
};

/** Give a version a whole size ladder, or a level's grades, in one call. */
export type AddProductVariants = {
  sizeIds?: number[] | null;
  gradeIds?: number[] | null;
  /** True for a variant with neither axis — a tie, a hat, cloth by the metre. */
  noAxis?: boolean;
};

/**
 * One version's prices for one school year: one row per variant.
 *
 * Grouping sizes into runs at one price is a UI concern — the editor expands
 * its bands into these rows before saving.
 */
export type SetVersionPriceList = {
  schoolYearId: number;
  rows: {
    productVariantId: number;
    salePrice: number;
    purchasePrice: number | null;
  }[];
  /** Remove offerings this call did not price. */
  replace: boolean;
};

/** Copy a version's prices from one school year into another. The January task. */
export type RollForwardOfferings = {
  fromSchoolYearId: number;
  toSchoolYearId: number;
  increasePercent: number | null;
  increaseAmount: number | null;
  overwrite: boolean;
};

/** Clone a version's variants into a new one — the redesign changeover. */
export type CloneProductVersion = {
  label: string | null;
  publisherId: number | null;
  notes: string | null;
  schoolYearId: number | null;
  salePrice: number | null;
  /** Copy the source version's prices instead of using one flat `salePrice`. */
  copyPrices: boolean;
};

export type CatalogWriteResult = {
  id: number;
  affected: number;
};

export type CreatedId = {
  id: number;
};
