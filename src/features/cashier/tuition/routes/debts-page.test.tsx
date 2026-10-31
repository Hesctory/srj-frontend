import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithAdmin } from "@/test/render-with-admin";
import { totalsOf } from "@/features/cashier/tuition/utils/charges";
import type { EnrollmentCharge } from "@/types/enrollment-charge";
import { DebtsPage } from "./debts-page";

const settleable = (
  id: number,
  chargeTypeId: 1 | 2 | 3,
  description: string,
  dueDate: string,
): EnrollmentCharge => ({
  id,
  studentId: 4,
  enrollmentId: 25,
  year: 2026,
  chargeTypeId,
  chargeTypeName: ["Cuota", "Matrícula", "Mensualidad"][chargeTypeId - 1],
  month: chargeTypeId === 3 ? 11 : null,
  monthName: null,
  amount: 300,
  discount: 0,
  discountReason: null,
  netAmount: 300,
  description,
  isFullyWaived: false,
  isChargeVoided: false,
  isOverdue: false,
  daysOverdue: 0,
  isEffective: true,
  asOf: "2026-10-30",
  obligationId: id,
  dueDate,
  paidAmount: 0,
  outstandingAmount: 300,
  statusIsTerminal: false,
  effectiveStatusCode: "PENDING",
  effectiveStatusName: "Pendiente",
});

const waived: EnrollmentCharge = {
  ...settleable(4, 3, "Pensión Diciembre - 2026", ""),
  discount: 300,
  netAmount: 0,
  isFullyWaived: true,
  obligationId: null,
  dueDate: null,
  paidAmount: null,
  outstandingAmount: null,
  statusIsTerminal: null,
  effectiveStatusCode: null,
  effectiveStatusName: null,
};

const charges = [
  settleable(1, 1, "Cuota de Ingreso 2026", "2026-10-30"),
  settleable(2, 2, "Matrícula 2026", "2026-11-01"),
  settleable(3, 3, "Pensión Noviembre - 2026", "2026-11-30"),
  waived,
];

// What cancelling, repricing or withdrawing leaves behind: the obligation's
// stale balance must not read as a debt.
const voided: EnrollmentCharge = {
  ...settleable(5, 3, "Pensión Octubre - 2026", "2026-10-31"),
  isChargeVoided: true,
  statusIsTerminal: true,
  effectiveStatusCode: "CANCELLED",
  effectiveStatusName: "Cancelado",
} as EnrollmentCharge;

const makeGetList = (rows: EnrollmentCharge[]) =>
  vi.fn(async (resource: string, _params?: unknown) =>
    resource === "enrollment-charges"
      ? { data: rows, total: rows.length }
      : { data: [], total: 0 },
  );

const rowOf = (description: string) =>
  screen.getByText(description).closest(".MuiPaper-root") as HTMLElement;

const renderPage = (getList = makeGetList(charges)) =>
  renderWithAdmin(
    <Routes>
      <Route
        path="/cashier/tuition/:studentId/:enrollmentId/debts"
        element={<DebtsPage />}
      />
    </Routes>,
    {
      dataProvider: {
        getOne: vi.fn(async (resource: string) => ({
          data: { id: 4, resource },
        })),
        getList,
      },
    },
  );

describe("DebtsPage — due dates", { timeout: 30_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/cashier/tuition/4/25/debts";
  });

  it("shows the due date of every charge, cuota and matrícula included", async () => {
    renderPage();

    await screen.findByText("Cuota de Ingreso 2026");

    for (const [description, date] of [
      ["Cuota de Ingreso 2026", "30/10/2026"],
      ["Matrícula 2026", "01/11/2026"],
      ["Pensión Noviembre - 2026", "30/11/2026"],
    ]) {
      const row = within(rowOf(description));
      expect(row.getByText("Vence")).toBeInTheDocument();
      expect(row.getByText(date)).toBeInTheDocument();
    }
  });

  it("shows a dash on a waived charge, which raised no obligation", async () => {
    renderPage();

    await screen.findByText("Pensión Diciembre - 2026");

    const row = within(rowOf("Pensión Diciembre - 2026"));
    expect(row.getByText("Vence")).toBeInTheDocument();
    expect(row.getByText("Exonerado")).toBeInTheDocument();
    expect(row.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("repeats the due date in the payment drawer", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Matrícula 2026");
    await user.click(
      within(rowOf("Matrícula 2026")).getByRole("button", { name: "Pagar" }),
    );

    expect(await screen.findByText("Vence: 01/11/2026")).toBeInTheDocument();
  });
});

describe("DebtsPage — voided charges", { timeout: 30_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/cashier/tuition/4/25/debts";
  });

  it("asks the API for them, since it leaves them out by default", async () => {
    const getList = makeGetList([voided]);
    renderPage(getList);

    await screen.findByText("Pensión Octubre - 2026");

    const params = getList.mock.calls.find(
      ([resource]) => resource === "enrollment-charges",
    )?.[1] as { filter: unknown };
    expect(params.filter).toEqual({ enrollmentId: 25, includeVoided: true });
  });

  it("shows them as cancelled, with nothing to pay", async () => {
    renderPage(makeGetList([voided]));

    await screen.findByText("Pensión Octubre - 2026");

    const row = within(rowOf("Pensión Octubre - 2026"));
    expect(row.getByText("Anulado")).toBeInTheDocument();
    expect(row.queryByRole("button", { name: "Pagar" })).toBeNull();
    expect(row.getByRole("button", { name: "Detalles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pago rápido" })).toBeDisabled();
  });

  it("leaves them out of the balance and of the balance filters", async () => {
    const user = userEvent.setup();
    renderPage(
      makeGetList([
        voided,
        settleable(6, 3, "Pensión Octubre - 2026 nueva", "2026-10-31"),
      ]),
    );

    await screen.findByText("Pensión Octubre - 2026");
    expect(screen.getByRole("button", { name: "Pago rápido" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Con saldo" }));
    expect(screen.queryByText("Pensión Octubre - 2026")).toBeNull();
    expect(
      screen.getByText("Pensión Octubre - 2026 nueva"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sin saldo" }));
    expect(screen.queryByText("Pensión Octubre - 2026")).toBeNull();
  });

  it("does not count a voided charge in the totals", () => {
    expect(totalsOf([voided])).toEqual({
      charged: 0,
      discount: 0,
      paid: 0,
      outstanding: 0,
      overdueAmount: 0,
      overdueCount: 0,
    });
  });
});
