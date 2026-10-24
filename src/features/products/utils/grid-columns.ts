import type { ProductVariant, Size } from "@/types/product";

/**
 * The columns of the price grid: a product's size ladder, its grades grouped by
 * level, or a single column for things that are just themselves.
 */
export interface GridColumn {
  key: string;
  label: string;
  /** Level name above grade columns; null for sizes. */
  group: string | null;
  /** Draws a divider before this column (kids → adult sizes, a new level). */
  groupStart: boolean;
}

export interface GradeRow {
  id: number;
  levelId: number | null;
  name?: string | null;
  grade?: string | null;
}

export interface LevelRow {
  id: number;
  name: string | null;
  orderIndex?: number | null;
}

export const UNIQUE_COLUMN_KEY = "u";

/** Which column a variant sits in. */
export const columnKeyOf = (
  variant: Pick<ProductVariant, "sizeId" | "gradeId">,
) =>
  variant.sizeId != null
    ? `s${variant.sizeId}`
    : variant.gradeId != null
      ? `g${variant.gradeId}`
      : UNIQUE_COLUMN_KEY;

const isNumericCode = (code: string | null) => /^\d/.test(code ?? "");

/** Ladder order (`sortOrder`), never code order: "10" sorts before "2". */
export const sizeColumns = (sizes: Size[]): GridColumn[] =>
  [...sizes]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((size, index, sorted) => ({
      key: `s${size.id}`,
      label: size.code ?? size.name ?? `#${size.id}`,
      group: null,
      groupStart:
        index > 0 &&
        isNumericCode(size.code) !== isNumericCode(sorted[index - 1].code),
    }));

export const gradeColumns = (
  grades: GradeRow[],
  levels: LevelRow[],
): GridColumn[] => {
  const levelOrder = new Map(
    levels.map((level, index) => [level.id, level.orderIndex ?? index]),
  );
  const levelName = new Map(levels.map((level) => [level.id, level.name]));
  return [...grades]
    .sort(
      (a, b) =>
        (levelOrder.get(a.levelId ?? -1) ?? 99) -
          (levelOrder.get(b.levelId ?? -1) ?? 99) || a.id - b.id,
    )
    .map((grade, index, sorted) => ({
      key: `g${grade.id}`,
      label: grade.name ?? grade.grade ?? `#${grade.id}`,
      group: levelName.get(grade.levelId ?? -1) ?? null,
      groupStart: index > 0 && grade.levelId !== sorted[index - 1].levelId,
    }));
};

export const uniqueColumns = (): GridColumn[] => [
  { key: UNIQUE_COLUMN_KEY, label: "Precio", group: null, groupStart: false },
];
