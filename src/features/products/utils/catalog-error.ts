/**
 * A backend refusal, flattened into what the UI reacts to. Mirrors
 * `toPaymentError` — same reasoning, different generic messages.
 *
 * Every status but `422` carries `{ message }`; `422` carries
 * `{ errors: { field: message } }` and *no* message, so `HttpError.message`
 * degrades to the HTTP status text there and must not be shown. Backend
 * messages are Spanish and written to be rendered verbatim.
 */
export interface CatalogApiError {
  status: number;
  /** Ready to render. */
  message: string;
  /** Populated on `422` only, keyed by request field. */
  fieldErrors: Record<string, string>;
  /**
   * `409` — the row has history behind it and destroying it would destroy the
   * ledger. Deactivating is the fallback the UI should offer.
   */
  isBlockedByHistory: boolean;
}

const GENERIC_MESSAGE: Record<number, string> = {
  400: "No se pudo guardar con los datos enviados. Revisa el formulario.",
  401: "Tu sesión expiró. Vuelve a iniciar sesión.",
  403: "No tienes permiso para modificar el catálogo.",
  404: "El registro ya no existe. Vuelve a cargar la página.",
  409: "No se puede eliminar: el registro tiene movimientos registrados.",
  422: "Revisa los datos del formulario.",
};

const FALLBACK_MESSAGE =
  "No se pudo completar la operación. Inténtalo nuevamente.";

export const toCatalogError = (cause: unknown): CatalogApiError => {
  const { status, body } = (cause ?? {}) as { status?: number; body?: unknown };
  const payload = (body ?? {}) as {
    message?: string;
    errors?: Record<string, string>;
  };
  const fieldErrors = payload.errors ?? {};
  const httpStatus = typeof status === "number" ? status : 0;

  return {
    status: httpStatus,
    message:
      payload.message ??
      Object.values(fieldErrors)[0] ??
      GENERIC_MESSAGE[httpStatus] ??
      FALLBACK_MESSAGE,
    fieldErrors,
    isBlockedByHistory: httpStatus === 409,
  };
};
