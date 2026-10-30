import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithAdmin } from "@/test/render-with-admin";
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

const rowOf = (description: string) =>
  screen.getByText(description).closest(".MuiPaper-root") as HTMLElement;

const renderPage = () =>
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
        getList: vi.fn(async (resource: string) =>
          resource === "enrollment-charges"
            ? { data: charges, total: charges.length }
            : { data: [], total: 0 },
        ),
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
