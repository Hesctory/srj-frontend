import { useEffect } from "react";
import { panelStore } from "./panel-store";
import { rememberFocusOrigin } from "./focus-return";

const focusDrawer = () =>
  document.querySelector<HTMLElement>(".wb-drawer")?.focus({
    preventScroll: true,
  });

/**
 * Ctrl+Shift+E toggles the console from anywhere. Capture phase on window, so
 * it runs before MUI dialogs/drawers and app inputs see the key. Matches
 * event.code so it works on any keyboard layout.
 */
export const useToggleShortcut = () => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey) ||
        event.code !== "KeyE"
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (event.repeat) return;
      const opening = !panelStore.getState().open;
      panelStore.setOpen(opening);
      if (opening) {
        rememberFocusOrigin(document.activeElement);
        focusDrawer();
        // The drawer may mount a tick after the store changes.
        requestAnimationFrame(() => {
          if (
            panelStore.getState().open &&
            !document.activeElement?.closest(".wb-drawer")
          )
            focusDrawer();
        });
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);
};
