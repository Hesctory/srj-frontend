import { useEffect } from "react";
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
 * The development workbench: a translucent console drawer (docked beside the
 * app on wide screens, over it on narrow ones), or,
 * hidden, a thin tab on the right edge at mid-height, where the app keeps no
 * controls (its toolbars sit at the top and bottom). Never a page of the app.
 * Mounted only in development (src/shared/components/dev-workbench.tsx).
 */
const WorkbenchConsole = () => {
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
