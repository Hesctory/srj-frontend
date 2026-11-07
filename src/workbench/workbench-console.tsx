import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmProvider } from "./confirm-dialog";
import { CONSOLE_CSS } from "./console-styles";
import { DateSection, ModeSection } from "./date-mode-section";
import { GenerateStudentsForm } from "./generate-students-form";
import { LogSection } from "./log-section";
import { SRJ_WORKBENCH_DEV_ONLY } from "./marker";
import { panelStore, usePanelState } from "./panel-store";
import { PrepareEnrollmentForm } from "./prepare-enrollment-form";
import { PreparePaymentsForm } from "./prepare-payments-form";
import { WorkspaceSection } from "./snapshots-section";
import { ConsoleMessages, StatusBar } from "./status-bar";
import { useWorkbench, WorkbenchProvider } from "./workbench-context";

const ConsoleBody = () => {
  const { locked } = useWorkbench();
  return (
    <div className="wb-scroll">
      <ConsoleMessages />
      <fieldset disabled={locked}>
        <DateSection />
        <ModeSection />
        <GenerateStudentsForm />
        <PrepareEnrollmentForm />
        <PreparePaymentsForm />
        <WorkspaceSection />
        <LogSection />
      </fieldset>
    </div>
  );
};

const hide = () => panelStore.setOpen(false);

/**
 * A dedicated layer for the console, appended to document.body (outside
 * #root) so no MUI modal can cover it, trap its focus or aria-hide it:
 * - where supported it is a manual popover, i.e. in the browser's top layer,
 *   above every z-index (otherwise the CSS falls back to a high z-index);
 * - focusin does not leave it, so MUI's FocusTrap never sees focus move into
 *   the console and never pulls it back into an open dialog;
 * - aria-hidden, which MUI sets on body children while a modal is open, is
 *   removed again at once.
 */
const useConsoleHost = () => {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.className = "wb-host";
    el.setAttribute("data-srj-workbench", SRJ_WORKBENCH_DEV_ONLY);
    const stopFocus = (event: Event) => event.stopPropagation();
    el.addEventListener("focusin", stopFocus);
    el.style.cssText =
      "position:fixed;inset:0;width:auto;height:auto;margin:0;padding:0;border:0;background:transparent;overflow:visible;pointer-events:none;z-index:2000";
    // When a focused console control is disabled or unmounted, focus drops to
    // <body> and MUI's FocusTrap (50 ms interval) would pull it into an open
    // dialog. Park it on the drawer first. Moves elsewhere (relatedTarget set)
    // and hiding the console (drawer gone) are left alone.
    const keepFocus = (event: FocusEvent) => {
      if (event.relatedTarget) return;
      const drawer = (event.target as Element | null)?.closest?.(".wb-drawer");
      if (!(drawer instanceof HTMLElement)) return;
      queueMicrotask(() => {
        if (
          el.isConnected &&
          drawer.isConnected &&
          document.activeElement === document.body
        )
          drawer.focus({ preventScroll: true });
      });
    };
    el.addEventListener("focusout", keepFocus);
    const unhide = new MutationObserver(() => {
      if (el.hasAttribute("aria-hidden")) el.removeAttribute("aria-hidden");
    });
    unhide.observe(el, { attributes: true, attributeFilter: ["aria-hidden"] });
    document.body.appendChild(el);
    if (typeof el.showPopover === "function") {
      el.setAttribute("popover", "manual");
      el.showPopover();
    }
    setHost(el);
    return () => {
      unhide.disconnect();
      el.removeEventListener("focusin", stopFocus);
      el.removeEventListener("focusout", keepFocus);
      el.remove();
      setHost(null);
    };
  }, []);

  return host;
};

/**
 * The development workbench: a translucent console drawer (docked beside the
 * app on wide screens, over it on narrow ones), or,
 * hidden, a thin tab on the right edge at mid-height, where the app keeps no
 * controls (its toolbars sit at the top and bottom). Never a page of the app.
 * Rendered through a portal into its own layer on document.body (see
 * useConsoleHost), so it works while an app dialog or drawer is open.
 * Mounted only in development (src/shared/components/dev-workbench.tsx).
 */
const WorkbenchConsole = () => {
  const host = useConsoleHost();
  return host ? createPortal(<ConsoleLayer />, host) : null;
};

const ConsoleLayer = () => {
  const { open } = usePanelState();

  // Open on a wide screen, the console docks: the app gives up its width
  // (html.wb-docked, see console-styles) so nothing of it sits underneath.
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("wb-docked");
    return () => document.documentElement.classList.remove("wb-docked");
  }, [open]);

  if (!open)
    return (
      <>
        <style>{CONSOLE_CSS}</style>
        <button
          type="button"
          data-srj-workbench={SRJ_WORKBENCH_DEV_ONLY}
          className="wb-launcher"
          onClick={() => panelStore.setOpen(true)}
          title="Abrir el Workbench (solo desarrollo)"
          aria-label="Abrir el Workbench"
        >
          WB
        </button>
      </>
    );

  return (
    <aside
      data-srj-workbench={SRJ_WORKBENCH_DEV_ONLY}
      className="wb-root wb-drawer"
      aria-label="Workbench (solo desarrollo)"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") hide();
      }}
    >
      <style>{CONSOLE_CSS}</style>
      <WorkbenchProvider>
        <ConfirmProvider>
          <header className="wb-header">
            <span>SRJ WORKBENCH · DEV</span>
            <button
              type="button"
              onClick={hide}
              aria-label="Ocultar el Workbench"
            >
              ocultar ▾
            </button>
          </header>
          <StatusBar />
          <ConsoleBody />
        </ConfirmProvider>
      </WorkbenchProvider>
    </aside>
  );
};

export default WorkbenchConsole;
