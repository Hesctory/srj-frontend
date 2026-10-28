import type { AllocationKind, PaymentPlan } from "@/types/payment";

/** The token's real lifetime, per the contract. */
export const PREVIEW_TTL_SECONDS = 300;

/**
 * Whole seconds left before a preview token dies.
 *
 * `expiresAt` is a *server* instant compared against the *browser* clock, so a
 * skewed machine could otherwise promise a plan that is already dead. The
 * result is clamped to the contract's five minutes: an early expiry is
 * recoverable (recalculate), a late one is a failed confirmation.
 */
export const secondsUntil = (iso: string): number => {
  const ms = Date.parse(iso) - Date.now();
  if (!Number.isFinite(ms)) return 0;
  return Math.min(PREVIEW_TTL_SECONDS, Math.max(0, Math.ceil(ms / 1000)));
};

/** 272 → "4:32". */
export const formatCountdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;

/** Only a card commission is worth calling out; the rest read from `description`. */
export const ALLOCATION_KIND_LABEL: Partial<Record<AllocationKind, string>> = {
  CARD_COMMISSION: "Comisión",
  ADMISSION_REFUND: "Devolución",
};

/**
 * True when the plan's three totals diverge, i.e. an acquirer takes a cut.
 * Read from `commissionTotal` rather than from any tender's `rate`, so the
 * breakdown appears exactly when there is a gap to explain.
 */
export const hasCommission = (plan: PaymentPlan) => plan.commissionTotal > 0;

/**
 * Parses a money field. Accepts the comma that a Peruvian keyboard produces and
 * rejects everything that is not a strictly positive finite number.
 */
export const parseAmount = (input: string): number | null => {
  const trimmed = input.trim().replace(",", ".");
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  // Two decimals: the backend settles in soles and cents.
  return Math.round(value * 100) / 100;
};

/**
 * Parses the commission typed off a card terminal's slip. Blank is `null`
 * (take the server's suggestion) and `0` is a real answer (the school absorbs
 * it), so unlike `parseAmount` zero passes. `undefined` means unreadable.
 */
export const parseCommission = (input: string): number | null | undefined => {
  const trimmed = input.trim().replace(",", ".");
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value * 100) / 100;
};

/** Sums money without accumulating binary-float dust. */
export const sumMoney = (values: number[]) =>
  Math.round(values.reduce((total, value) => total + value, 0) * 100) / 100;
