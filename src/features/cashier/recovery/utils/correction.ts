import type { RecoveryAction, RecoveryCause } from "@/types/payment-recovery";

export const DOCUMENT_ACTIONS: RecoveryAction[] = [
  "VOID_DOCUMENT",
  "REPLACE_DOCUMENT",
];
export const PAYMENT_ACTIONS: RecoveryAction[] = [
  "VOID_PAYMENT",
  "REPLACE_PAYMENT",
];

export const isPaymentAction = (action: RecoveryAction | ""): boolean =>
  action === "VOID_PAYMENT" || action === "REPLACE_PAYMENT";

/** What a person may say went wrong: payment actions also have a changed amount. */
export const causesFor = (action: RecoveryAction | ""): RecoveryCause[] =>
  isPaymentAction(action)
    ? ["TYPING_ERROR", "PAYER_CHANGED_AMOUNT", "OTHER"]
    : ["TYPING_ERROR", "OTHER"];

/** Short names for the first step, in plain words. */
export const correctionChoice = (action: RecoveryAction) => {
  switch (action) {
    case "VOID_DOCUMENT":
      return {
        title: "Anular el comprobante",
        text: "El comprobante deja de valer. El pago se mantiene tal como está.",
      };
    case "REPLACE_DOCUMENT":
      return {
        title: "Reemplazar el comprobante",
        text: "Se anula el comprobante y se emite uno nuevo del mismo pago.",
      };
    case "VOID_PAYMENT":
      return {
        title: "Anular el pago",
        text: "El pago se deshace y las cuotas que cubría vuelven a quedar pendientes.",
      };
    default:
      return {
        title: "Reemplazar el pago",
        text: "El pago se deshace y se registra el correcto en su lugar.",
      };
  }
};

/** What will happen, in plain Spanish. No step codes: the real path shows on the case. */
export const outcomeLines = (
  action: RecoveryAction,
  needsCreditNote: boolean,
): string[] => {
  const withdraw = needsCreditNote
    ? "SUNAT ya aceptó el comprobante: se anulará con una nota de crédito, que puede tardar unos minutos en confirmarse."
    : "El comprobante todavía no fue aceptado por SUNAT: se anulará en el sistema, sin nota de crédito.";
  switch (action) {
    case "VOID_DOCUMENT":
      return [withdraw, "El pago no cambia."];
    case "REPLACE_DOCUMENT":
      return [
        withdraw,
        "Después se emite un comprobante nuevo del mismo pago.",
        "El pago no cambia.",
      ];
    case "VOID_PAYMENT":
      return [
        "El pago se anula y sus cuotas vuelven a quedar pendientes.",
        needsCreditNote
          ? "Su comprobante vigente se anula con una nota de crédito."
          : "Si tiene comprobante vigente, también se anula.",
      ];
    default:
      return [
        "El pago anterior se anula y se registra el pago correcto en su lugar.",
        "El pago nuevo queda sin comprobante: podrás emitirlo desde el caso.",
        needsCreditNote
          ? "El comprobante del pago anterior se anula con una nota de crédito."
          : "Si el pago anterior tiene comprobante vigente, también se anula.",
      ];
  }
};
