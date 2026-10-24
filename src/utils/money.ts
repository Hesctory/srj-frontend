/**
 * Money and date formatting, shared by every feature that shows soles.
 *
 * These used to live in the tuition feature's `utils/charges.ts`. They moved here
 * once payment documents needed them too — a helper used by two features is not
 * a helper of either one.
 */

const CURRENCY = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

/** "S/ 1,234.50". Renders a dash for rows with no value. */
export const formatMoney = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : CURRENCY.format(value);

/** "2026-04-30" → "30/04/2026". Parsed by hand: no timezone shifting. */
export const formatIsoDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};

/**
 * "2026-08-16T02:11:55.258036Z" → "16/08/2026 02:11".
 *
 * Unlike `formatIsoDate` this one *is* an instant, so it goes through `Date`
 * and lands in the reader's timezone — which is the point: it answers "how long
 * ago was this registered", not "what operative date does it carry".
 */
export const formatIsoDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "hace 12 minutos", "hace 3 días". Coarse on purpose: the only decision it
 * feeds is "has this been sitting too long", so seconds and weeks both round
 * into something a person can act on.
 */
export const formatAge = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "—";

  const elapsed = Date.now() - parsed;
  if (elapsed < MINUTE) return "recién";
  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;
  }
  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return `hace ${hours} hora${hours === 1 ? "" : "s"}`;
  }
  const days = Math.floor(elapsed / DAY);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
};

/** Whole days since `iso`. Drives the "this has waited too long" highlight. */
export const daysSince = (iso: string | null | undefined): number => {
  if (!iso) return 0;
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return 0;
  return Math.floor((Date.now() - parsed) / DAY);
};
