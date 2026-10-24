import type { GridColumn } from "@/features/products/utils/grid-columns";
import { formatPrice, tintLevel } from "@/features/products/utils/price-grid";
import type { GridRowSpec } from "./price-grid-types";

export interface Drag {
  mode: "move" | "fill";
  rowId: string;
  from: number;
  to: number;
}

export interface CellLook {
  text: string;
  /** 0–4, or null for a cell without a price. */
  tint: number | null;
  /**
   * Consecutive sizes at one price read as one segment: rounded at its ends,
   * set off from its neighbours by a gap. An empty cell is a segment alone.
   */
  runStart: boolean;
  runEnd: boolean;
  /** Kids → adult sizes, or a new level: a wider gap before it. */
  groupStart: boolean;
  faded: boolean;
  /** Showing a value a drag would write, not the stored one. */
  preview: boolean;
  /** Outline of a drag's range: which of its ends this cell is. */
  dashed: { start: boolean; end: boolean } | null;
  changed: boolean;
}

/**
 * What each cell of a row shows, including the preview of a drag in
 * progress: a move fades its source and previews the target; a fill previews
 * the whole range. Null where the version lacks the size.
 */
export const rowLooks = (
  row: GridRowSpec,
  columns: GridColumn[],
  drag: Drag | null,
  /** Stacked: missing sizes are not drawn, so segments join across them. */
  skipMissing = false,
): (CellLook | null)[] => {
  const active = drag && drag.rowId === row.id && drag.to !== drag.from;
  const [a, b] = drag ? [drag.from, drag.to].sort((x, y) => x - y) : [0, 0];
  const source = active ? (row.cells[drag.from]?.value ?? null) : null;

  const shown = row.cells.map((cell, col) => {
    if (!cell) return null;
    if (active && drag.mode === "move" && col === drag.to) return source;
    if (active && drag.mode === "fill" && col >= a && col <= b) return source;
    return cell.value;
  });
  const rowValues = row.cells.map((c) => c?.value ?? null);
  const isPrice = row.kind === "price";

  // The neighbour a segment can join. Stacked, the sizes a version lacks are
  // not drawn, so it is the nearest size the version has.
  const neighbour = (col: number, step: 1 | -1) => {
    let at = col + step;
    while (skipMissing && at >= 0 && at < row.cells.length && !row.cells[at])
      at += step;
    return at;
  };
  // Never across a size group, even one whose first size is not drawn.
  const crossesGroup = (left: number, right: number) =>
    columns.slice(left + 1, right + 1).some((column) => column.groupStart);
  const joins = (left: number, right: number) =>
    isPrice &&
    !crossesGroup(left, right) &&
    row.cells[left] != null &&
    row.cells[right] != null &&
    shown[left] != null &&
    shown[left] === shown[right];

  return row.cells.map((cell, col) => {
    if (!cell) return null;
    const value = shown[col];
    let faded = false;
    let preview = false;
    let dashed: CellLook["dashed"] = null;
    if (active && drag.mode === "move") {
      faded = col === drag.from;
      if (col === drag.to) {
        preview = true;
        dashed = { start: true, end: true };
      }
    } else if (active && col >= a && col <= b) {
      dashed = { start: col === a, end: col === b };
      preview = col !== drag.from;
    }
    return {
      text:
        value == null
          ? isPrice
            ? ""
            : "—"
          : isPrice
            ? formatPrice(value)
            : String(value),
      tint: isPrice && value != null ? tintLevel(value, rowValues) : null,
      runStart: !joins(neighbour(col, -1), col),
      runEnd: !joins(col, neighbour(col, 1)),
      groupStart: columns[col]?.groupStart ?? false,
      faded,
      preview,
      dashed,
      changed: !!cell.changed,
    };
  });
};
