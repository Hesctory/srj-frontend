import { describe, expect, it } from "vitest";
import { enrollmentMonthChoice } from "./use-enrollment-preview";

describe("enrollmentMonthChoice", () => {
  it("asks about the current month during a billed month of the school year", () => {
    expect(enrollmentMonthChoice(2026, "2026-10-21")).toBe(10);
    expect(enrollmentMonthChoice(2026, "2026-03-01")).toBe(3);
    expect(enrollmentMonthChoice(2026, "2026-12-31")).toBe(12);
  });

  it("does not ask before March: all ten pensiones are raised", () => {
    expect(enrollmentMonthChoice(2026, "2026-02-28")).toBeNull();
    expect(enrollmentMonthChoice(2026, "2026-01-05")).toBeNull();
  });

  it("does not ask for another year's enrollment", () => {
    expect(enrollmentMonthChoice(2027, "2026-11-15")).toBeNull();
    expect(enrollmentMonthChoice(2025, "2026-04-10")).toBeNull();
  });

  it("does not ask before the school year is known", () => {
    expect(enrollmentMonthChoice(null, "2026-10-21")).toBeNull();
  });
});
