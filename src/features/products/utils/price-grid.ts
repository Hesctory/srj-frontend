import type {
  ProductDetail,
  ProductVariant,
  SetVersionPriceList,
} from "@/types/product";

/**
 * The pure half of the catalogue's price grid: how prices are held while they
 * are being edited, parsed, compared with what is stored, and turned back into
 * price-list rows.
 *
 * Drafts are keyed `y<schoolYearId>` → `v<variantId>`. The prefixes keep the
 * keys from ever reading as array indices (react-hook-form treats "8" as one
 * when the create form holds its prices).
 */

export type PriceKind = "sale" | "cost";

export interface PriceCell {
  sale: number | null;
  cost: number | null;
}

export type YearDraft = Record<string, PriceCell>;
export type PriceDrafts = Record<string, YearDraft>;

export const yearKey = (schoolYearId: number) => `y${schoolYearId}`;
export const variantKey = (variantId: number | string) => `v${variantId}`;

const EMPTY_CELL: PriceCell = { sale: null, cost: null };

/** Every stored offering of the product, as drafts. */
export const draftsFromProduct = (product: ProductDetail): PriceDrafts => {
  const drafts: PriceDrafts = {};
  for (const version of product.versions ?? []) {
    for (const variant of version.variants ?? []) {
      for (const offering of variant.offerings ?? []) {
        const year = (drafts[yearKey(offering.schoolYearId)] ??= {});
        year[variantKey(variant.id)] = {
          sale: offering.salePrice,
          cost: offering.purchasePrice ?? null,
        };
      }
    }
  }
  return drafts;
};

export const readCell = (
  drafts: PriceDrafts | undefined,
  schoolYearId: number,
  key: string,
): PriceCell => drafts?.[yearKey(schoolYearId)]?.[key] ?? EMPTY_CELL;

export interface PriceWrite {
  variantKey: string;
  kind: PriceKind;
  value: number | null;
}

/**
 * Applies writes to one year, immutably.
 *
 * A cell with neither price is removed rather than kept as `{null, null}`, and
 * so is a year left empty — otherwise a value typed and then deleted would
 * leave the form dirty against a default that never had the key.
 */
export const writeCells = (
  drafts: PriceDrafts,
  schoolYearId: number,
  writes: PriceWrite[],
): PriceDrafts => {
  const key = yearKey(schoolYearId);
  const year: YearDraft = { ...(drafts[key] ?? {}) };
  for (const write of writes) {
    const next = { ...(year[write.variantKey] ?? EMPTY_CELL) };
    next[write.kind] = write.value;
    if (next.sale == null && next.cost == null) delete year[write.variantKey];
    else year[write.variantKey] = next;
  }
  const result = { ...drafts };
  if (Object.keys(year).length === 0) delete result[key];
  else result[key] = year;
  return result;
};

/**
 * Carries unsaved edits across a reload of the product.
 *
 * After any write (a clone, new sizes, a partial save) the stored prices
 * change underneath the drafts. Each price the user did not touch follows the
 * new stored value; each one they did touch keeps their edit. Replacing the
 * drafts wholesale would lose the edits, and keeping them wholesale would
 * show a clone's copied prices as "deleted".
 */
export const rebaseDrafts = (
  oldStored: PriceDrafts,
  current: PriceDrafts,
  newStored: PriceDrafts,
): PriceDrafts => {
  const years = new Set([
    ...Object.keys(oldStored),
    ...Object.keys(current),
    ...Object.keys(newStored),
  ]);
  const result: PriceDrafts = {};
  for (const year of years) {
    const keys = new Set([
      ...Object.keys(oldStored[year] ?? {}),
      ...Object.keys(current[year] ?? {}),
      ...Object.keys(newStored[year] ?? {}),
    ]);
    for (const key of keys) {
      const was = oldStored[year]?.[key] ?? EMPTY_CELL;
      const now = current[year]?.[key] ?? EMPTY_CELL;
      const fresh = newStored[year]?.[key] ?? EMPTY_CELL;
      const cell = {
        sale: now.sale === was.sale ? fresh.sale : now.sale,
        cost: now.cost === was.cost ? fresh.cost : now.cost,
      };
      if (cell.sale != null || cell.cost != null) {
        (result[year] ??= {})[key] = cell;
      }
    }
  }
  return result;
};

/** Removes the given variants from every year: used after they are deleted. */
export const dropVariants = (
  drafts: PriceDrafts,
  keys: string[],
): PriceDrafts => {
  const result: PriceDrafts = {};
  for (const [year, cells] of Object.entries(drafts)) {
    const kept = Object.fromEntries(
      Object.entries(cells).filter(([key]) => !keys.includes(key)),
    );
    if (Object.keys(kept).length > 0) result[year] = kept;
  }
  return result;
};

/**
 * What a typed or pasted value means: a price, "no price" (empty), or
 * `undefined` for text that is not a price. Accepts what a spreadsheet copies:
 * "S/ 45.00", "45,50".
 */
export const parsePrice = (text: string): number | null | undefined => {
  const cleaned = text
    .trim()
    .replace(/^S\/\s*/i, "")
    .replace(",", ".");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(value * 100) / 100;
};

/** "45" for whole soles, "45.50" otherwise: the grid has no room for "S/". */
export const formatPrice = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2);

/**
 * Clipboard text as rows of cells. Spreadsheets separate cells with tabs; a
 * line typed by hand may use spaces or semicolons instead.
 */
export const parseClipboard = (text: string): string[][] =>
  text
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) =>
      line.includes("\t")
        ? line.split("\t")
        : line
            .replace(/S\/\s*/gi, "")
            .trim()
            .split(/[;\s]+/),
    );

/** True when pasted text holds more than one value and should fill cells. */
export const isMultiCellPaste = (text: string) => {
  const rows = parseClipboard(text);
  return rows.length > 1 || (rows[0]?.length ?? 0) > 1;
};

/** Raises a price by a percentage and/or a flat amount, to the céntimo. */
export const raisePrice = (price: number, percent: number, amount: number) =>
  Math.round((price * (1 + percent / 100) + amount) * 100) / 100;

export interface PriceRun {
  start: number;
  end: number;
  price: number;
}

/** Consecutive positions at one price. A gap (no price) ends a run. */
export const priceRuns = (values: (number | null)[]): PriceRun[] => {
  const runs: PriceRun[] = [];
  values.forEach((price, index) => {
    const open = runs[runs.length - 1];
    if (price == null) return;
    if (open && open.price === price && open.end === index - 1) {
      open.end = index;
    } else {
      runs.push({ start: index, end: index, price });
    }
  });
  return runs;
};

/**
 * 0–4: how dark a price's fill is within its row. Cheaper is lighter, so the
 * "bigger size, higher price" ladder reads as a gradient.
 */
export const tintLevel = (price: number, rowPrices: (number | null)[]) => {
  const distinct = [
    ...new Set(rowPrices.filter((p): p is number => p != null)),
  ].sort((a, b) => a - b);
  if (distinct.length <= 1) return 1;
  return Math.round((distinct.indexOf(price) * 4) / (distinct.length - 1));
};

export interface PriceProblems {
  /** Sizes priced below the size before them. A warning, not an error. */
  cheaperThanPrevious: { index: number; previousIndex: number }[];
  costAboveSale: number[];
  /** A cost with no sale price cannot be saved: an offering needs a price. */
  costWithoutSale: number[];
}

export const priceProblems = (
  sale: (number | null)[],
  cost: (number | null)[],
): PriceProblems => {
  const runs = priceRuns(sale);
  return {
    cheaperThanPrevious: runs.flatMap((run, i) =>
      i > 0 && run.price < runs[i - 1].price
        ? [{ index: run.start, previousIndex: runs[i - 1].end }]
        : [],
    ),
    costAboveSale: sale.flatMap((price, i) =>
      price != null && cost[i] != null && cost[i]! > price ? [i] : [],
    ),
    costWithoutSale: cost.flatMap((price, i) =>
      price != null && sale[i] == null ? [i] : [],
    ),
  };
};

/** Cells with a cost but no sale price: an offering cannot be saved so. */
export const countCostOnlyCells = (drafts: PriceDrafts) =>
  Object.values(drafts)
    .flatMap((year) => Object.values(year))
    .filter((cell) => cell.sale == null && cell.cost != null).length;

const sameCell = (a: PriceCell, b: PriceCell) =>
  a.sale === b.sale && a.cost === b.cost;

/** Cells whose sale or cost differs between two sets of drafts. */
export const countChangedCells = (
  stored: PriceDrafts,
  current: PriceDrafts,
): number => {
  let changed = 0;
  const years = new Set([...Object.keys(stored), ...Object.keys(current)]);
  for (const year of years) {
    const keys = new Set([
      ...Object.keys(stored[year] ?? {}),
      ...Object.keys(current[year] ?? {}),
    ]);
    for (const key of keys) {
      if (
        !sameCell(
          stored[year]?.[key] ?? EMPTY_CELL,
          current[year]?.[key] ?? EMPTY_CELL,
        )
      ) {
        changed++;
      }
    }
  }
  return changed;
};

export interface PriceListChange {
  versionId: number;
  body: SetVersionPriceList;
}

/**
 * One price-list call per version and year whose prices changed.
 *
 * Each call carries the version's whole list for the year with `replace`, so a
 * cleared cell drops that offering: that is how a size stops being sold.
 */
export const priceListChanges = (
  product: ProductDetail,
  stored: PriceDrafts,
  current: PriceDrafts,
): PriceListChange[] => {
  const years = new Set([...Object.keys(stored), ...Object.keys(current)]);
  const changes: PriceListChange[] = [];
  for (const year of years) {
    const schoolYearId = Number(year.slice(1));
    for (const version of product.versions) {
      const keys = version.variants.map((variant) => variantKey(variant.id));
      const changed = keys.some(
        (key) =>
          !sameCell(
            stored[year]?.[key] ?? EMPTY_CELL,
            current[year]?.[key] ?? EMPTY_CELL,
          ),
      );
      if (!changed) continue;
      changes.push({
        versionId: version.id,
        body: {
          schoolYearId,
          replace: true,
          rows: version.variants.flatMap((variant: ProductVariant) => {
            const cell = current[year]?.[variantKey(variant.id)];
            if (cell?.sale == null) return [];
            return [
              {
                productVariantId: variant.id,
                salePrice: cell.sale,
                purchasePrice: cell.cost,
              },
            ];
          }),
        },
      });
    }
  }
  return changes;
};
