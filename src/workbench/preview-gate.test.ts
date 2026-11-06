import { describe, expect, it } from "vitest";
import { contextOf, executeState, signatureOf, stampFor } from "./preview-gate";

const status = { businessDate: "2026-03-02", mode: "off" };
const inputs = { count: 1, schoolYearId: 1, gradeId: 2 };

describe("preview gate", () => {
  it("signs the same inputs the same way whatever the key order", () => {
    expect(signatureOf({ b: 1, a: { d: 2, c: [1, { f: 1, e: 2 }] } })).toBe(
      signatureOf({ a: { c: [1, { e: 2, f: 1 }], d: 2 }, b: 1 }),
    );
    expect(signatureOf({ a: 1 })).not.toBe(signatureOf({ a: 2 }));
  });

  it("keeps Execute off until something was previewed", () => {
    expect(executeState(null, inputs, contextOf(status))).toEqual({
      enabled: false,
      reason: "not-previewed",
    });
  });

  it("enables Execute only for the exact inputs that were previewed", () => {
    const stamp = stampFor(inputs, contextOf(status));
    expect(executeState(stamp, { ...inputs }, contextOf(status))).toEqual({
      enabled: true,
    });
    expect(
      executeState(stamp, { ...inputs, count: 2 }, contextOf(status)),
    ).toEqual({ enabled: false, reason: "inputs-changed" });
    expect(executeState(stamp, null, contextOf(status))).toEqual({
      enabled: false,
      reason: "inputs-changed",
    });
  });

  it("goes stale when the business date or the mode changes", () => {
    const stamp = stampFor(inputs, contextOf(status));
    expect(
      executeState(
        stamp,
        inputs,
        contextOf({ ...status, businessDate: "2026-03-03" }),
      ),
    ).toEqual({ enabled: false, reason: "stale" });
    expect(
      executeState(stamp, inputs, contextOf({ ...status, mode: "simulated" })),
    ).toEqual({ enabled: false, reason: "stale" });
  });
});
