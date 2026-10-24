import { useState } from "react";
import {
  countChangedCells,
  dropVariants,
  rebaseDrafts,
  type PriceDrafts,
} from "@/features/products/utils/price-grid";

const HISTORY_LIMIT = 50;

interface DraftState {
  drafts: PriceDrafts;
  history: PriceDrafts[];
  /** The last bulk change, for the status line ("45 copiado a 4 celdas."). */
  status: string;
}

/**
 * Unsaved prices for a product, with undo.
 *
 * Kept outside the line's form on purpose: React Admin re-seeds the form every
 * time the record reloads, which happens after each version action, and that
 * would wipe prices being typed. Here a reload is merged instead
 * (`rebaseDrafts`).
 */
export const usePriceDrafts = (stored: PriceDrafts) => {
  const [base, setBase] = useState(stored);
  const [state, setState] = useState<DraftState>({
    drafts: stored,
    history: [],
    status: "",
  });

  // Derived-state update during render: runs before paint, never shows the
  // stale drafts for a frame.
  if (base !== stored) {
    setBase(stored);
    // The history too: undoing to a snapshot taken before the reload would
    // otherwise mark whatever the reload brought (a clone's prices) as cleared.
    setState((s) => ({
      ...s,
      drafts: rebaseDrafts(base, s.drafts, stored),
      history: s.history.map((h) => rebaseDrafts(base, h, stored)),
    }));
  }

  const apply = (next: PriceDrafts, status = "") =>
    setState((s) => ({
      drafts: next,
      history: [...s.history, s.drafts].slice(-HISTORY_LIMIT),
      status,
    }));

  const undo = () =>
    setState((s) =>
      s.history.length === 0
        ? s
        : {
            drafts: s.history[s.history.length - 1],
            history: s.history.slice(0, -1),
            status: "Cambio deshecho.",
          },
    );

  /** Back to what is stored, forgetting the history. */
  const discard = () => setState({ drafts: stored, history: [], status: "" });

  /** Keeps the drafts but forgets the history: after a save. */
  const settle = () => setState((s) => ({ ...s, history: [], status: "" }));

  /** Forgets variants that no longer exist (their version was deleted). */
  const forget = (keys: string[]) =>
    setState((s) => ({
      drafts: dropVariants(s.drafts, keys),
      history: s.history.map((h) => dropVariants(h, keys)),
      status: s.status,
    }));

  return {
    drafts: state.drafts,
    status: state.status,
    canUndo: state.history.length > 0,
    changedCount: countChangedCells(stored, state.drafts),
    apply,
    undo,
    discard,
    settle,
    forget,
  };
};

export type PriceDraftsApi = ReturnType<typeof usePriceDrafts>;

export default usePriceDrafts;
