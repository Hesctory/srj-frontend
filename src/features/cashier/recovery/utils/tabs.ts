import type { RecoveryStatus } from "@/types/payment-recovery";

/**
 * Cancelled cases are unreachable in the backend and hidden everywhere, so even
 * "Todos" names the four statuses it shows instead of leaving the filter open.
 */
export const VISIBLE_STATUSES: RecoveryStatus[] = [
  "QUEUED",
  "WAITING_EXTERNAL",
  "NEEDS_REVIEW",
  "COMPLETED",
];

/** A case that can still change without anyone touching it. */
export const OPEN_STATUSES: RecoveryStatus[] = [
  "QUEUED",
  "WAITING_EXTERNAL",
  "NEEDS_REVIEW",
];

export type RecoveryTabKey = "review" | "running" | "completed" | "all";

export interface RecoveryTab {
  key: RecoveryTabKey;
  label: string;
  status: RecoveryStatus[];
}

export const RECOVERY_TABS: RecoveryTab[] = [
  { key: "review", label: "Requieren revisión", status: ["NEEDS_REVIEW"] },
  {
    key: "running",
    label: "En curso",
    status: ["QUEUED", "WAITING_EXTERNAL"],
  },
  { key: "completed", label: "Completados", status: ["COMPLETED"] },
  { key: "all", label: "Todos", status: VISIBLE_STATUSES },
];

export const tabByKey = (key: RecoveryTabKey): RecoveryTab =>
  RECOVERY_TABS.find((tab) => tab.key === key) ?? RECOVERY_TABS[3];

/** Statuses the backend keeps working on alone: worth polling for. */
export const isAutoRunning = (status: string | null | undefined): boolean =>
  status === "QUEUED" || status === "WAITING_EXTERNAL";
