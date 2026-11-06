import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type Confirm = (content: ReactNode, okLabel?: string) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm outside <ConfirmProvider>");
  return confirm;
};

interface Request {
  content: ReactNode;
  okLabel: string;
  resolve: (ok: boolean) => void;
}

/** A console-styled confirmation, drawn over the console only. */
export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [request, setRequest] = useState<Request | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  /** Where focus was before the dialog opened; it goes back there on close. */
  const returnTo = useRef<HTMLElement | null>(null);

  const confirm = useCallback<Confirm>(
    (content, okLabel = "Confirmar") =>
      new Promise((resolve) => {
        returnTo.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        setRequest({ content, okLabel, resolve });
      }),
    [],
  );

  useEffect(() => {
    if (!request) return;
    cancelRef.current?.focus({ preventScroll: true });
    // Modal: whatever scrolls behind the backdrop (the drawer below 600px,
    // its body above) stays put until the dialog closes.
    const scrollers = [".wb-scroll", ".wb-drawer"]
      .map((selector) => dialogRef.current?.closest<HTMLElement>(selector))
      .filter((element): element is HTMLElement => !!element);
    const previous = scrollers.map((element) => element.style.overflow);
    scrollers.forEach((element) => (element.style.overflow = "hidden"));
    return () =>
      scrollers.forEach(
        (element, index) => (element.style.overflow = previous[index]),
      );
  }, [request]);

  const close = (ok: boolean) => {
    request?.resolve(ok);
    setRequest(null);
    returnTo.current?.focus({ preventScroll: true });
  };

  /** Keeps Tab inside the dialog: it is modal over the console. */
  const trapTab = (event: KeyboardEvent) => {
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div className="wb-dialog-backdrop">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            className="wb-dialog"
            onKeyDown={(event) => {
              if (event.key === "Tab") trapTab(event);
              if (event.key === "Escape") {
                event.stopPropagation();
                close(false);
              }
            }}
          >
            {request.content}
            <div className="wb-row" style={{ justifyContent: "flex-end" }}>
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="wb-danger"
                onClick={() => close(true)}
              >
                {request.okLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
