import { describe, expect, it } from "vitest";
import type { ProductDetail } from "@/types/product";
import {
  countChangedCells,
  draftsFromProduct,
  parseClipboard,
  parsePrice,
  priceListChanges,
  priceProblems,
  priceRuns,
  raisePrice,
  rebaseDrafts,
  tintLevel,
  writeCells,
  type PriceDrafts,
} from "./price-grid";

const offering = (schoolYearId: number, salePrice: number) => ({
  id: schoolYearId * 100 + salePrice,
  schoolYearId,
  salePrice,
  purchasePrice: null,
  currentStock: 1,
  openingStock: 1,
});

const product: ProductDetail = {
  id: 1,
  name: "Polo buzo",
  productTypeId: 1,
  garmentGenderId: null,
  sizeScaleId: 1,
  isActive: true,
  versions: [
    {
      id: 7,
      label: "2023",
      publisherId: null,
      notes: null,
      variants: [
        { id: 70, sizeId: 1, gradeId: null, offerings: [offering(8, 45)] },
        { id: 71, sizeId: 2, gradeId: null, offerings: [offering(8, 50)] },
      ],
    },
  ],
};

describe("parsePrice", () => {
  it("reads what a spreadsheet copies", () => {
    expect(parsePrice("S/ 45.00")).toBe(45);
    expect(parsePrice("45,5")).toBe(45.5);
    expect(parsePrice("  ")).toBeNull();
    expect(parsePrice("abc")).toBeUndefined();
    expect(parsePrice("0")).toBeUndefined();
  });
});

describe("parseClipboard", () => {
  it("splits Excel rows on tabs and hand-typed ones on spaces", () => {
    expect(parseClipboard("45\t45\t50\r\n30\t30\t33\n")).toEqual([
      ["45", "45", "50"],
      ["30", "30", "33"],
    ]);
    expect(parseClipboard("S/ 45  S/ 50")).toEqual([["45", "50"]]);
  });
});

describe("drafts", () => {
  const stored = draftsFromProduct(product);

  it("reads every stored offering by year and variant", () => {
    expect(stored).toEqual({
      y8: { v70: { sale: 45, cost: null }, v71: { sale: 50, cost: null } },
    });
  });

  it("drops a cell left with neither price, so undoing leaves it clean", () => {
    const typed = writeCells(stored, 9, [
      { variantKey: "v70", kind: "sale", value: 48 },
    ]);
    const cleared = writeCells(typed, 9, [
      { variantKey: "v70", kind: "sale", value: null },
    ]);
    expect(countChangedCells(stored, typed)).toBe(1);
    expect(cleared).toEqual(stored);
  });

  it("sends one full price list per changed version and year", () => {
    const edited = writeCells(stored, 8, [
      { variantKey: "v71", kind: "sale", value: null },
    ]);
    expect(priceListChanges(product, stored, edited)).toEqual([
      {
        versionId: 7,
        body: {
          schoolYearId: 8,
          replace: true,
          rows: [{ productVariantId: 70, salePrice: 45, purchasePrice: null }],
        },
      },
    ]);
  });

  it("keeps the user's edits and follows the backend for the rest on reload", () => {
    const current: PriceDrafts = {
      y8: { v70: { sale: 47, cost: null }, v71: { sale: 50, cost: null } },
    };
    const reloaded: PriceDrafts = {
      y8: { v70: { sale: 45, cost: null }, v71: { sale: 52, cost: null } },
      y9: { v99: { sale: 60, cost: null } },
    };
    expect(rebaseDrafts(stored, current, reloaded)).toEqual({
      y8: { v70: { sale: 47, cost: null }, v71: { sale: 52, cost: null } },
      y9: { v99: { sale: 60, cost: null } },
    });
  });
});

describe("price analysis", () => {
  it("groups consecutive sizes at one price", () => {
    expect(priceRuns([45, 45, null, 50, 50, 55])).toEqual([
      { start: 0, end: 1, price: 45 },
      { start: 3, end: 4, price: 50 },
      { start: 5, end: 5, price: 55 },
    ]);
  });

  it("shades cheaper prices lighter", () => {
    expect(tintLevel(45, [45, 50, 60])).toBe(0);
    expect(tintLevel(60, [45, 50, 60])).toBe(4);
  });

  it("flags a size cheaper than the one before, and costs without price", () => {
    const found = priceProblems([45, 50, 40], [30, null, 20]);
    expect(found.cheaperThanPrevious).toEqual([{ index: 2, previousIndex: 1 }]);
    expect(priceProblems([45, null], [50, 20])).toMatchObject({
      costAboveSale: [0],
      costWithoutSale: [1],
    });
  });

  it("raises to the céntimo", () => {
    expect(raisePrice(43, 5, 0)).toBe(45.15);
    expect(raisePrice(40, 0, 2.5)).toBe(42.5);
  });
});
