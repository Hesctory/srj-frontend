import type { ProductVariant, ProductVersion } from "@/types/product";
import type { ProductAxis } from "@/features/products/resources/products/product-constants";
import {
  columnKeyOf,
  type GridColumn,
} from "@/features/products/utils/grid-columns";
import {
  formatPrice,
  priceProblems,
  priceRuns,
  readCell,
  variantKey,
  type PriceDrafts,
} from "@/features/products/utils/price-grid";
import type { GridRowSpec } from "@/features/products/components/price-grid/price-grid-types";

/** The version's variant under each column, or null where it has none. */
export const alignVariants = (
  version: ProductVersion,
  columns: GridColumn[],
): (ProductVariant | null)[] => {
  const byColumn = new Map(version.variants.map((v) => [columnKeyOf(v), v]));
  return columns.map((column) => byColumn.get(column.key) ?? null);
};

/**
 * Newest first: by the latest school year each version was priced in, so the
 * cut on sale now leads and the older ones follow. A version never priced is
 * one being prepared, the newest of all. Ties go to the later-created one.
 *
 * Read from what is saved, never the drafts, and applied to every version
 * alike: typing a price or unfolding an old version must not reorder them.
 * `yearRank` is higher for later years.
 */
export const orderVersions = (
  versions: ProductVersion[],
  yearRank: Map<number, number>,
): ProductVersion[] => {
  const latest = (version: ProductVersion) => {
    const ranks = version.variants.flatMap((variant) =>
      variant.offerings.map((o) => yearRank.get(o.schoolYearId) ?? -Infinity),
    );
    return ranks.length === 0 ? Infinity : Math.max(...ranks);
  };
  const key = new Map(versions.map((v) => [v.id, latest(v)]));
  return [...versions].sort((a, b) => {
    const [ka, kb] = [key.get(a.id)!, key.get(b.id)!];
    return ka === kb ? b.id - a.id : kb > ka ? 1 : -1;
  });
};

export const unitWord = (axis: ProductAxis) =>
  axis === "size" ? "talla" : axis === "grade" ? "grado" : "";

const where = (axis: ProductAxis, column: GridColumn) =>
  axis === "none" ? "" : `${unitWord(axis)} ${column.label}`;

interface BuildRowsOptions {
  version: ProductVersion;
  displayLabel: string;
  aligned: (ProductVariant | null)[];
  columns: GridColumn[];
  axis: ProductAxis;
  drafts: PriceDrafts;
  stored: PriceDrafts;
  schoolYearId: number;
  show: { cost: boolean; stock: boolean };
  onOpenKardex: (offeringId: number, title: string) => void;
}

export const buildVersionRows = ({
  version,
  displayLabel,
  aligned,
  columns,
  axis,
  drafts,
  stored,
  schoolYearId,
  show,
  onOpenKardex,
}: BuildRowsOptions): GridRowSpec[] => {
  const priceRow = (kind: "sale" | "cost", label: string): GridRowSpec => ({
    id: `${version.id}:${kind}`,
    label,
    kind: "price",
    cells: aligned.map((variant, col) => {
      if (!variant) return null;
      const key = variantKey(variant.id);
      const value = readCell(drafts, schoolYearId, key)[kind];
      return {
        value,
        changed: value !== readCell(stored, schoolYearId, key)[kind],
        ariaLabel: `${label} ${displayLabel} ${where(axis, columns[col])}`,
      };
    }),
  });

  const rows = [priceRow("sale", "Venta S/")];
  if (show.cost) rows.push(priceRow("cost", "Costo S/"));
  if (show.stock) {
    rows.push({
      id: `${version.id}:stock`,
      label: "Stock",
      kind: "stock",
      cells: aligned.map((variant, col) => {
        if (!variant) return null;
        const offering = variant.offerings.find(
          (o) => o.schoolYearId === schoolYearId,
        );
        const place = where(axis, columns[col]);
        return {
          value: offering?.currentStock ?? null,
          ariaLabel: offering
            ? `Stock ${displayLabel} ${place}: ${offering.currentStock}. Abrir kárdex`
            : `Sin oferta ${displayLabel} ${place}`,
          onOpen: offering
            ? () =>
                onOpenKardex(
                  offering.id,
                  `${displayLabel}${place ? ` · ${place}` : ""}`,
                )
            : undefined,
        };
      }),
    });
  }
  return rows;
};

const valuesOf = (
  aligned: (ProductVariant | null)[],
  drafts: PriceDrafts,
  schoolYearId: number,
  kind: "sale" | "cost",
) =>
  aligned.map((variant) =>
    variant
      ? readCell(drafts, schoolYearId, variantKey(variant.id))[kind]
      : null,
  );

/** "14 tallas · 4 precios · stock 270". */
export const versionMeta = (
  aligned: (ProductVariant | null)[],
  axis: ProductAxis,
  drafts: PriceDrafts,
  schoolYearId: number,
) => {
  const present = aligned.filter((v): v is ProductVariant => v != null);
  const runs = priceRuns(valuesOf(aligned, drafts, schoolYearId, "sale"));
  const stock = present.reduce(
    (sum, v) =>
      sum +
      (v.offerings.find((o) => o.schoolYearId === schoolYearId)?.currentStock ??
        0),
    0,
  );
  const parts = [];
  if (axis !== "none") {
    const unit = axis === "size" ? "tallas" : "grados";
    parts.push(
      `${present.length} ${present.length === 1 ? unitWord(axis) : unit}`,
    );
  }
  parts.push(
    runs.length === 0
      ? "sin precio"
      : `${runs.length} ${runs.length === 1 ? "precio" : "precios"}`,
  );
  parts.push(`stock ${stock}`);
  return parts.join(" · ");
};

export interface VersionProblem {
  severity: "warning" | "error";
  text: string;
}

export const versionProblems = (
  aligned: (ProductVariant | null)[],
  columns: GridColumn[],
  axis: ProductAxis,
  drafts: PriceDrafts,
  schoolYearId: number,
): VersionProblem[] => {
  const sale = valuesOf(aligned, drafts, schoolYearId, "sale");
  const cost = valuesOf(aligned, drafts, schoolYearId, "cost");
  const found = priceProblems(sale, cost);
  const names = (cols: number[]) =>
    cols.map((c) => columns[c].label).join(", ");
  const problems: VersionProblem[] = [];
  if (axis === "size") {
    for (const { index, previousIndex } of found.cheaperThanPrevious) {
      problems.push({
        severity: "warning",
        text: `La talla ${columns[index].label} (${formatPrice(sale[index]!)}) cuesta menos que la ${columns[previousIndex].label} (${formatPrice(sale[previousIndex]!)}).`,
      });
    }
  }
  if (found.costAboveSale.length > 0) {
    problems.push({
      severity: "warning",
      text: `El costo supera la venta en ${names(found.costAboveSale)}.`,
    });
  }
  if (found.costWithoutSale.length > 0) {
    problems.push({
      severity: "error",
      text: `Hay costo sin precio de venta en ${names(found.costWithoutSale)}: ponle precio o borra el costo.`,
    });
  }
  return problems;
};
