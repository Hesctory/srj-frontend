import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { panelStore } from "./panel-store";
import WorkbenchConsole from "./workbench-console";

const API = "http://127.0.0.1:4100/api";

const baseStatus = {
  businessDate: "2026-03-02",
  followingToday: false,
  mode: "real",
  history: "real",
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
  realSendsEver: true,
  realUnavailableReason: null,
  realHighWater: { "01": 5 } as Record<string, number>,
};

let status: Record<string, unknown> = baseStatus;
const calls: { method: string; path: string; body: unknown }[] = [];
const json = (body: unknown, code = 200) =>
  new Response(JSON.stringify(body), { status: code });

const fakeFetch = vi.fn(async (url: string, init: RequestInit) => {
  const path = url.replace(API, "");
  const method = init.method ?? "GET";
  calls.push({
    method,
    path,
    body: init.body ? JSON.parse(String(init.body)) : undefined,
  });
  if (path === "/status") return json(status);
  if (path.startsWith("/options"))
    return json({
      schoolYears: [],
      grades: [],
      shifts: [],
      feeConcepts: [],
      paymentMethods: [],
      enrollments: null,
      charges: null,
    });
  if (path === "/workspace/remote-numbering")
    return json({ message: "ok", warnings: [] });
  if (path === "/workspace/snapshots" || path === "/log") return json([]);
  if (path.startsWith("/students")) return json([]);
  return json({ message: "unknown" }, 404);
});

beforeEach(() => {
  status = baseStatus;
  calls.length = 0;
  vi.stubGlobal("fetch", fakeFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  panelStore.reset();
});

const openConsole = async () => {
  panelStore.setOpen(true);
  render(<WorkbenchConsole />);
  await within(screen.getByLabelText("Estado del workspace")).findByText(
    "2026-03-02",
  );
};

describe("Numeración en Nubefact", { timeout: 20000 }, () => {
  it("lists the known codes plus 03 and sets the last number", async () => {
    await openConsole();
    expect(await screen.findByText("Numeración en Nubefact")).toBeVisible();
    expect(screen.getByText(/01 Factura: último/)).toBeVisible();
    expect(screen.getByText(/03 Boleta: último/)).toBeVisible();
    expect(
      screen.getByText(/Ingresa el último número que Nubefact tiene/),
    ).toBeVisible();

    const user = userEvent.setup();
    const set = screen.getByRole("button", { name: "Fijar 03 Boleta" });
    expect(set).toBeDisabled();
    await user.type(screen.getByLabelText("Último número de 03 Boleta"), "14");
    await user.click(set);

    await vi.waitFor(() =>
      expect(
        calls.find((c) => c.path === "/workspace/remote-numbering")?.body,
      ).toEqual({ voucherCode: "03", last: 14 }),
    );
  });

  it("is hidden outside real mode", async () => {
    status = { ...baseStatus, mode: "off" };
    await openConsole();
    expect(screen.queryByText("Numeración en Nubefact")).toBeNull();
  });
});
