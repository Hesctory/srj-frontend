import { useEffect } from "react";
import { useWatch } from "react-hook-form";
import { parseTokenExpiry } from "@/utils/token";

/** Academic cascade fields shared by every student-report filter form. */
const FIELDS = [
  "schoolYearId",
  "levelId",
  "gradeId",
  "shiftId",
  "sectionId",
] as const;

const PREFIX = "reportFilters:";

/**
 * Session identity derived from the JWT's `exp` claim. Each login produces a
 * token with a distinct expiry, so a re-login (after the JWT expires) lands in
 * a fresh bucket and the persisted filters reset — exactly the requested
 * "per session, restart when the JWT expires" behaviour. Falls back to "anon"
 * when there is no usable token.
 */
const sessionId = (): string => {
  const token = localStorage.getItem("token");
  const expiry = token ? parseTokenExpiry(token) : null;
  return expiry ? String(expiry.getTime()) : "anon";
};

const keyFor = (reportKey: string): string =>
  `${PREFIX}${reportKey}:${sessionId()}`;

/**
 * Read the persisted filters for a report. Intended to seed `<Form>`'s
 * `defaultValues` so the restored values survive React Admin's initial reset
 * (and so `defaultCurrentYear` correctly skips when a year is already stored).
 */
export const loadReportFilters = (
  reportKey: string,
): Record<string, unknown> => {
  try {
    const raw = sessionStorage.getItem(keyFor(reportKey));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const field of FIELDS) {
      if (parsed[field] != null) out[field] = parsed[field];
    }
    return out;
  } catch {
    return {};
  }
};

const saveReportFilters = (
  reportKey: string,
  values: Record<string, unknown>,
): void => {
  try {
    const current = keyFor(reportKey);

    // Drop this report's buckets from now-expired sessions so they don't
    // accumulate across re-logins within the same browser session.
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(`${PREFIX}${reportKey}:`) && k !== current) {
        sessionStorage.removeItem(k);
      }
    }

    const payload: Record<string, unknown> = {};
    for (const field of FIELDS) {
      if (values[field] != null) payload[field] = values[field];
    }

    if (Object.keys(payload).length === 0) sessionStorage.removeItem(current);
    else sessionStorage.setItem(current, JSON.stringify(payload));
  } catch {
    // Storage unavailable or over quota — persistence is best-effort.
  }
};

/**
 * Drop-in component that persists the academic filter cascade for a report.
 * Must be rendered inside a React Admin `<Form>` (it reads the form context).
 * Pair it with `loadReportFilters(reportKey)` on the same form's
 * `defaultValues`.
 */
export const ReportFiltersPersistence = ({
  reportKey,
}: {
  reportKey: string;
}) => {
  const values = useWatch({ name: FIELDS as unknown as string[] }) as unknown[];
  const serialized = JSON.stringify(values);

  useEffect(() => {
    const arr = JSON.parse(serialized) as unknown[];
    const obj: Record<string, unknown> = {};
    FIELDS.forEach((field, i) => {
      obj[field] = arr[i];
    });
    saveReportFilters(reportKey, obj);
  }, [reportKey, serialized]);

  return null;
};
