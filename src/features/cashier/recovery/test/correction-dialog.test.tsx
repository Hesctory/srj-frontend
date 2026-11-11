import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdmin } from "@/test/render-with-admin";
import CorrectionDialog from "@/features/cashier/recovery/components/correction-dialog";
import CorrectButton from "@/features/cashier/recovery/components/correct-button";
import { makeCase } from "./fixtures";

type Fn = (...args: never[]) => Promise<unknown>;

const methods = [{ id: 1, name: "Efectivo", rate: null }];

const payment = {
  id: 900,
  isVoided: false,
  activeDocumentId: 901,
  activeDocumentNumber: "B001-00000001",
  allocations: [
    {
      id: 1,
      obligationId: 5,
      description: "Pensión de marzo",
      amountApplied: 300,
      isVoided: false,
    },
  ],
};

interface Setup {
  sunat?: string;
  paymentDocId?: number | null;
  extra?: Record<string, Fn>;
  documentId?: number | null;
  paymentId?: number | null;
}

const setup = ({
  sunat = "PENDING",
  paymentDocId = 901,
  extra = {},
  documentId = 901,
  paymentId = 900,
}: Setup = {}) => {
  const createDocumentRecoveryCase = vi.fn(async (..._a: unknown[]) =>
    makeCase({ id: 77 }),
  );
  const createPaymentRecoveryCase = vi.fn(async (..._a: unknown[]) =>
    makeCase({ id: 78 }),
  );
  const onClose = vi.fn();
  renderWithAdmin(
    <CorrectionDialog
      open
      onClose={onClose}
      documentId={documentId}
      paymentId={paymentId}
      documentNumber="B001-00000001"
    />,
    {
      dataProvider: {
        getOne: vi.fn(async (resource: string) => ({
          data:
            resource === "payments"
              ? { ...payment, activeDocumentId: paymentDocId }
              : { id: 901, isVoided: false, sunatStatusCode: sunat },
        })),
        getList: vi.fn(async () => ({ data: methods, total: 1 })),
        getCreditNoteReasons: vi.fn(async () => [
          { code: "01", name: "Anulación de la operación" },
        ]),
        createDocumentRecoveryCase,
        createPaymentRecoveryCase,
        ...extra,
      } as unknown as Record<string, Fn>,
    },
  );
  return { createDocumentRecoveryCase, createPaymentRecoveryCase, onClose };
};

const choose = async (name: RegExp) => {
  await userEvent.click(await screen.findByRole("radio", { name }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled(),
  );
  await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
};

const pickCause = async (label: string) => {
  await userEvent.click(await screen.findByRole("combobox", { name: "Causa" }));
  await userEvent.click(
    within(await screen.findByRole("listbox")).getByText(label),
  );
};

const justify = (text = "Prueba sintética") =>
  userEvent.type(screen.getByLabelText("Justificación"), text);

const next = () =>
  userEvent.click(screen.getByRole("button", { name: "Continuar" }));
const create = () =>
  userEvent.click(screen.getByRole("button", { name: "Crear corrección" }));

const body = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls[0][1] as Record<string, unknown>;

describe("CorrectionDialog", { timeout: 30_000 }, () => {
  it("anula un comprobante no aceptado: sin motivo, sin pagador, sin token", async () => {
    const { createDocumentRecoveryCase, createPaymentRecoveryCase } = setup();

    await choose(/Anular el comprobante/);
    await pickCause("Error de digitación");
    await justify();
    expect(screen.queryByLabelText(/Motivo de la nota/)).toBeNull();
    await next();
    await create();

    await waitFor(() => expect(createDocumentRecoveryCase).toHaveBeenCalled());
    expect(createDocumentRecoveryCase.mock.calls[0][0]).toBe(901);
    expect(createPaymentRecoveryCase).not.toHaveBeenCalled();
    const sent = body(createDocumentRecoveryCase);
    expect(sent).toMatchObject({
      action: "VOID_DOCUMENT",
      cause: "TYPING_ERROR",
      justification: "Prueba sintética",
    });
    expect(typeof sent.requestId).toBe("string");
    expect(sent).not.toHaveProperty("creditNoteReasonCode");
    expect(sent).not.toHaveProperty("payerRelationship");
    expect(sent).not.toHaveProperty("replacementPreviewToken");
  });

  it("offers only two causes for a document action", async () => {
    setup();
    await choose(/Anular el comprobante/);
    await userEvent.click(
      await screen.findByRole("combobox", { name: "Causa" }),
    );
    const options = within(await screen.findByRole("listbox")).getAllByRole(
      "option",
    );
    expect(options.map((o) => o.textContent)).toEqual([
      "Error de digitación",
      "Otra causa",
    ]);
  });

  it("pide el motivo solo si SUNAT aceptó el comprobante, y lo envía", async () => {
    const { createDocumentRecoveryCase } = setup({ sunat: "ACCEPTED" });

    await choose(/Anular el comprobante/);
    await pickCause("Otra causa");
    await justify();
    await next();
    expect(
      await screen.findByText("Elige el motivo de la nota de crédito."),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("combobox", { name: "Motivo de la nota de crédito" }),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: /Anulación de la operación/ }),
    );
    await next();
    await create();

    await waitFor(() => expect(createDocumentRecoveryCase).toHaveBeenCalled());
    expect(body(createDocumentRecoveryCase).creditNoteReasonCode).toBe("01");
  });

  it("reemplaza el comprobante con la nota del pagador, solo en esa acción", async () => {
    const { createDocumentRecoveryCase } = setup();

    await choose(/Reemplazar el comprobante/);
    await pickCause("Error de digitación");
    await justify();
    await userEvent.click(screen.getByRole("combobox", { name: "Pagó" }));
    await userEvent.click(await screen.findByRole("option", { name: "Otro" }));
    await next();
    expect(
      await screen.findByText("Escribe el nombre de quien pagó."),
    ).toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText(/Nombre de quien pagó/),
      "Tutor Sintético",
    );
    await next();
    await create();

    await waitFor(() => expect(createDocumentRecoveryCase).toHaveBeenCalled());
    expect(body(createDocumentRecoveryCase)).toMatchObject({
      action: "REPLACE_DOCUMENT",
      payerRelationship: "OTRO",
      payerName: "Tutor Sintético",
    });
  });

  it("anula un pago: llama al pago, lista las cuotas y explica la comisión", async () => {
    const { createPaymentRecoveryCase, createDocumentRecoveryCase } = setup({
      sunat: "ACCEPTED",
    });

    await choose(/Anular el pago/);
    expect(await screen.findByText("Pensión de marzo")).toBeInTheDocument();
    await pickCause("El pagador cambió el monto");
    expect(
      screen.getByText(/La comisión de tarjeta ya cobrada se conserva/),
    ).toBeInTheDocument();
    await justify();
    await userEvent.click(
      await screen.findByRole("combobox", {
        name: "Motivo de la nota de crédito",
      }),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: /Anulación/ }),
    );
    await next();
    await create();

    await waitFor(() => expect(createPaymentRecoveryCase).toHaveBeenCalled());
    expect(createDocumentRecoveryCase).not.toHaveBeenCalled();
    expect(createPaymentRecoveryCase.mock.calls[0][0]).toBe(900);
    expect(body(createPaymentRecoveryCase)).toMatchObject({
      action: "VOID_PAYMENT",
      cause: "PAYER_CHANGED_AMOUNT",
      creditNoteReasonCode: "01",
    });
  });

  it("no pide motivo en un pago sin comprobante vigente", async () => {
    setup({ paymentDocId: null, documentId: null });
    await choose(/Anular el pago/);
    await pickCause("Otra causa");
    expect(screen.queryByLabelText(/Motivo de la nota/)).toBeNull();
  });

  const fillReplacement = async () => {
    await userEvent.click(
      await screen.findByRole("combobox", { name: /Medio 1/ }),
    );
    await userEvent.click(
      within(await screen.findByRole("listbox")).getByText("Efectivo"),
    );
    await userEvent.type(
      screen.getByLabelText("Monto del medio de pago 1"),
      "120",
    );
  };

  it("reemplaza un pago con el token del cálculo, y lo invalida al cambiar la causa", async () => {
    const previewPaymentReplacement = vi.fn(async (..._a: unknown[]) => ({
      previewToken: `tok-${previewPaymentReplacement.mock.calls.length}`,
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      plan: { amount: 120, tenders: [], allocations: [] },
    }));
    const { createPaymentRecoveryCase } = setup({
      extra: { previewPaymentReplacement } as unknown as Record<string, Fn>,
    });

    await choose(/Reemplazar el pago/);
    await pickCause("Error de digitación");
    await justify();
    await next();
    expect(
      await screen.findByText("Calcula el pago correcto antes de continuar."),
    ).toBeInTheDocument();

    await fillReplacement();
    await userEvent.click(screen.getByRole("button", { name: "Calcular" }));
    await screen.findByText(/Listo para registrar un pago de/);

    await pickCause("El pagador cambió el monto");
    expect(
      await screen.findByRole("button", { name: "Recalcular" }),
    ).toBeInTheDocument();
    await next();
    expect(
      await screen.findByText("Calcula el pago correcto antes de continuar."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Recalcular" }));
    await screen.findByText(/Listo para registrar un pago de/);
    await next();
    await create();

    await waitFor(() => expect(createPaymentRecoveryCase).toHaveBeenCalled());
    expect(previewPaymentReplacement.mock.calls[1][1]).toMatchObject({
      cause: "PAYER_CHANGED_AMOUNT",
    });
    expect(body(createPaymentRecoveryCase)).toMatchObject({
      action: "REPLACE_PAYMENT",
      replacementPreviewToken: "tok-2",
    });
    expect(body(createPaymentRecoveryCase)).not.toHaveProperty(
      "payerRelationship",
    );
  });

  const reachConfirm = async () => {
    await choose(/Anular el comprobante/);
    await pickCause("Otra causa");
    await justify();
    await next();
  };

  it("muestra un 422 bajo su campo, volviendo a los detalles", async () => {
    setup({
      extra: {
        createDocumentRecoveryCase: vi.fn(async () => {
          throw {
            status: 422,
            body: { errors: { justification: "Muy corta." } },
          };
        }),
      } as unknown as Record<string, Fn>,
    });
    await reachConfirm();
    await create();
    expect((await screen.findAllByText("Muy corta.")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByLabelText("Justificación")).toBeVisible();
  });

  it("muestra el mensaje de un 409", async () => {
    setup({
      extra: {
        createDocumentRecoveryCase: vi.fn(async () => {
          throw { status: 409, body: { message: "Ya hay un caso abierto." } };
        }),
      } as unknown as Record<string, Fn>,
    });
    await reachConfirm();
    await create();
    expect(
      await screen.findByText("Ya hay un caso abierto."),
    ).toBeInTheDocument();
  });

  it("traduce un 500 a un mensaje amable y reintenta con el mismo requestId", async () => {
    const failing = vi.fn(async (..._a: unknown[]) => {
      throw { status: 500, body: { message: "NullReference en X" } };
    });
    setup({
      extra: { createDocumentRecoveryCase: failing } as unknown as Record<
        string,
        Fn
      >,
    });
    await reachConfirm();
    await create();
    expect(
      await screen.findByText(/Puede que ya haya otra/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/NullReference/)).toBeNull();

    await create();
    await waitFor(() => expect(failing).toHaveBeenCalledTimes(2));
    expect(body(failing).requestId).toBe(
      (failing.mock.calls[1][1] as Record<string, unknown>).requestId,
    );
  });

  it("deshabilita Crear mientras envía", async () => {
    setup({
      extra: {
        createDocumentRecoveryCase: vi.fn(() => new Promise(() => undefined)),
      } as unknown as Record<string, Fn>,
    });
    await reachConfirm();
    await create();
    expect(
      screen.getByRole("button", { name: "Crear corrección" }),
    ).toBeDisabled();
  });

  it("avisa antes de cerrar con datos sin guardar", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { onClose } = setup();
    await choose(/Anular el comprobante/);
    await justify("algo");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(confirm).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    confirm.mockRestore();
  });
});

describe("CorrectButton", () => {
  it("queda bloqueado con un caso abierto y enlaza a él", () => {
    renderWithAdmin(
      <CorrectButton
        documentId={901}
        paymentId={900}
        openRecoveryCaseId={41}
      />,
    );
    expect(screen.getByRole("button", { name: "Corregir" })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "Ver la corrección en curso" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("/payment-recovery-cases/41/show"),
    );
  });

  it("abre el diálogo cuando no hay caso abierto", async () => {
    renderWithAdmin(
      <CorrectButton
        documentId={null}
        paymentId={900}
        openRecoveryCaseId={null}
      />,
      {
        dataProvider: {
          getOne: vi.fn(async () => ({ data: payment })),
        },
      },
    );
    await userEvent.click(screen.getByRole("button", { name: "Corregir" }));
    expect(
      await screen.findByRole("radio", { name: /Anular el pago/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /comprobante/ })).toBeNull();
  });
});
