import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { PriceDrafts } from "@/features/products/utils/price-grid";
import { writeCells } from "@/features/products/utils/price-grid";
import usePriceDrafts from "./use-price-drafts";

const before: PriceDrafts = { y8: { v1: { sale: 45, cost: null } } };
// A reload after cloning a version with its prices: v2 is new.
const after: PriceDrafts = {
  y8: { v1: { sale: 45, cost: null }, v2: { sale: 45, cost: null } },
};

describe("usePriceDrafts", () => {
  it("undo after a reload keeps what the reload brought", () => {
    const { result, rerender } = renderHook(
      ({ stored }) => usePriceDrafts(stored),
      { initialProps: { stored: before } },
    );

    act(() =>
      result.current.apply(
        writeCells(result.current.drafts, 8, [
          { variantKey: "v1", kind: "sale", value: 50 },
        ]),
      ),
    );
    rerender({ stored: after });
    expect(result.current.drafts.y8.v2).toEqual({ sale: 45, cost: null });

    act(() => result.current.undo());

    // Undone to "nothing changed" — not to "the clone's price was cleared",
    // which a save would send as a price list with the clone left out.
    expect(result.current.drafts).toEqual(after);
    expect(result.current.changedCount).toBe(0);
  });
});
