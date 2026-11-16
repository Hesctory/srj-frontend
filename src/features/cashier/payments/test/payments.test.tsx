import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithAdmin } from "@/test/render-with-admin";
import type { Payment } from "@/types/payment";
import { PaymentsList } from "@/features/cashier/payments/resources/payments/payments-list";
import { PaymentShow } from "@/features/cashier/payments/resources/payments/payment-show";

type Fn = (...args: never[]) => Promise<unknown>;

/** Synthetic payment: every value here is made up. */
const makePayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 900,
  date: "2026-08-19",
  amount: 300,
  totalAllocated: 300,
  totalToAccounts: 300,
  isVoided: false,
  createdAt: "2026-08-19T14:30:00Z",
  createdBy: 1,
  tenders: [
    {
      id: 1,
      paymentMethodId: 1,
      paymentMethodName: "Efectivo",
      cashAccountId: 1,
      cashAccountName: "Caja chica",
      amount: 300,
      reference: null,
      isVoided: false,
    },
  ],
  allocations: [
    {
      id: 1,
      obligationId: 5,
      description: "Pensión de marzo",
      amountApplied: 300,
      originTypeCode: "ENROLLMENT_CHARGE",
      isVoided: false,
    },
  ],
  partyTypeCode: "STUDENT",
  partyId: 9,
  partyName: "Alumno Sintético",
  activeDocumentId: 901,
  activeDocumentNumber: "B001-00000001",
  openRecoveryCaseId: null,
  ...overrides,
});

const renderList = (getList: Fn) =>
  renderWithAdmin(<PaymentsList />, {
    resource: "payments",
    dataProvider: { getList },
  });

describe("Pagos list", { timeout: 30_000 }, () => {
  it("shows the columns of a payment and the open-case marker", async () => {
    renderList(
      vi.fn(async () => ({
        data: [makePayment({ openRecoveryCaseId: 41 })],
        total: 1,
      })) as unknown as Fn,
    );

    expect(await screen.findByText("Alumno Sintético")).toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("B001-00000001")).toBeInTheDocument();
    expect(screen.getByText("Vigente")).toBeInTheDocument();
    expect(screen.getByText("Corrección #41")).toBeInTheDocument();
  });

  it("shows no comprobante link when the comprobante fields are missing", async () => {
    const payment: Partial<Payment> = makePayment();
    delete payment.activeDocumentId;
    delete payment.activeDocumentNumber;
    renderList(
      vi.fn(async () => ({ data: [payment], total: 1 })) as unknown as Fn,
    );

    expect(await screen.findByText("Sin comprobante")).toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /N\.º/ }),
    ).not.toBeInTheDocument();
  });

  it("says nothing exists when the table is empty without filters", async () => {
    renderList(vi.fn(async () => ({ data: [], total: 0 })) as unknown as Fn);
    expect(
      await screen.findByText("Aún no hay pagos registrados."),
    ).toBeInTheDocument();
  });

  it("says nothing matches when filters leave no rows, and offers to clear them", async () => {
    window.location.hash =
      "#/payments?filter=" + encodeURIComponent('{"isVoided":true}');
    renderList(vi.fn(async () => ({ data: [], total: 0 })) as unknown as Fn);
    expect(
      await screen.findByText("Ningún pago coincide con estos filtros."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quitar filtros" }),
    ).toBeInTheDocument();
    window.location.hash = "";
  });

  it("shows an error with a retry when the list fails", async () => {
    renderList(
      vi.fn(async () => {
        throw new Error("boom");
      }) as unknown as Fn,
    );
    expect(
      await screen.findByText("No se pudo cargar la lista de pagos."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });
});

describe("Pago show", { timeout: 30_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/payments/900/show";
  });

  const renderShow = (payment: Payment) =>
    renderWithAdmin(
      <Routes>
        <Route path="/payments/:id/show" element={<PaymentShow />} />
      </Routes>,
      {
        resource: "payments",
        dataProvider: {
          getOne: vi.fn(async () => ({ data: payment })),
          getList: vi.fn(async () => ({ data: [], total: 0 })),
        } as unknown as Record<string, Fn>,
      },
    );

  it("shows tenders, allocations and the comprobante, and lets you correct", async () => {
    renderShow(makePayment());
    expect(await screen.findByText("Medios de pago")).toBeInTheDocument();
    expect(screen.getByText("Pensión de marzo")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "B001-00000001" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Corregir" })).toBeEnabled();
  });

  it("locks Corregir and links the case while one is open", async () => {
    renderShow(makePayment({ openRecoveryCaseId: 41 }));
    expect(
      await screen.findByText(/Hay una corrección en curso sobre este pago/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Corregir" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Ver el caso" })).toHaveAttribute(
      "href",
      expect.stringContaining("/payment-recovery-cases/41/show"),
    );
  });

  it("shows the voided info and no Corregir for a voided payment", async () => {
    renderShow(
      makePayment({
        isVoided: true,
        voidedAt: "2026-08-20T10:00:00Z",
        voidReason: "Error de monto",
      }),
    );
    expect(await screen.findByText(/Pago anulado/)).toBeInTheDocument();
    expect(screen.getByText(/Error de monto/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Corregir" })).toBeNull();
  });
});

describe("Pago show without comprobante", () => {
  it("says so", async () => {
    window.location.hash = "#/payments/900/show";
    renderWithAdmin(
      <Routes>
        <Route path="/payments/:id/show" element={<PaymentShow />} />
      </Routes>,
      {
        resource: "payments",
        dataProvider: {
          getOne: vi.fn(async () => ({
            data: makePayment({
              activeDocumentId: null,
              activeDocumentNumber: null,
            }),
          })),
        } as unknown as Record<string, Fn>,
      },
    );
    expect(
      await screen.findByText("Este pago no tiene un comprobante vigente."),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Corregir" }));
    expect(
      await screen.findByRole("radio", { name: /Anular el pago/ }),
    ).toBeInTheDocument();
  });
});
