import {
  EnrollmentCharge,
  ObligationStatusCode,
  SettleableCharge,
} from "@/types/enrollment-charge";

/**
 * Re-exported so the many call sites in this feature keep their import. The
 * implementations moved to `@/utils/money` once payment documents
 * needed them too.
 */
export { formatMoney, formatIsoDate } from "@/utils/money";

/** The charge raised a debt, so it has payment data to show. */
export const isSettleable = (
  charge: EnrollmentCharge,
): charge is SettleableCharge => charge.obligationId !== null;

/** Still owes money: something can be collected against it. */
export const isPayable = (charge: EnrollmentCharge): boolean =>
  isSettleable(charge) &&
  !charge.isChargeVoided &&
  !charge.statusIsTerminal &&
  charge.outstandingAmount > 0;

/**
 * `statusIsTerminal` rows (PAID / CANCELLED) keep a stale non-zero
 * `outstandingAmount` — the backend contract says to ignore it there.
 */
export const outstandingOf = (charge: EnrollmentCharge): number =>
  isPayable(charge) ? (charge.outstandingAmount as number) : 0;

export type ChargeStatusColor =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info";

const STATUS_COLOR: Record<ObligationStatusCode, ChargeStatusColor> = {
  PENDING: "warning",
  PARTIALLY_PAID: "info",
  PAID: "success",
  OVERDUE: "error",
  CANCELLED: "default",
};

/** Chip colour for a bare status code — used where there is no charge row, e.g. the payment plan. */
export const statusColorOf = (code: ObligationStatusCode): ChargeStatusColor =>
  STATUS_COLOR[code] ?? "default";

/**
 * The row's display name. `description` is a ready-to-display label from the
 * backend; the fallback only matters for rows that somehow arrive without one.
 */
export const chargeLabel = (charge: EnrollmentCharge): string =>
  charge.description ??
  `${charge.chargeTypeName}${charge.monthName ? ` ${charge.monthName}` : ""} - ${charge.year}`;

/**
 * Label + colour for the status chip. Voided rows read as "Anulado" whatever
 * they were; waived rows have no status at all and read as "Exonerado"; overdue
 * rows are always red even when their effective status stays PARTIALLY_PAID
 * (the two signals are independent).
 */
export const statusChipOf = (
  charge: EnrollmentCharge,
): { label: string; color: ChargeStatusColor } => {
  if (charge.isChargeVoided) return { label: "Anulado", color: "default" };
  if (!isSettleable(charge)) {
    return {
      label: charge.isFullyWaived ? "Exonerado" : "Sin deuda",
      color: "default",
    };
  }
  return {
    label: charge.effectiveStatusName,
    color: charge.isOverdue
      ? "error"
      : (STATUS_COLOR[charge.effectiveStatusCode] ?? "default"),
  };
};

export type ChargeFilterKey = "all" | "outstanding" | "overdue" | "settled";

export const CHARGE_FILTERS: { key: ChargeFilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "outstanding", label: "Con saldo" },
  { key: "overdue", label: "Vencidos" },
  { key: "settled", label: "Sin saldo" },
];

export const matchesFilter = (
  charge: EnrollmentCharge,
  filter: ChargeFilterKey,
): boolean => {
  switch (filter) {
    case "outstanding":
      return isPayable(charge);
    case "overdue":
      return charge.isOverdue && !charge.isChargeVoided;
    case "settled":
      return !isPayable(charge) && !charge.isChargeVoided;
    default:
      return true;
  }
};

export interface ChargeTotals {
  charged: number;
  discount: number;
  paid: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
}

export const totalsOf = (charges: EnrollmentCharge[]): ChargeTotals =>
  charges.reduce<ChargeTotals>(
    (acc, charge) => {
      // Shown on the statement, but no longer part of what the family owes.
      if (charge.isChargeVoided) return acc;
      const outstanding = outstandingOf(charge);
      acc.charged += charge.netAmount;
      acc.discount += charge.discount;
      acc.paid += isSettleable(charge) ? charge.paidAmount : 0;
      acc.outstanding += outstanding;
      if (charge.isOverdue) {
        acc.overdueAmount += outstanding;
        acc.overdueCount += 1;
      }
      return acc;
    },
    {
      charged: 0,
      discount: 0,
      paid: 0,
      outstanding: 0,
      overdueAmount: 0,
      overdueCount: 0,
    },
  );

/**
 * Statement order: charge type, then month, then id. The backend returns this
 * order only when no `sort` is sent, and React Admin always sends one — so the
 * page re-sorts locally instead of relying on it.
 */
export const inStatementOrder = (charges: EnrollmentCharge[]) =>
  [...charges].sort(
    (a, b) =>
      a.chargeTypeId - b.chargeTypeId ||
      (a.month ?? 0) - (b.month ?? 0) ||
      a.id - b.id,
  );

/** Groups statement-ordered charges under their charge-type heading. */
export const groupByChargeType = (charges: EnrollmentCharge[]) => {
  const groups: {
    chargeTypeId: number;
    name: string;
    rows: EnrollmentCharge[];
  }[] = [];
  inStatementOrder(charges).forEach((charge) => {
    const last = groups[groups.length - 1];
    if (last && last.chargeTypeId === charge.chargeTypeId) {
      last.rows.push(charge);
      return;
    }
    groups.push({
      chargeTypeId: charge.chargeTypeId,
      name: charge.chargeTypeName,
      rows: [charge],
    });
  });
  return groups;
};
