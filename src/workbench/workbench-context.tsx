import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { workbench, type WorkbenchResponse } from "./client";
import { contextOf } from "./preview-gate";
import type {
  OperationResult,
  WorkbenchOptions,
  WorkspaceStatus,
} from "./types";

export const STATUS_POLL_MS = 4000;
/** While the host does not answer, poll this rarely: each refused call is a
 * console error on whatever page the developer has open. */
export const STATUS_RETRY_MS = 30000;
export const RESTART_POLL_MS = 1000;
const RESTART_MAX_POLLS = 180;
export const RESTART_TIMEOUT_MESSAGE =
  "El backend no volvió a arrancar; revisa la consola del Workbench.";

interface Notice {
  message: string;
  warnings: string[];
}

interface WorkbenchApi {
  status: WorkspaceStatus | null;
  statusError: string | null;
  options: WorkbenchOptions | null;
  /** Why the selectors' options could not be loaded. */
  optionsError: string | null;
  /** Business date + mode: a preview is valid only in the one it ran in. */
  context: string;
  /** Something is running: the console's controls are locked. */
  locked: boolean;
  /** The host is restarting the backend. */
  restarting: boolean;
  /** Bumps after every operation, so sections reload what they show. */
  generation: number;
  refusal: string | null;
  notice: Notice | null;
  showRefusal: (message: string | null) => void;
  clearMessages: () => void;
  refreshStatus: () => Promise<WorkspaceStatus | null>;
  /** A workspace operation; `heavy` ones restart the backend. */
  operate: (
    method: "POST" | "DELETE",
    path: string,
    body?: unknown,
    heavy?: boolean,
  ) => Promise<WorkbenchResponse<OperationResult>>;
  /** Locks the console while `work` runs. */
  track: <T>(work: () => Promise<T>) => Promise<T>;
  /** After an action executed: refresh what it changed. */
  afterExecute: () => Promise<void>;
}

const WorkbenchContext = createContext<WorkbenchApi | null>(null);

export const useWorkbench = () => {
  const api = useContext(WorkbenchContext);
  if (!api) throw new Error("useWorkbench outside <WorkbenchProvider>");
  return api;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const WorkbenchProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [options, setOptions] = useState<WorkbenchOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const failingSince = useRef<number | null>(null);
  const lastAttempt = useRef(0);
  /** Set below; lets a recovered status poll reload the options. */
  const loadOptionsRef = useRef<() => Promise<void>>(async () => {});
  const [pending, setPending] = useState(0);
  const [heavy, setHeavy] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const refreshStatus = useCallback(async () => {
    lastAttempt.current = Date.now();
    const res = await workbench.get<WorkspaceStatus>("/status");
    if (!res.ok) {
      failingSince.current ??= Date.now();
      setStatusError(res.message);
      return null;
    }
    const recovered = failingSince.current !== null;
    failingSince.current = null;
    if (recovered) void loadOptionsRef.current();
    setStatus(res.data);
    setStatusError(null);
    return res.data;
  }, []);

  const loadOptions = useCallback(async () => {
    const res = await workbench.get<WorkbenchOptions>("/options");
    setOptions(res.ok ? res.data : null);
    setOptionsError(res.ok ? null : res.message);
  }, []);
  loadOptionsRef.current = loadOptions;

  useEffect(() => {
    void refreshStatus();
    void loadOptions();
    const timer = setInterval(() => {
      // Host down: back off to one try every STATUS_RETRY_MS (↻ still tries
      // at once), and pick the options up again once it answers.
      if (
        failingSince.current !== null &&
        Date.now() - lastAttempt.current < STATUS_RETRY_MS
      )
        return;
      void refreshStatus();
    }, STATUS_POLL_MS);
    return () => clearInterval(timer);
  }, [refreshStatus, loadOptions]);

  const waitForBackend = useCallback(async () => {
    for (let poll = 0; poll < RESTART_MAX_POLLS; poll++) {
      const current = await refreshStatus();
      if (
        current &&
        !current.busy &&
        (current.backendRunning || !current.workspaceExists)
      )
        return;
      await sleep(RESTART_POLL_MS);
    }
    setRefusal(RESTART_TIMEOUT_MESSAGE);
  }, [refreshStatus]);

  const clearMessages = useCallback(() => {
    setRefusal(null);
    setNotice(null);
  }, []);

  const track = useCallback(async <T,>(work: () => Promise<T>) => {
    setPending((count) => count + 1);
    try {
      return await work();
    } finally {
      setPending((count) => count - 1);
    }
  }, []);

  const operate = useCallback<WorkbenchApi["operate"]>(
    async (method, path, body, isHeavy = false) => {
      clearMessages();
      if (isHeavy) setHeavy(true);
      try {
        return await track(async () => {
          const res =
            method === "DELETE"
              ? await workbench.delete<OperationResult>(path)
              : await workbench.post<OperationResult>(path, body);
          if (!res.ok) setRefusal(res.message);
          else if (res.data?.message)
            setNotice({
              message: res.data.message,
              warnings: res.data.warnings ?? [],
            });
          if (isHeavy) await waitForBackend();
          else await refreshStatus();
          await loadOptions();
          setGeneration((value) => value + 1);
          return res;
        });
      } finally {
        if (isHeavy) setHeavy(false);
      }
    },
    [clearMessages, track, waitForBackend, refreshStatus, loadOptions],
  );

  const afterExecute = useCallback(async () => {
    await refreshStatus();
    setGeneration((value) => value + 1);
  }, [refreshStatus]);

  const api = useMemo<WorkbenchApi>(
    () => ({
      status,
      statusError,
      options,
      optionsError,
      context: contextOf(status),
      locked: pending > 0 || !!status?.busy,
      restarting: heavy || !!status?.busy,
      generation,
      refusal,
      notice,
      showRefusal: setRefusal,
      clearMessages,
      refreshStatus,
      operate,
      track,
      afterExecute,
    }),
    [
      status,
      statusError,
      options,
      optionsError,
      pending,
      heavy,
      generation,
      refusal,
      notice,
      clearMessages,
      refreshStatus,
      operate,
      track,
      afterExecute,
    ],
  );

  return (
    <WorkbenchContext.Provider value={api}>
      {children}
    </WorkbenchContext.Provider>
  );
};
