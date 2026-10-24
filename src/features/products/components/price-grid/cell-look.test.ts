import { describe, expect, it } from "vitest";
import type { GridColumn } from "@/features/products/utils/grid-columns";
import { rowLooks } from "./cell-look";
import type { GridRowSpec } from "./price-grid-types";

// 14, 16 | XS, S: the adult sizes start a group.
const columns: GridColumn[] = ["14", "16", "XS", "S"].map((label) => ({
  key: label,
  label,
  group: null,
  groupStart: label === "XS",
}));

const row = (values: (number | null | "missing")[]): GridRowSpec => ({
  id: "sale",
  label: "Venta",
  kind: "price",
  cells: values.map((value) =>
    value === "missing" ? null : { value, ariaLabel: "" },
  ),
});

const runs = (spec: GridRowSpec, stacked = false) =>
  rowLooks(spec, columns, null, stacked).map((look) =>
    look
      ? `${look.runStart ? "[" : ""}${look.text}${look.runEnd ? "]" : ""}`
      : "·",
  );

describe("rowLooks", () => {
  it("joins neighbours at one price into a segment, never across a size group", () => {
    expect(runs(row([50, 50, 50, 55]))).toEqual(["[50", "50]", "[50]", "[55]"]);
  });

  it("keeps empty cells apart", () => {
    expect(runs(row([null, null, 50, 50]))).toEqual(["[]", "[]", "[50", "50]"]);
  });

  it("breaks at a missing size when drawn, joins over it when stacked", () => {
    const kids: GridColumn[] = ["2", "4", "6"].map((label) => ({
      key: label,
      label,
      group: null,
      groupStart: false,
    }));
    const gapped = row([50, "missing", 50]);
    const draw = (stacked: boolean) =>
      rowLooks(gapped, kids, null, stacked).map((look) =>
        look ? [look.runStart, look.runEnd] : null,
      );
    expect(draw(false)).toEqual([[true, true], null, [true, true]]);
    expect(draw(true)).toEqual([[true, false], null, [false, true]]);
  });

  it("never joins over a hidden size that opens a group", () => {
    // 16 is missing and XS opens the adult sizes: 14 and S stay apart.
    expect(runs(row([50, "missing", "missing", 50]), true)).toEqual([
      "[50]",
      "·",
      "·",
      "[50]",
    ]);
  });

  it("previews a fill over the dragged range", () => {
    const looks = rowLooks(row([45, null, null, 60]), columns, {
      mode: "fill",
      rowId: "sale",
      from: 0,
      to: 2,
    });
    expect(looks.map((l) => l?.text)).toEqual(["45", "45", "45", "60"]);
    expect(looks.map((l) => l?.dashed)).toEqual([
      { start: true, end: false },
      { start: false, end: false },
      { start: false, end: true },
      null,
    ]);
  });
});
