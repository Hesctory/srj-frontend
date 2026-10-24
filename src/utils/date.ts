/**
 * Local-date helpers.
 *
 * `new Date().toISOString()` returns UTC, which for Peru (UTC-5) rolls over to
 * the next day after 19:00 local time. These helpers operate on the user's
 * local calendar day instead.
 */

/** Today as an `YYYY-MM-DD` string in the user's local timezone. */
export const todayLocal = (): string => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
};

/**
 * Format an ISO date (`YYYY-MM-DD`) for display in Spanish (`dd/mm/yyyy`).
 * Returns "—" for empty/invalid input.
 */
export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const [year, month, day] = iso.slice(0, 10).split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
};
