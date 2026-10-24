import { describe, expect, it } from "vitest";
import {
  pasteTargetRows,
  planPaste,
  stepHorizontal,
  stepLinear,
  stepVertical,
  type NavRow,
} from "./grid-navigation";

// Version A has sizes 0–2; version B lacks size 0.
const rows: NavRow[] = [
  { id: "a:sale", editable: true, present: [true, true, true] },
  { id: "a:stock", editable: false, present: [true, true, true] },
  { id: "b:sale", editable: true, present: [false, true, true] },
];

describe("grid navigation", () => {
  it("Tab walks price cells row by row, skipping stock and missing sizes", () => {
    expect(stepLinear(rows, { rowId: "a:sale", col: 2 }, 1)).toEqual({
      rowId: "b:sale",
      col: 1,
    });
    expect(stepLinear(rows, { rowId: "b:sale", col: 1 }, -1)).toEqual({
      rowId: "a:sale",
      col: 2,
    });
    expect(stepLinear(rows, { rowId: "b:sale", col: 2 }, 1)).toBeNull();
  });

  it("arrows reach the stock row and stop at the edges", () => {
    expect(stepVertical(rows, { rowId: "a:sale", col: 0 }, 1)).toEqual({
      rowId: "a:stock",
      col: 0,
    });
    expect(stepVertical(rows, { rowId: "a:stock", col: 0 }, 1)).toBeNull();
    expect(stepHorizontal(rows, { rowId: "b:sale", col: 1 }, -1)).toBeNull();
  });

  it("sends each pasted line to the next price row", () => {
    expect(pasteTargetRows(rows, "a:sale", 2).map((r) => r.id)).toEqual([
      "a:sale",
      "b:sale",
    ]);
  });
});

describe("planPaste", () => {
  it("fills the sizes the version has, skipping the ones it lacks", () => {
    const gapped: NavRow[] = [
      { id: "sale", editable: true, present: [true, false, true, true] },
      { id: "cost", editable: true, present: [true, true, true, true] },
    ];
    const plan = planPaste(gapped, { rowId: "sale", col: 0 }, [
      ["41", "41", "42", "99"],
      ["30"],
    ]);
    expect(plan.cells).toEqual([
      { rowId: "sale", col: 0, raw: "41" },
      { rowId: "sale", col: 2, raw: "41" },
      { rowId: "sale", col: 3, raw: "42" },
      { rowId: "cost", col: 0, raw: "30" },
    ]);
    expect(plan.overflow).toBe(1);
  });
});
