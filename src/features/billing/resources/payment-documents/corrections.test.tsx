import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithAdmin } from "@/test/render-with-admin";
import type { PaymentDocument } from "@/types/payment-document";
import { PaymentDocumentsList } from "./payment-documents-list";
import { PaymentDocumentShow } from "./payment-document-show";

type Fn = (...args: never[]) => Promise<unknown>;

/** Synthetic comprobante: every value here is made up. */
const makeDocument = (
  overrides: Partial<PaymentDocument> = {},
): PaymentDocument => ({
  id: 901,
  paymentId: 900,
  seriesId: 1,
  series: "B001",
  correlative: "00000001",
  number: "B001-00000001",
  voucherTypeCode: "BOLETA",
  voucherTypeName: "Boleta de venta",
  sunatVoucherCode: "03",
  paymentForm: "contado",
  issueDate: "2026-08-19",
  dueDate: null,
  amount: 300,
  acquirerDocumentType: null,
  acquirerDocumentNumber: null,
  acquirerFullName: null,
  link: null,
  isVoided: false,
  sunatStatusCode: "ACCEPTED",
  sunatStatusName: "Aceptado",
  sunatMessage: null,
  createdAt: "2026-08-19T14:30:00Z",
  openRecoveryCaseId: null,
  ...overrides,
});

const renderList = (rows: PaymentDocument[]) =>
  renderWithAdmin(<PaymentDocumentsList />, {
    resource: "payment-documents",
    dataProvider: {
      getList: vi.fn(async () => ({ data: rows, total: rows.length })),
      getOne: vi.fn(async () => ({ data: {} })),
    } as unknown as Record<string, Fn>,
  });

describe("Comprobantes: corrección", { timeout: 30_000 }, () => {
  it("opens the dialog from the row menu with the comprobante and payment actions", async () => {
    renderList([makeDocument()]);
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Acciones del comprobante B001-00000001",
      }),
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Corregir/ }),
    );

    for (const name of [
      /Anular el comprobante/,
      /Reemplazar el comprobante/,
      /Anular el pago/,
      /Reemplazar el pago/,
    ])
      expect(await screen.findByRole("radio", { name })).toBeInTheDocument();
  });

  it("marks the open case and locks Corregir in the row menu", async () => {
    renderList([makeDocument({ openRecoveryCaseId: 41 })]);
    expect(await screen.findByText("Corrección #41")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Acciones del comprobante B001-00000001",
      }),
    );
    expect(
      await screen.findByRole("menuitem", { name: /Corregir/ }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByRole("menuitem", { name: "Ver la corrección en curso" }),
    ).toBeInTheDocument();
  });

  const renderShow = (document: PaymentDocument) => {
    window.location.hash = "#/payment-documents/901/show";
    renderWithAdmin(
      <Routes>
        <Route
          path="/payment-documents/:id/show"
          element={<PaymentDocumentShow />}
        />
      </Routes>,
      {
        resource: "payment-documents",
        dataProvider: {
          getOne: vi.fn(async () => ({ data: { ...document, lines: [] } })),
        } as unknown as Record<string, Fn>,
      },
    );
  };

  it("shows Corregir in the detail and locks it while a case is open", async () => {
    renderShow(makeDocument({ openRecoveryCaseId: 41 }));
    expect(
      await screen.findByRole("button", { name: "Corregir" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "Ver la corrección en curso" }),
    ).toBeInTheDocument();
  });

  it("shows why a retired comprobante was retired and links its credit note", async () => {
    renderShow(
      makeDocument({
        isVoided: true,
        retirementKind: "FULL_CREDIT_NOTE",
        retirementReason: "Monto mal digitado",
        retiredAt: "2026-08-20T10:00:00Z",
        correctionDocumentId: 905,
      }),
    );
    expect(await screen.findByText("Comprobante anulado")).toBeInTheDocument();
    expect(screen.getByText(/Monto mal digitado/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver la nota de crédito" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("/payment-documents/905/show"),
    );
    expect(screen.queryByRole("button", { name: "Corregir" })).toBeNull();
  });
});
