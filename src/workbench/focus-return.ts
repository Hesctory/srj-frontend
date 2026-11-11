/**
 * Remembers the app element that had focus before focus entered the console,
 * so hiding the console can hand focus back to it (otherwise a dialog's
 * FocusTrap parks it on the dialog container).
 */
let remembered: HTMLElement | null = null;

export const rememberFocusOrigin = (el: Element | null, host?: Element) => {
  if (!(el instanceof HTMLElement) || el === document.body) return;
  if (host?.contains(el) || el.closest(".wb-host")) return;
  remembered = el;
};

/** Returns the remembered element once, if it is still connected. */
export const takeFocusOrigin = (): HTMLElement | null => {
  const el = remembered;
  remembered = null;
  return el?.isConnected ? el : null;
};
