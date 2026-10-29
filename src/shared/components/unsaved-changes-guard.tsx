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
 * Asks before leaving a form with unsaved changes.
 *
 * Use it instead of React Admin's `warnWhenUnsavedChanges`, which logs an
 * error and does nothing while `App.tsx` uses a plain `BrowserRouter` (no data
 * router), and which only sees the form's own fields (the product editor's
 * prices live outside it). Closing or reloading the tab is guarded either
 * way; navigation inside the app only once the router supports blocking —
 * until then pair it with `CRUDToolBar`'s `onBeforeLeave` for "Volver".
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
