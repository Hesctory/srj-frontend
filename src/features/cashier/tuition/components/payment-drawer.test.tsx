import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpError } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import type {
  PaymentPlan,
  PaymentPlanTender,
  PaymentPreviewResponse,
} from "@/types/payment";
import { formatMoney } from "@/utils/money";

// Testing Library collapses the no-break space Intl puts after "S/".
const money = (value: number) => formatMoney(value).replace(/\s+/g, " ");
import PaymentDrawer from "./payment-drawer";

const methods = [
  { id: 1, name: "Efectivo", rate: null },
  { id: 2, name: "Tarjeta de Crédito", rate: 0.03 },
];

const cardTender = (
  patch: Partial<PaymentPlanTender> = {},
): PaymentPlanTender => ({
  paymentMethodId: 2,
  paymentMethodName: "Tarjeta de Crédito",
  amount: 350,
  rate: 0.03,
  commission: 11.5,
  charged: 361.5,
  netToAccount: 350,
  cashAccountId: 1,
  cashAccountName: "Cuenta POS",
  reference: null,
  suggestedCommission: 10.5,
  commissionTyped: true,
  ...patch,
});

const planWith = (tender: PaymentPlanTender): PaymentPlan => ({
  date: "2026-10-28",
  baseAmount: tender.amount,
  commissionTotal: tender.commission,
  amount: tender.charged,
  totalToAccounts: tender.amount,
  tenders: [tender],
  allocations: [
    {
      obligationId: 7,
      kind: "ENROLLMENT_CHARGE",
      description: "Pensión Octubre",
      allocated: tender.amount,
      outstandingBefore: 350,
      outstandingAfter: 0,
      newStatusCode: "PAID",
      newStatusName: "Pagado",
      dueDate: "2026-10-31",
    },
  ],
});

const previewOf = (tender: PaymentPlanTender): PaymentPreviewResponse => ({
  previewToken: "token-1",
  expiresAt: new Date(Date.now() + 300_000).toISOString(),
  plan: planWith(tender),
});

const makeDataProvider = () => ({
  getList: vi.fn(async () => ({ data: methods, total: methods.length })),
  previewEnrollmentPayment: vi.fn(async () => previewOf(cardTender())),
  confirmEnrollmentPayment: vi.fn(),
});

const renderDrawer = (dataProvider: ReturnType<typeof makeDataProvider>) =>
  renderWithAdmin(
    <PaymentDrawer
      state={{
        open: true,
        mode: "pay",
        target: {
          label: "Pensión Octubre - 2026",
          outstanding: 1050,
          obligationIds: [7],
        },
        charge: null,
        openId: 1,
      }}
      enrollmentId={3}
      asOf="2026-10-28"
      onClose={() => undefined}
      onExited={() => undefined}
    />,
    { dataProvider },
  );

const fillLine = async (
  user: ReturnType<typeof userEvent.setup>,
  method: string,
  amount: string,
) => {
  await user.click(await screen.findByRole("combobox", { name: /Medio 1/ }));
  await user.click(
    within(await screen.findByRole("listbox")).getByText(method),
  );
  await user.type(screen.getByLabelText("Monto del medio de pago 1"), amount);
};

const sentLines = (dataProvider: ReturnType<typeof makeDataProvider>) =>
  (
    dataProvider.previewEnrollmentPayment.mock.calls[0] as unknown as [
      { lines: unknown[] },
    ]
  )[0].lines;

describe("PaymentDrawer — card commission", { timeout: 30_000 }, () => {
  it("sends the commission typed on a card line and shows it as typed", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderDrawer(dataProvider);

    await fillLine(user, "Tarjeta de Crédito", "350");
    await user.type(
      screen.getByLabelText("Comisión del medio de pago 1"),
      "11.50",
    );
    await user.click(screen.getByRole("button", { name: "Calcular plan" }));

    await waitFor(() =>
      expect(dataProvider.previewEnrollmentPayment).toHaveBeenCalled(),
    );
    expect(sentLines(dataProvider)).toEqual([
      { paymentMethodId: 2, amount: 350, reference: null, commission: 11.5 },
    ]);

    expect(await screen.findByText(/Comisión digitada/)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`sugerida ${money(10.5)}`)),
    ).toBeInTheDocument();
    expect(screen.getAllByText(money(361.5)).length).toBeGreaterThan(0);
  });

  it("sends null when the commission is left blank and shows the suggestion", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentPayment.mockResolvedValueOnce(
      previewOf(
        cardTender({
          commission: 10.5,
          charged: 360.5,
          commissionTyped: false,
        }),
      ),
    );
    renderDrawer(dataProvider);

    await fillLine(user, "Tarjeta de Crédito", "350");
    await user.click(screen.getByRole("button", { name: "Calcular plan" }));

    await waitFor(() =>
      expect(dataProvider.previewEnrollmentPayment).toHaveBeenCalled(),
    );
    expect(sentLines(dataProvider)).toEqual([
      { paymentMethodId: 2, amount: 350, reference: null, commission: null },
    ]);
    expect(await screen.findByText(/Comisión sugerida/)).toBeInTheDocument();
  });

  it("sends 0 when the school absorbs the commission", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderDrawer(dataProvider);

    await fillLine(user, "Tarjeta de Crédito", "350");
    await user.type(screen.getByLabelText("Comisión del medio de pago 1"), "0");
    await user.click(screen.getByRole("button", { name: "Calcular plan" }));

    await waitFor(() =>
      expect(dataProvider.previewEnrollmentPayment).toHaveBeenCalled(),
    );
    expect(sentLines(dataProvider)).toEqual([
      { paymentMethodId: 2, amount: 350, reference: null, commission: 0 },
    ]);
  });

  it("asks for no commission on a method without a card rate", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderDrawer(dataProvider);

    await fillLine(user, "Efectivo", "350");

    expect(
      screen.queryByLabelText("Comisión del medio de pago 1"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Calcular plan" }));
    await waitFor(() =>
      expect(dataProvider.previewEnrollmentPayment).toHaveBeenCalled(),
    );
    expect(sentLines(dataProvider)).toEqual([
      { paymentMethodId: 1, amount: 350, reference: null, commission: null },
    ]);
  });

  it("shows the suggestion beside the field after going back to edit", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderDrawer(dataProvider);

    await fillLine(user, "Tarjeta de Crédito", "350");
    await user.click(screen.getByRole("button", { name: "Calcular plan" }));
    await user.click(
      await screen.findByRole("button", { name: "Volver a editar" }),
    );

    expect(
      await screen.findByText(`Sugerida: ${money(10.5)}`),
    ).toBeInTheDocument();
  });

  it("refuses a commission not less than the line's amount before asking", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderDrawer(dataProvider);

    await fillLine(user, "Tarjeta de Crédito", "350");
    await user.type(
      screen.getByLabelText("Comisión del medio de pago 1"),
      "350",
    );
    await user.click(screen.getByRole("button", { name: "Calcular plan" }));

    expect(
      await screen.findByText("Debe ser menor al monto"),
    ).toBeInTheDocument();
    expect(dataProvider.previewEnrollmentPayment).not.toHaveBeenCalled();
  });

  it("marks the line the server refuses a commission on (422)", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentPayment.mockRejectedValueOnce(
      new HttpError("Unprocessable Entity", 422, {
        errors: {
          // A backdated payment, before the card rate was in force.
          "lines[0].commission": "Este medio de pago no cobra comisión.",
        },
      }),
    );
    renderDrawer(dataProvider);

    await fillLine(user, "Tarjeta de Crédito", "350");
    await user.type(
      screen.getByLabelText("Comisión del medio de pago 1"),
      "12",
    );
    await user.click(screen.getByRole("button", { name: "Calcular plan" }));

    const field = await screen.findByLabelText("Comisión del medio de pago 1");
    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
    expect(
      screen.getAllByText("Este medio de pago no cobra comisión.").length,
    ).toBeGreaterThan(0);
  });
});

describe("PaymentDrawer — boleta above S/ 700", { timeout: 30_000 }, () => {
  it("names the missing identity document when the preview is refused", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    const message =
      "Una boleta mayor a S/ 700.00 requiere el DNI o carné de extranjería de Ana Prueba. Regístrelo en su ficha antes de cobrar.";
    dataProvider.previewEnrollmentPayment.mockRejectedValueOnce(
      new HttpError("Unprocessable Entity", 422, {
        errors: { acquirerDocument: message },
      }),
    );
    renderDrawer(dataProvider);

    await fillLine(user, "Efectivo", "701");
    await user.click(screen.getByRole("button", { name: "Calcular plan" }));

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByText("Falta el documento de identidad"),
    ).toBeInTheDocument();
    expect(within(alert).getByText(message)).toBeInTheDocument();
    // Still on the form: nothing was written, the cashier can retry later.
    expect(
      screen.getByRole("button", { name: "Calcular plan" }),
    ).toBeInTheDocument();
  });
});
