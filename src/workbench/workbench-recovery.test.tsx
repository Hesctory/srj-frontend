import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { panelStore } from "./panel-store";
import { STATUS_POLL_MS, STATUS_RETRY_MS } from "./workbench-context";
import WorkbenchConsole from "./workbench-console";

/** The host going down and coming back, and a list that fails to load. */

const API = "http://127.0.0.1:4100/api";

const STATUS = {
  businessDate: "2026-03-02",
  followingToday: false,
  mode: "off",
  history: "none",
  counts: {
    students: 0,
    relatives: 0,
    enrollments: 0,
    payments: 0,
    documents: 0,
  },
  snapshotCount: 0,
  snapshotCap: 100,
  snapshotBytes: 0,
  backendRunning: true,
  realAvailable: true,
  realAccount: "test",
  busy: false,
  workspaceExists: true,
  frontendUrl: "http://localhost:5173",
  backendUrl: "http://localhost:4000",
  realSendsEver: false,
  realUnavailableReason: null,
};

const OPTIONS = {
  schoolYears: [{ id: 1, year: 2026, active: true }],
  grades: [],
  shifts: [],
  feeConcepts: [],
  paymentMethods: [],
  enrollments: null,
  charges: null,
};

let hostUp = true;
let snapshotsFail = false;
const paths: string[] = [];

const json = (body: unknown, code = 200) =>
  new Response(JSON.stringify(body), { status: code });

const fakeFetch = vi.fn(async (url: string) => {
  const path = url.replace(API, "");
  paths.push(path);
  if (!hostUp) throw new TypeError("Failed to fetch");
  if (path === "/status") return json(STATUS);
  if (path.startsWith("/options")) return json(OPTIONS);
  if (path === "/workspace/snapshots")
    return snapshotsFail
      ? json({ message: "The snapshot folder is unreadable." }, 500)
      : json([]);
  if (path === "/simulated/next") return json({ queue: [] });
  if (path === "/log") return json([]);
  return json([]);
});

const statusCalls = () => paths.filter((path) => path === "/status").length;

beforeEach(() => {
  hostUp = true;
  snapshotsFail = false;
  paths.length = 0;
  vi.stubGlobal("fetch", fakeFetch);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
  panelStore.reset();
});

const renderOpen = () => {
  panelStore.setOpen(true);
  render(<WorkbenchConsole />);
};

describe("workbench console recovery", () => {
  it("backs off while the host is down and reloads the options once it answers", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    hostUp = false;
    renderOpen();
    await screen.findAllByText(/No se puede conectar con el Workbench/);
    await screen.findByText(/No se pudieron cargar las opciones/);

    const afterFirstTry = statusCalls();
    await act(() => vi.advanceTimersByTimeAsync(STATUS_POLL_MS * 3));
    expect(statusCalls()).toBe(afterFirstTry);

    hostUp = true;
    await act(() => vi.advanceTimersByTimeAsync(STATUS_RETRY_MS));
    expect(statusCalls()).toBeGreaterThan(afterFirstTry);
    await vi.waitFor(() =>
      expect(
        screen.queryByText(/No se pudieron cargar las opciones/),
      ).not.toBeInTheDocument(),
    );
  });

  it("reloads the options when the refresh button finds the host back", async () => {
    hostUp = false;
    renderOpen();
    await screen.findByText(/No se pudieron cargar las opciones/);

    hostUp = true;
    await userEvent.click(screen.getByLabelText("Actualizar estado"));
    await within(screen.getByLabelText("Estado del workspace")).findByText(
      "2026-03-02",
    );
    await vi.waitFor(() =>
      expect(
        screen.queryByText(/No se pudieron cargar las opciones/),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows the host's message when the snapshot list fails to load", async () => {
    snapshotsFail = true;
    renderOpen();
    await userEvent.click(screen.getByText("Workspace y snapshots"));
    expect(
      await screen.findByText(/The snapshot folder is unreadable\./),
    ).toBeInTheDocument();
    expect(screen.queryByText(/cargando/)).not.toBeInTheDocument();
  });
});
