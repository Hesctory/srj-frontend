/**
 * Where the keyboard goes next in the price grid. Pure, so the rules are
 * testable without a DOM.
 *
 * Tab and Enter walk only the editable (price) rows, left to right and then
 * down, the order prices are typed in. Arrow keys also reach the stock row,
 * whose cells open the kardex. Cells a version does not have are skipped.
 */
export interface NavRow {
  id: string;
  editable: boolean;
  /** `present[col]`: the version has this size/grade. */
  present: boolean[];
}

export interface GridPos {
  rowId: string;
  col: number;
}

const rowIndex = (rows: NavRow[], rowId: string) =>
  rows.findIndex((row) => row.id === rowId);

export const stepLinear = (
  rows: NavRow[],
  pos: GridPos,
  dir: 1 | -1,
): GridPos | null => {
  const editable = rows.filter((row) => row.editable);
  const width = editable[0]?.present.length ?? 0;
  let r = editable.findIndex((row) => row.id === pos.rowId);
  if (r < 0) return null;
  let c = pos.col;
  for (;;) {
    c += dir;
    if (c >= width) {
      c = 0;
      r += 1;
    } else if (c < 0) {
      c = width - 1;
      r -= 1;
    }
    if (r < 0 || r >= editable.length) return null;
    if (editable[r].present[c]) return { rowId: editable[r].id, col: c };
  }
};

export const stepHorizontal = (
  rows: NavRow[],
  pos: GridPos,
  dir: 1 | -1,
): GridPos | null => {
  const row = rows[rowIndex(rows, pos.rowId)];
  if (!row) return null;
  for (let c = pos.col + dir; c >= 0 && c < row.present.length; c += dir) {
    if (row.present[c]) return { rowId: row.id, col: c };
  }
  return null;
};

export const stepVertical = (
  rows: NavRow[],
  pos: GridPos,
  dir: 1 | -1,
): GridPos | null => {
  for (
    let r = rowIndex(rows, pos.rowId) + dir;
    r >= 0 && r < rows.length;
    r += dir
  ) {
    if (rows[r].present[pos.col]) return { rowId: rows[r].id, col: pos.col };
  }
  return null;
};

export const rowEdge = (
  rows: NavRow[],
  rowId: string,
  edge: "first" | "last",
): GridPos | null => {
  const row = rows[rowIndex(rows, rowId)];
  if (!row) return null;
  const cols = row.present.flatMap((present, c) => (present ? [c] : []));
  const col = edge === "first" ? cols[0] : cols[cols.length - 1];
  return col === undefined ? null : { rowId, col };
};

/**
 * The editable rows a multi-line paste lands in, starting at `rowId`: line
 * one goes to that row, line two to the next editable row, and so on.
 */
export const pasteTargetRows = (
  rows: NavRow[],
  rowId: string,
  lineCount: number,
): NavRow[] => {
  const editable = rows.filter((row) => row.editable);
  const start = editable.findIndex((row) => row.id === rowId);
  return start < 0 ? [] : editable.slice(start, start + lineCount);
};

export interface PastePlan {
  cells: { rowId: string; col: number; raw: string }[];
  /** Non-empty values with no cell left to land in. */
  overflow: number;
}

/**
 * Where each pasted value goes: line by line into the editable rows from
 * `pos` down, and within a line into the cells the version has, skipping the
 * sizes it lacks — the same order Tab walks. A row copied from a sheet that
 * lists only the sizes the version sells lands on the right sizes.
 */
export const planPaste = (
  rows: NavRow[],
  pos: GridPos,
  lines: string[][],
): PastePlan => {
  const targets = pasteTargetRows(rows, pos.rowId, lines.length);
  const plan: PastePlan = { cells: [], overflow: 0 };
  lines.forEach((line, i) => {
    const target = targets[i];
    const cols = target
      ? target.present.flatMap((present, c) =>
          present && c >= pos.col ? [c] : [],
        )
      : [];
    line.forEach((raw, j) => {
      const col = cols[j];
      if (!target || col === undefined) {
        if (raw.trim() !== "") plan.overflow++;
        return;
      }
      plan.cells.push({ rowId: target.id, col, raw });
    });
  });
  return plan;
};
