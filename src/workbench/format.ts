/** Small formatters for the console. */

export const humanBytes = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes || 0;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${unit ? value.toFixed(1) : value} ${units[unit]}`;
};

/** A UTC timestamp (with or without a zone suffix) in the browser's local time. */
export const localTime = (utc: string) => {
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(utc) ? utc : `${utc}Z`);
  return Number.isNaN(date.getTime()) ? utc : date.toLocaleString("es-PE");
};

export const utcLabel = (utc: string) => utc.slice(0, 19).replace("T", " ");

export const MODE_LABELS: Record<string, string> = {
  off: "Off",
  simulated: "Simulado",
  real: "Real",
};

export const OUTCOME_LABELS: Record<string, string> = {
  reject: "rechazo",
  timeout: "timeout",
  "timeout-registered": "timeout (registrado)",
  taken: "número tomado",
  pending: "pendiente",
};

export const LOG_KIND_LABELS: Record<string, string> = {
  action: "acción",
  workspace: "workspace",
};

export const LOG_RESULT_LABELS: Record<string, string> = {
  ok: "ok",
  refused: "rechazada",
  failed: "falló",
};

export const HISTORY_LABELS: Record<string, string> = {
  none: "ninguno",
  simulated: "simulado",
  real: "real",
};

/** A number from a form field, or null when it is blank or not a number. */
export const numberOrNull = (value: string) => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
