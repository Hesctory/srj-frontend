import { useSyncExternalStore } from "react";

/**
 * Whether the console is open, and the form a contextual button asked it to
 * fill. One module-level store: the console and the contextual buttons are
 * both loaded from src/workbench, so they share this module instance.
 *
 * "Open" survives reloads in localStorage. Storage can be missing or throw
 * (private window, blocked site data); the console then just starts hidden.
 */

const STORAGE_KEY = "srj.workbench.open";

export type WorkbenchPrefill =
  | { action: "prepare-enrollment"; studentId: number }
  | {
      action: "prepare-payments";
      studentId: number;
      enrollmentId: number;
    };

interface PanelState {
  open: boolean;
  /** A new object on every request, so the same button pressed twice refills. */
  prefill: WorkbenchPrefill | null;
}

export const readOpen = (): boolean => {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

export const writeOpen = (open: boolean) => {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    // Not remembered; the console still works.
  }
};

let state: PanelState = { open: readOpen(), prefill: null };
const listeners = new Set<() => void>();

const setState = (next: PanelState) => {
  state = next;
  listeners.forEach((listener) => listener());
};

export const panelStore = {
  getState: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setOpen: (open: boolean) => {
    writeOpen(open);
    setState({ ...state, open });
  },
  openWith: (prefill: WorkbenchPrefill) => {
    writeOpen(true);
    setState({ open: true, prefill: { ...prefill } });
  },
  /** Called by the form that consumed the prefill. */
  clearPrefill: () => setState({ ...state, prefill: null }),
  /** Tests only: start from what storage says. */
  reset: () => setState({ open: readOpen(), prefill: null }),
};

export const usePanelState = () =>
  useSyncExternalStore(panelStore.subscribe, panelStore.getState);
