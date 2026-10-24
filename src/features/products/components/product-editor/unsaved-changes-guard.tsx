import { useEffect } from "react";
import { useBlocker, useCanBlock, useTranslate } from "react-admin";

/** Asks before navigating inside the app. Needs a data router. */
const RouteBlocker = ({ when }: { when: boolean }) => {
  const translate = useTranslate();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm(translate("ra.message.unsaved_changes"))) {
      blocker.proceed?.();
    } else {
      blocker.reset?.();
    }
  }, [blocker, translate]);

  return null;
};

/**
 * Asks before leaving the editor with unsaved changes.
 *
 * React Admin's `warnWhenUnsavedChanges` only sees the form's own fields —
 * the edit screen's prices live outside the form (see `usePriceDrafts`) — and
 * it logs an error instead of working when the app has no data router, which
 * is the case while `App.tsx` uses a plain `BrowserRouter`. Closing or
 * reloading the tab is guarded either way; navigation inside the app only
 * once the router supports blocking.
 */
export const UnsavedChangesGuard = ({ when }: { when: boolean }) => {
  const canBlock = useCanBlock();

  useEffect(() => {
    if (!when) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [when]);

  return canBlock ? <RouteBlocker when={when} /> : null;
};

export default UnsavedChangesGuard;
