import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithAdmin } from "@/test/render-with-admin";
import type { PaymentRecoveryCase } from "@/types/payment-recovery";
import { PaymentRecoveryCaseShow } from "@/features/cashier/recovery/resources/payment-recovery-cases/payment-recovery-case-show";
import { makeCase } from "./fixtures";

type Provider = Record<string, (...args: never[]) => Promise<unknown>>;

const reviewCase = (patch: Partial<PaymentRecoveryCase> = {}) =>
  makeCase({
    status: "NEEDS_REVIEW",
    availableActions: ["RESOLVE"],
    action: "VOID_DOCUMENT",
    cause: "OTHER",
    ...patch,
  });

const methods = [
  { id: 1, name: "Efectivo", rate: null },
  { id: 2, name: "Tarjeta", rate: 0.03 },
];

const renderReview = (record: PaymentRecoveryCase, extra: Provider = {}) => {
  const getOne = vi.fn(async (resource: string) => ({
    data:
      resource === "payment-recovery-cases"
        ? record
        : { id: 901, sunatStatusCode: "NOT_APPLICABLE" },
  }));
  renderWithAdmin(
    <Routes>
      <Route
        path="/payment-recovery-cases/:id/show"
        element={<PaymentRecoveryCaseShow />}
      />
    </Routes>,
    {
      resource: "payment-recovery-cases",
      dataProvider: {
        getOne,
        getList: vi.fn(async (..._args: unknown[]) => ({
          data: methods,
          total: methods.length,
        })),
        ...extra,
      },
    },
  );
  return { getOne };
};

const pickCause = async (label: string) => {
  await userEvent.click(screen.getByRole("combobox", { name: "Causa" }));
  await userEvent.click(
    within(await screen.findByRole("listbox")).getByText(label),
  );
};

const sentBody = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls[0][1] as Record<string, unknown>;

describe("Correcciones resolution", { timeout: 30_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/payment-recovery-cases/41/show";
  });

  it("refuses to save without a justification and sends nothing", async () => {
    const resolveRecoveryCase = vi.fn(async (..._args: unknown[]) =>
      makeCase(),
    );
    renderReview(reviewCase(), { resolveRecoveryCase });

    await userEvent.click(
      await screen.findByRole("button", { name: "Guardar resolución" }),
    );

    expect(
      await screen.findByText("Explica por qué se resuelve así."),
    ).toBeInTheDocument();
    expect(resolveRecoveryCase).not.toHaveBeenCalled();
  });

  it("sends the version the person saw, then confirms", async () => {
    const resolveRecoveryCase = vi.fn(async (..._args: unknown[]) =>
      makeCase(),
    );
    renderReview(reviewCase({ version: 7 }), { resolveRecoveryCase });

    await userEvent.type(
      await screen.findByLabelText("Justificación"),
      "Se anula por error",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar resolución" }),
    );

    await waitFor(() => expect(resolveRecoveryCase).toHaveBeenCalled());
    expect(resolveRecoveryCase.mock.calls[0][0]).toBe(41);
    expect(sentBody(resolveRecoveryCase)).toEqual({
      expectedVersion: 7,
      action: "VOID_DOCUMENT",
      cause: "OTHER",
      justification: "Se anula por error",
      creditNoteReasonCode: null,
      replacementPreviewToken: null,
    });
    expect(await screen.findByText(/Resolución guardada/)).toBeInTheDocument();
  });

  it("does not offer INCONSISTENCY_DETECTED once a payment action is chosen", async () => {
    renderReview(
      reviewCase({
        action: "REPAIR_INCONSISTENCY",
        cause: "INCONSISTENCY_DETECTED",
      }),
    );

    await screen.findByRole("combobox", { name: "Causa" });
    await userEvent.click(screen.getByRole("combobox", { name: "Causa" }));
    expect(
      within(await screen.findByRole("listbox")).getByText(
        "Inconsistencia detectada",
      ),
    ).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");

    await userEvent.click(screen.getByRole("radio", { name: /Anular pago/ }));
    // The forbidden cause is cleared, not silently kept.
    expect(
      screen.getByRole("combobox", { name: "Causa" }).textContent?.trim(),
    ).not.toContain("Inconsistencia");
    await userEvent.click(screen.getByRole("combobox", { name: "Causa" }));
    expect(
      within(await screen.findByRole("listbox")).queryByText(
        "Inconsistencia detectada",
      ),
    ).not.toBeInTheDocument();
  });

  it("asks for the credit-note reason only when SUNAT accepted the comprobante", async () => {
    const resolveRecoveryCase = vi.fn(async (..._args: unknown[]) =>
      makeCase(),
    );
    const record = reviewCase();
    const getOne = vi.fn(async (resource: string) => ({
      data:
        resource === "payment-recovery-cases"
          ? record
          : { id: 901, sunatStatusCode: "ACCEPTED" },
    }));
    renderWithAdmin(
      <Routes>
        <Route
          path="/payment-recovery-cases/:id/show"
          element={<PaymentRecoveryCaseShow />}
        />
      </Routes>,
      {
        resource: "payment-recovery-cases",
        dataProvider: {
          getOne,
          getCreditNoteReasons: vi.fn(async () => [
            { code: "01", name: "Anulación de la operación" },
          ]),
          resolveRecoveryCase,
        } as unknown as Provider,
      },
    );

    await userEvent.type(
      await screen.findByLabelText("Justificación"),
      "Motivo",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar resolución" }),
    );
    expect(
      await screen.findByText("Elige el motivo de la nota de crédito."),
    ).toBeInTheDocument();
    expect(resolveRecoveryCase).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("combobox", { name: "Motivo de la nota de crédito" }),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: /Anulación de la operación/ }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar resolución" }),
    );

    await waitFor(() => expect(resolveRecoveryCase).toHaveBeenCalled());
    expect(sentBody(resolveRecoveryCase).creditNoteReasonCode).toBe("01");
  });

  it("on a version conflict says so and reloads the case", async () => {
    const resolveRecoveryCase = vi.fn(async (..._args: unknown[]) => {
      throw { status: 409, body: { message: "interno" } };
    });
    const { getOne } = renderReview(reviewCase(), { resolveRecoveryCase });

    await userEvent.type(
      await screen.findByLabelText("Justificación"),
      "Motivo",
    );
    const loadsBefore = getOne.mock.calls.length;
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar resolución" }),
    );

    expect(
      await screen.findByText(/Otra persona actualizó este caso/),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(getOne.mock.calls.length).toBeGreaterThan(loadsBefore),
    );
  });

  it("shows a 422 under the field it names", async () => {
    const resolveRecoveryCase = vi.fn(async (..._args: unknown[]) => {
      throw { status: 422, body: { errors: { justification: "Muy corta." } } };
    });
    renderReview(reviewCase(), { resolveRecoveryCase });

    await userEvent.type(await screen.findByLabelText("Justificación"), "x");
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar resolución" }),
    );

    expect(await screen.findByText("Muy corta.")).toBeInTheDocument();
  });

  it("disables the button while the resolution is being sent", async () => {
    let finish: (value: unknown) => void = () => undefined;
    const resolveRecoveryCase = vi.fn(
      (..._args: unknown[]) =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderReview(reviewCase(), { resolveRecoveryCase });

    await userEvent.type(await screen.findByLabelText("Justificación"), "x");
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar resolución" }),
    );

    expect(
      screen.getByRole("button", { name: "Guardar resolución" }),
    ).toBeDisabled();
    finish(makeCase());
  });

  it("needs a replacement preview before saving REPLACE_PAYMENT, and sends its token", async () => {
    const resolveRecoveryCase = vi.fn(async (..._args: unknown[]) =>
      makeCase(),
    );
    const previewPaymentReplacement = vi.fn(async (..._args: unknown[]) => ({
      previewToken: "tok-1",
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      plan: { amount: 120, tenders: [], allocations: [] },
    }));
    renderReview(reviewCase(), {
      resolveRecoveryCase,
      previewPaymentReplacement,
    });

    await userEvent.click(
      await screen.findByRole("radio", { name: /Reemplazar pago/ }),
    );
    await pickCause("Error de digitación");
    await userEvent.type(screen.getByLabelText("Justificación"), "Monto mal");
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar resolución" }),
    );

    expect(
      await screen.findByText("Calcula el pago correcto antes de guardar."),
    ).toBeInTheDocument();
    expect(resolveRecoveryCase).not.toHaveBeenCalled();

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
    await userEvent.click(screen.getByRole("button", { name: "Calcular" }));

    await waitFor(() => expect(previewPaymentReplacement).toHaveBeenCalled());
    expect(previewPaymentReplacement.mock.calls[0][0]).toBe(900);
    expect(previewPaymentReplacement.mock.calls[0][1]).toEqual({
      cause: "TYPING_ERROR",
      lines: [
        { paymentMethodId: 1, amount: 120, reference: null, commission: null },
      ],
    });

    await userEvent.click(
      await screen.findByRole("button", { name: "Guardar resolución" }),
    );
    await waitFor(() => expect(resolveRecoveryCase).toHaveBeenCalled());
    expect(sentBody(resolveRecoveryCase)).toMatchObject({
      action: "REPLACE_PAYMENT",
      replacementPreviewToken: "tok-1",
    });
  });
});
