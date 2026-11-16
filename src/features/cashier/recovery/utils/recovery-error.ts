import { toApiError, type ApiError } from "@/utils/api-error";

export interface RecoveryApiError extends ApiError {
  /**
   * `409` — somebody else changed the case, or a scan is already running. The
   * screen reloads the case (or says so) instead of retrying blindly.
   */
  isConflict: boolean;
}

const GENERIC_MESSAGE: Record<number, string> = {
  400: "No se pudo completar la corrección con los datos enviados.",
  401: "Tu sesión expiró. Vuelve a iniciar sesión.",
  403: "No tienes permiso para realizar esta acción.",
  404: "El caso ya no existe.",
  409: "El caso cambió mientras lo revisabas. Se recargó con lo último.",
  422: "Revisa los datos del formulario.",
};

const FALLBACK_MESSAGE =
  "No se pudo completar la operación. Inténtalo nuevamente.";

export const toRecoveryError = (cause: unknown): RecoveryApiError => {
  const error = toApiError(cause, GENERIC_MESSAGE, FALLBACK_MESSAGE);
  return { ...error, isConflict: error.status === 409 };
};

/** Shown when another person updated the case before this save. */
export const VERSION_CONFLICT_MESSAGE =
  "Otra persona actualizó este caso mientras lo revisabas. Se cargó la versión más reciente; revisa y vuelve a intentar.";
