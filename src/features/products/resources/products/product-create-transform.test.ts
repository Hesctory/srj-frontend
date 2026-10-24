import { describe, expect, it } from "vitest";
import {
  PRODUCT_TYPE_BOOK,
  PRODUCT_TYPE_GARMENT,
  PRODUCT_TYPE_OTHER,
} from "./product-constants";
import {
  productCreateTransform,
  validateColumnKeys,
  validatePrices,
  type ProductCreateFormValues,
} from "./product-create-transform";

const base: ProductCreateFormValues = {
  name: "Polo buzo",
  productTypeId: PRODUCT_TYPE_GARMENT,
  garmentGenderId: 2,
  sizeScaleId: 1,
  publisherId: 9,
  schoolYearId: 3,
  columnKeys: ["s10", "s11", "g5"],
  prices: {
    s10: { sale: 45, cost: 30 },
    g5: { sale: 80, cost: null },
  },
};

describe("productCreateTransform", () => {
  it("creates one variant per chosen size and prices only the priced ones", () => {
    const body = productCreateTransform(base);
    const [version] = body.versions;

    expect(body.garmentGenderId).toBe(2);
    expect(version.publisherId).toBeNull();
    expect(version.variants).toEqual([
      {
        sizeId: 10,
        gradeId: null,
        offerings: [{ schoolYearId: 3, salePrice: 45, purchasePrice: 30 }],
      },
      { sizeId: 11, gradeId: null, offerings: [] },
    ]);
  });

  it("uses grades for a book, keeps its publisher and drops garment fields", () => {
    const body = productCreateTransform({
      ...base,
      productTypeId: PRODUCT_TYPE_BOOK,
    });
    const [version] = body.versions;

    expect(body.garmentGenderId).toBeNull();
    expect(body.sizeScaleId).toBeNull();
    expect(version.publisherId).toBe(9);
    expect(version.variants).toEqual([
      {
        sizeId: null,
        gradeId: 5,
        offerings: [{ schoolYearId: 3, salePrice: 80, purchasePrice: null }],
      },
    ]);
  });

  it("gives an 'other' product a single axis-less variant", () => {
    const body = productCreateTransform({
      ...base,
      productTypeId: PRODUCT_TYPE_OTHER,
      columnKeys: [],
      prices: { u: { sale: 12, cost: null } },
    });

    expect(body.versions[0].variants).toEqual([
      {
        sizeId: null,
        gradeId: null,
        offerings: [{ schoolYearId: 3, salePrice: 12, purchasePrice: null }],
      },
    ]);
  });
});

describe("create validation", () => {
  it("asks for at least one size or grade of the chosen type", () => {
    expect(validateColumnKeys(["g5"], base)).toBe("Marca al menos una talla.");
    expect(validateColumnKeys(["s10"], base)).toBeUndefined();
    expect(
      validateColumnKeys([], { ...base, productTypeId: PRODUCT_TYPE_OTHER }),
    ).toBeUndefined();
  });

  it("refuses a cost without a sale price", () => {
    expect(validatePrices({ s10: { sale: null, cost: 20 } })).toMatch(
      /costos sin precio/,
    );
    expect(validatePrices({ s10: { sale: 45, cost: 20 } })).toBeUndefined();
  });
});
