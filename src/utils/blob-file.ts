// Pure-DOM helpers for handing a Blob to the browser. No API/auth concerns —
// the Blob is already fetched (see dataProvider.exportReport). Shared by the
// report pages so the open-in-tab / download plumbing lives in one place.

/**
 * Point an already-opened tab at a Blob so the browser renders it inline
 * (e.g. its native PDF viewer). The tab must be opened synchronously inside the
 * click gesture — `window.open("", "_blank")` — and passed here after the async
 * fetch, so the popup blocker doesn't kill it. Revokes the object URL after a
 * grace period long enough for the viewer to load.
 */
export const openBlobInTab = (win: Window | null, blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  if (win) win.location.href = url;
  else window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

/** Trigger a file download for a Blob via a synthetic anchor click. */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
};
