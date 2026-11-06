import { WORKBENCH_ORIGIN } from "./marker";

/**
 * The workbench's own HTTP client. It talks only to the local workbench host,
 * never through the app's dataProvider or authProvider, and never sends the
 * app's JWT: the workbench has no login.
 */
export const WORKBENCH_API_URL = `${WORKBENCH_ORIGIN}/api`;

export type WorkbenchResponse<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string };

type Method = "GET" | "POST" | "DELETE";

export const unreachableMessage = (cause: string) =>
  `No se puede conectar con el Workbench (${WORKBENCH_ORIGIN}): ${cause}`;

/**
 * Calls `path` (relative to /api) and never throws. A refusal's `message` is
 * returned exactly as the server wrote it.
 */
export const workbenchRequest = async <T>(
  method: Method,
  path: string,
  body?: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<WorkbenchResponse<T>> => {
  const init: RequestInit = {
    method,
    mode: "cors",
    credentials: "omit",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
  let response: Response;
  try {
    response = await fetchImpl(`${WORKBENCH_API_URL}${path}`, init);
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: unreachableMessage(
        error instanceof Error ? error.message : String(error),
      ),
    };
  }
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // An empty or non-JSON body.
  }
  if (response.ok)
    return { ok: true, status: response.status, data: data as T };
  const message =
    data && typeof data === "object" && "message" in data
      ? String((data as { message: unknown }).message)
      : `La solicitud falló (${response.status})`;
  return { ok: false, status: response.status, message };
};

export const workbench = {
  get: <T>(path: string) => workbenchRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) =>
    workbenchRequest<T>("POST", path, body),
  delete: <T>(path: string) => workbenchRequest<T>("DELETE", path),
};
