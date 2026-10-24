import { describe, expect, it } from "vitest";
import type { ProductVersion } from "@/types/product";
import { orderVersions } from "./version-rows";

const version = (id: number, years: number[]): ProductVersion => ({
  id,
  label: String(id),
  publisherId: null,
  notes: null,
  variants: [
    {
      id: id * 10,
      sizeId: 1,
      gradeId: null,
      offerings: years.map((schoolYearId, i) => ({
        id: id * 100 + i,
        schoolYearId,
        salePrice: 10,
        purchasePrice: null,
        currentStock: 0,
        openingStock: 0,
      })),
    },
  ],
});

// School year ids are not chronological: 17 is 2026, 3 is 2024.
const rank = new Map([
  [17, 2026],
  [16, 2025],
  [3, 2024],
]);
const ids = (versions: ProductVersion[]) => versions.map((v) => v.id);

describe("orderVersions", () => {
  it("puts the version priced most recently first, by year not by id", () => {
    expect(
      ids(
        orderVersions(
          [version(1, [3]), version(2, [17, 16]), version(3, [16])],
          rank,
        ),
      ),
    ).toEqual([2, 3, 1]);
  });

  it("treats a never-priced version as the newest, and breaks ties by creation", () => {
    expect(
      ids(
        orderVersions(
          [version(1, [17]), version(2, []), version(3, [17])],
          rank,
        ),
      ),
    ).toEqual([2, 3, 1]);
  });
});
