import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { panelStore } from "./panel-store";
import { INPUTS_CHANGED_MESSAGE } from "./action-panel";
import { STALE_MESSAGE } from "./preview-gate";
import WorkbenchConsole from "./workbench-console";

const API = "http://127.0.0.1:4100/api";

const baseStatus = {
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
  realAvailable: false,
  realAccount: null,
  busy: false,
  workspaceExists: true,
  frontendUrl: "http://localhost:5173",
  backendUrl: "http://localhost:4000",
  realSendsEver: false,
  realUnavailableReason: "No test account in .env.",
};

const OPTIONS = {
  schoolYears: [{ id: 1, year: 2026, active: true }],
  grades: [{ id: 2, name: "1°", levelId: 1, levelName: "Primaria" }],
  shifts: [{ schoolYearId: 1, gradeId: 2, shiftId: 3, name: "Mañana" }],
  feeConcepts: [{ id: 4, name: "Regular" }],
  paymentMethods: [{ id: 5, name: "Efectivo" }],
  enrollments: null,
  charges: null,
};

const result = (committed: boolean) => ({
  ok: true,
  committed,
  refusal: null,
  steps: ["Crea el alumno"],
  created: [
    {
      kind: "student",
      id: 77,
      label: "studenttest_001",
      frontendLink: "/students/77",
      apiLink: null,
    },
  ],
});

let status = { ...baseStatus };
/** Per-test answers, keyed "METHOD /path"; checked before the defaults. */
let overrides: Record<string, () => Response> = {};
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
  const override = overrides[`${method} ${path}`];
  if (override) return override();
  if (path === "/status") return json(status);
  if (path.startsWith("/options")) return json(OPTIONS);
  if (path.startsWith("/students")) return json([]);
  if (path === "/simulated/next") return json({ queue: [] });
  if (path === "/workspace/snapshots") return json([]);
  if (path === "/log") return json([]);
  if (path.endsWith("/preview")) return json(result(false));
  if (path.endsWith("/execute")) return json(result(true));
  return json({ message: "unknown" }, 404);
});

beforeEach(() => {
  status = { ...baseStatus };
  overrides = {};
  calls.length = 0;
  vi.stubGlobal("fetch", fakeFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  panelStore.reset();
});

const section = (title: string) =>
  screen.getByText(title).closest("details") as HTMLElement;

const openConsole = async () => {
  panelStore.setOpen(true);
  render(<WorkbenchConsole />);
  await within(screen.getByLabelText("Estado del workspace")).findByText(
    "2026-03-02",
  );
};

const fillGenerate = async () => {
  const form = section("Generar alumnos");
  const user = userEvent.setup();
  await user.click(screen.getByText("Generar alumnos"));
  await vi.waitFor(() => expect(form).toHaveAttribute("open"));
  const pick = (label: RegExp, value: string) =>
    user.selectOptions(within(form).getByLabelText(label), value);
  await screen.findAllByRole("option", { name: "2026 (activo)" });
  await pick(/^Año escolar/, "1");
  await pick(/^Grado/, "2");
  await pick(/^Turno/, "3");
  await pick(/^Concepto/, "4");
  return { form, user };
};

// Long user-event flows: slow when the whole suite runs in parallel.
describe("workbench console", { timeout: 20000 }, () => {
  it("enables Execute only for the previewed inputs, then disables it once executed", async () => {
    await openConsole();
    const { form, user } = await fillGenerate();
    const execute = within(form).getByRole("button", { name: "Ejecutar" });
    expect(execute).toBeDisabled();

    await user.click(
      within(form).getByRole("button", { name: "Previsualizar" }),
    );
    expect(await within(form).findByText("provisional (77)")).toBeVisible();
    expect(execute).toBeEnabled();
    expect(calls.find((c) => c.path.endsWith("/preview"))?.body).toEqual({
      count: 1,
      schoolYearId: 1,
      gradeId: 2,
      shiftId: 3,
      schoolFeeConceptId: 4,
      enrollmentDate: "2026-03-02",
    });

    const count = within(form).getByLabelText(/^Cantidad/);
    await user.clear(count);
    await user.type(count, "2");
    expect(execute).toBeDisabled();
    expect(within(form).getByText(INPUTS_CHANGED_MESSAGE)).toBeVisible();
    await user.clear(count);
    await user.type(count, "1");
    expect(execute).toBeEnabled();
    expect(within(form).queryByText(INPUTS_CHANGED_MESSAGE)).toBeNull();

    await user.click(execute);
    expect(await within(form).findByText(/^Guardado/)).toBeVisible();
    const preview = calls.find((c) => c.path.endsWith("/preview"));
    const executed = calls.find((c) => c.path.endsWith("/execute"));
    expect(preview?.body).not.toHaveProperty("expect");
    expect(executed?.body).toEqual({
      ...(preview?.body as object),
      expect: { businessDate: "2026-03-02", mode: "off" },
    });
    expect(execute).toBeDisabled();
  });

  it("asks for a new preview when the business date changes", async () => {
    await openConsole();
    const { form, user } = await fillGenerate();
    await user.click(
      within(form).getByRole("button", { name: "Previsualizar" }),
    );
    const execute = within(form).getByRole("button", { name: "Ejecutar" });
    await vi.waitFor(() => expect(execute).toBeEnabled());

    status = { ...baseStatus, businessDate: "2026-03-03" };
    await user.click(screen.getByRole("button", { name: "Actualizar estado" }));

    expect(await within(form).findByText(STALE_MESSAGE)).toBeVisible();
    expect(execute).toBeDisabled();
  });

  it("hides to a launcher and remembers it", async () => {
    await openConsole();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Ocultar el Workbench" }),
    );
    expect(screen.queryByLabelText("Workbench (solo desarrollo)")).toBeNull();
    expect(localStorage.getItem("srj.workbench.open")).toBe("0");

    await user.click(
      screen.getByRole("button", { name: "Abrir el Workbench" }),
    );
    const drawer = screen.getByLabelText("Workbench (solo desarrollo)");
    expect(drawer).toHaveAttribute(
      "data-srj-workbench",
      "SRJ_WORKBENCH_DEV_ONLY",
    );
    expect(localStorage.getItem("srj.workbench.open")).toBe("1");

    fireEvent.keyDown(drawer, { key: "Escape" });
    expect(
      screen.getByRole("button", { name: "Abrir el Workbench" }),
    ).toBeVisible();
  });

  it("fills the enrollment form from a contextual button", async () => {
    await openConsole();
    act(() =>
      panelStore.openWith({ action: "prepare-enrollment", studentId: 42 }),
    );
    const form = section("Preparar matrícula");
    expect(form).toHaveAttribute("open");
    expect(within(form).getByLabelText(/^Alumno/)).toHaveValue("existing");
    expect(within(form).getByLabelText(/^o id del alumno/)).toHaveValue(42);
    expect(panelStore.getState().prefill).toBeNull();
  });

  it("shows an Execute refusal word for word and turns Execute off", async () => {
    overrides["POST /actions/generate-students/execute"] = () =>
      json({ message: "The business date changed since the preview." }, 409);
    await openConsole();
    const { form, user } = await fillGenerate();
    await user.click(
      within(form).getByRole("button", { name: "Previsualizar" }),
    );
    const execute = within(form).getByRole("button", { name: "Ejecutar" });
    await vi.waitFor(() => expect(execute).toBeEnabled());

    await user.click(execute);
    expect(
      await within(form).findByText(
        "The business date changed since the preview.",
      ),
    ).toBeVisible();
    expect(execute).toBeDisabled();
  });

  it("shows why Real is unavailable", async () => {
    await openConsole();
    expect(screen.getByText("No test account in .env.")).toBeVisible();
  });

  it("asks before a reset, then shows the restart until the backend is back", async () => {
    overrides["POST /workspace/reset"] = () => {
      status = { ...baseStatus, busy: true, backendRunning: false };
      setTimeout(() => (status = { ...baseStatus }), 200);
      return json({ message: "The workspace was rebuilt.", warnings: [] });
    };
    await openConsole();
    const user = userEvent.setup();
    await user.click(screen.getByText("Workspace y snapshots"));

    await user.click(screen.getByRole("button", { name: "Reset" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(calls.some((c) => c.path === "/workspace/reset")).toBe(false);

    await user.click(screen.getByRole("button", { name: "Reset" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Reset",
      }),
    );
    expect(await screen.findByText(/^Reiniciando el backend/)).toBeVisible();
    await vi.waitFor(
      () => expect(screen.queryByText(/^Reiniciando el backend/)).toBeNull(),
      { timeout: 4000 },
    );
    expect(screen.getByText("The workspace was rebuilt.")).toBeVisible();
  });

  it("lists what a restore loses before restoring", async () => {
    const snapshot = {
      id: "snap_001",
      name: "antes de pagar",
      database: "srj_ws_main_snap_001",
      createdUtc: "2026-03-02T10:00:00",
      businessDate: "2026-03-02",
      wasFollowingToday: false,
      state: { mode: "off" },
    };
    overrides["GET /workspace/snapshots"] = () => json([snapshot]);
    overrides["GET /workspace/snapshots/snap_001/restore-preview"] = () =>
      json({
        snapshotId: "snap_001",
        name: "antes de pagar",
        snapshotBusinessDate: "2026-03-02",
        snapshotMode: "off",
        actionsThatWillBeLost: [
          {
            timeUtc: "2026-03-02T11:00:00Z",
            kind: "action",
            name: "prepare-payments",
            inputs: {},
            result: "ok",
            message: "2 payments",
            created: [],
            businessDate: "2026-03-02",
          },
        ],
        warnings: [],
      });
    overrides["POST /workspace/snapshots/snap_001/restore"] = () =>
      json({ message: "Restored.", warnings: [] });
    await openConsole();
    const user = userEvent.setup();
    await user.click(screen.getByText("Workspace y snapshots"));

    await user.click(await screen.findByRole("button", { name: "Restaurar" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Se perderán 1 acción/)).toBeVisible();
    expect(
      within(dialog).getByText(/prepare-payments: 2 payments/),
    ).toBeVisible();
    expect(
      calls.some((c) => c.path === "/workspace/snapshots/snap_001/restore"),
    ).toBe(false);

    await user.click(within(dialog).getByRole("button", { name: "Restaurar" }));
    await vi.waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.method === "POST" &&
            c.path === "/workspace/snapshots/snap_001/restore",
        ),
      ).toBe(true),
    );
  });

  it("fills the payments form, enrollment included, from a contextual button", async () => {
    overrides["GET /options?studentId=9&enrollmentId=11"] = () =>
      json({
        ...OPTIONS,
        enrollments: [
          {
            id: 11,
            schoolYearId: 1,
            year: 2026,
            gradeId: 2,
            gradeName: "1°",
            enrollmentDate: "2026-03-02",
          },
        ],
        charges: [],
      });
    await openConsole();
    act(() =>
      panelStore.openWith({
        action: "prepare-payments",
        studentId: 9,
        enrollmentId: 11,
      }),
    );
    const form = section("Preparar pagos");
    expect(form).toHaveAttribute("open");
    await vi.waitFor(() =>
      expect(within(form).getByLabelText(/^Matrícula/)).toHaveValue("11"),
    );
  });
});
