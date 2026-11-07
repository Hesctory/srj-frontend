/**
 * Spanish copy for every code a recovery case carries.
 *
 * The backend sends codes (`WAITING_EXTERNAL`), never prose. A code this file
 * has not heard of falls back to a readable version of itself rather than to
 * the raw string, so a new backend value degrades to "Algo nuevo" instead of
 * `SOMETHING_NEW`.
 */

/** "SOME_CODE" → "Some code". */
export const humanize = (code: string | null | undefined): string => {
  if (!code) return "—";
  const words = code.replace(/_/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const lookup =
  (table: Record<string, string>) =>
  (code: string | null | undefined): string =>
    (code && table[code]) || humanize(code);

export const actionLabel = lookup({
  VOID_PAYMENT: "Anular pago",
  REPLACE_PAYMENT: "Reemplazar pago",
  VOID_DOCUMENT: "Anular comprobante",
  REPLACE_DOCUMENT: "Reemplazar comprobante",
  REPAIR_INCONSISTENCY: "Reparar inconsistencia",
});

export const actionDescription = lookup({
  VOID_PAYMENT:
    "El pago se deshace y las cuotas que cubría vuelven a quedar pendientes.",
  REPLACE_PAYMENT:
    "El pago se deshace y se registra el correcto en su lugar. El pago nuevo queda sin comprobante.",
  VOID_DOCUMENT: "Se anula el comprobante; el pago se mantiene.",
  REPLACE_DOCUMENT:
    "Se anula el comprobante y se emite uno nuevo del mismo pago.",
  REPAIR_INCONSISTENCY:
    "El sistema corrige el desajuste que encontró el escáner.",
});

export const causeLabel = lookup({
  TYPING_ERROR: "Error de digitación",
  PAYER_CHANGED_AMOUNT: "El pagador cambió el monto",
  OTHER: "Otra causa",
  INCONSISTENCY_DETECTED: "Inconsistencia detectada",
});

export const originLabel = lookup({
  USER: "Usuario",
  SCANNER: "Escáner",
});

export const statusLabel = lookup({
  QUEUED: "En cola",
  WAITING_EXTERNAL: "Esperando a SUNAT",
  NEEDS_REVIEW: "Requiere revisión",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
});

export const stepLabel = lookup({
  RECONCILE_DOCUMENT: "Conciliar el comprobante",
  CREATE_CREDIT_NOTE: "Generar la nota de crédito",
  FILE_CREDIT_NOTE: "Enviar la nota de crédito a SUNAT",
  FINALIZE_LOCALLY: "Anular el original en el sistema",
  GENERATE_REPLACEMENT_DOCUMENT: "Emitir el comprobante de reemplazo",
  VERIFY: "Verificar el resultado",
});

export const findingLabel = lookup({
  VOIDED_PAYMENT_HAS_LIVE_ALLOCATIONS:
    "Pago anulado con cuotas todavía aplicadas",
  VOIDED_PAYMENT_HAS_LIVE_MOVEMENTS: "Pago anulado con movimientos vivos",
  VOIDED_PAYMENT_HAS_ACTIVE_DOCUMENT: "Pago anulado con comprobante vigente",
  ACTIVE_PAYMENT_HAS_PARTIAL_VOID: "Pago vigente anulado a medias",
  STALE_SENT_DOCUMENT: "Comprobante enviado sin respuesta",
  ACCEPTED_CREDIT_NOTE_UNFINISHED: "Nota de crédito aceptada sin terminar",
  EXPIRED_RECOVERY_LEASE: "Corrección interrumpida",
  DOCUMENT_AMOUNT_MISMATCH: "El monto del comprobante no coincide",
});

export const severityLabel = lookup({
  CRITICAL: "Crítica",
  WARNING: "Advertencia",
});

export const eventTypeLabel = lookup({
  DETECTED: "Detectado por el escáner",
  CREATED: "Caso creado",
  RESOLVED: "Resuelto por una persona",
  CREDIT_NOTE_CREATED: "Nota de crédito generada",
  CREDIT_NOTE_RECOVERED: "Nota de crédito recuperada",
  WAITING_EXTERNAL: "Esperando respuesta de SUNAT",
  NEEDS_REVIEW: "Pasó a revisión",
  RETRY_SCHEDULED: "Reintento programado",
  LOCAL_FINALIZED: "Original anulado en el sistema",
  COMPLETED: "Caso completado",
});

export const commissionTreatmentLabel = lookup({
  RECOMPUTE: "Se recalcula sobre el monto correcto",
  PRESERVE: "Se conserva la comisión ya cobrada",
  NONE: "Sin efecto en la comisión",
});

/** Shown next to the cause choice, before anything is saved. */
export const causeCommissionHint = (cause: string | null): string => {
  switch (cause) {
    case "TYPING_ERROR":
      return "La comisión de tarjeta se recalcula sobre el monto correcto.";
    case "PAYER_CHANGED_AMOUNT":
      return "La comisión de tarjeta ya cobrada se conserva.";
    default:
      return "No cambia la comisión de tarjeta.";
  }
};
