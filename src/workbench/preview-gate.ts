/**
 * When Execute is allowed. An action runs as Preview first; Execute is enabled
 * only for the exact inputs that were previewed, and only while the business
 * date and the Nubefact mode are still the ones that were current at preview
 * time. A successful Execute clears the stamp, so it cannot run twice.
 */

export const STALE_MESSAGE =
  "La fecha de negocio o el modo cambiaron — vuelve a previsualizar.";

export interface PreviewStamp {
  signature: string;
  context: string;
}

/** Stable JSON: the same inputs give the same signature whatever the key order. */
export const signatureOf = (value: unknown): string =>
  JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
            a < b ? -1 : a > b ? 1 : 0,
          ),
        )
      : v,
  );

export const contextOf = (
  status: { businessDate: string; mode: string } | null | undefined,
): string => (status ? `${status.businessDate}|${status.mode}` : "");

export type ExecuteState =
  | { enabled: true }
  | { enabled: false; reason: "not-previewed" | "inputs-changed" | "stale" };

export const executeState = (
  stamp: PreviewStamp | null,
  currentInputs: unknown | null,
  currentContext: string,
): ExecuteState => {
  if (!stamp) return { enabled: false, reason: "not-previewed" };
  if (stamp.context !== currentContext)
    return { enabled: false, reason: "stale" };
  if (currentInputs === null || stamp.signature !== signatureOf(currentInputs))
    return { enabled: false, reason: "inputs-changed" };
  return { enabled: true };
};

export const stampFor = (inputs: unknown, context: string): PreviewStamp => ({
  signature: signatureOf(inputs),
  context,
});

/**
 * What Execute tells the server it expects: the business date and mode the
 * preview ran in (not the current status). The host refuses a mismatch with
 * 409, which closes the gap between two status polls.
 */
export const expectationOf = (
  stamp: PreviewStamp,
): { businessDate: string; mode: string } => {
  const [businessDate = "", mode = ""] = stamp.context.split("|");
  return { businessDate, mode };
};
