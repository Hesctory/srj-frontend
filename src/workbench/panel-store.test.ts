import { afterEach, describe, expect, it, vi } from "vitest";
import { panelStore, readOpen, writeOpen } from "./panel-store";

afterEach(() => vi.restoreAllMocks());

describe("console open/hidden persistence", () => {
  it("remembers whether the console is open", () => {
    panelStore.setOpen(true);
    expect(localStorage.getItem("srj.workbench.open")).toBe("1");
    panelStore.reset();
    expect(panelStore.getState().open).toBe(true);

    panelStore.setOpen(false);
    panelStore.reset();
    expect(panelStore.getState().open).toBe(false);
  });

  it("starts hidden and keeps working when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readOpen()).toBe(false);
    expect(() => writeOpen(true)).not.toThrow();
    panelStore.setOpen(true);
    expect(panelStore.getState().open).toBe(true);
  });

  it("opens with a prefill from a contextual button", () => {
    panelStore.setOpen(false);
    panelStore.openWith({ action: "prepare-enrollment", studentId: 7 });
    expect(panelStore.getState()).toEqual({
      open: true,
      prefill: { action: "prepare-enrollment", studentId: 7 },
    });
    panelStore.clearPrefill();
    expect(panelStore.getState().prefill).toBeNull();
  });
});
