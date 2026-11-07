import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithAdmin } from "@/test/render-with-admin";
import type { PaymentRecoveryCase } from "@/types/payment-recovery";
import {
  PaymentRecoveryCaseShow,
  pollIntervalFor,
} from "@/features/cashier/recovery/resources/payment-recovery-cases/payment-recovery-case-show";
import { makeCase } from "./fixtures";

type Provider = Record<string, (...args: never[]) => Promise<unknown>>;

const renderShow = (record: PaymentRecoveryCase, extra: Provider = {}) =>
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
        getOne: vi.fn(async (resource: string) => ({
          data: resource === "payment-recovery-cases" ? record : { id: 0 },
        })),
        ...extra,
      },
    },
  );

describe("Correcciones show", { timeout: 30_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/payment-recovery-cases/41/show";
  });

  it("offers Reanudar when RESUME is available, and resumes the case", async () => {
    const resumeRecoveryCase = vi.fn(async (..._args: unknown[]) => makeCase());
    renderShow(
      makeCase({ status: "WAITING_EXTERNAL", availableActions: ["RESUME"] }),
      { resumeRecoveryCase },
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Reanudar" }),
    );

    expect(resumeRecoveryCase).toHaveBeenCalledWith(41);
    expect(screen.queryByText("Cómo resolverlo")).not.toBeInTheDocument();
  });

  it("drives the buttons from availableActions, not from the status", async () => {
    renderShow(makeCase({ status: "NEEDS_REVIEW", availableActions: [] }));

    await screen.findByText(/Caso #41/);
    expect(
      screen.queryByRole("button", { name: "Reanudar" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Cómo resolverlo")).not.toBeInTheDocument();
  });

  it("shows the resolution form when RESOLVE is available", async () => {
    renderShow(
      makeCase({ status: "NEEDS_REVIEW", availableActions: ["RESOLVE"] }),
    );
    expect(await screen.findByText("Cómo resolverlo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar resolución" }),
    ).toBeInTheDocument();
  });

  it("draws the path the backend sends, in its order", async () => {
    renderShow(
      makeCase({
        plannedSteps: [
          { step: "RECONCILE_DOCUMENT", state: "DONE" },
          { step: "FILE_CREDIT_NOTE", state: "CURRENT" },
          { step: "CREATE_CREDIT_NOTE", state: "SKIPPED" },
          { step: "VERIFY", state: "PENDING" },
        ],
      }),
    );

    await screen.findByText("Conciliar el comprobante");
    const items = screen.getAllByRole("listitem");
    const expected = [
      "Conciliar el comprobante",
      "Enviar la nota de crédito a SUNAT",
      "Generar la nota de crédito",
      "Verificar el resultado",
    ];
    expected.forEach((name, index) =>
      expect(items[index].textContent).toContain(name),
    );
    expect(
      screen.getByText("Enviar la nota de crédito a SUNAT").closest("li"),
    ).toHaveAttribute("aria-current", "step");
  });

  it("without plannedSteps says only where the case is, inventing no path", async () => {
    renderShow(
      makeCase({ status: "QUEUED", currentStep: "RECONCILE_DOCUMENT" }),
    );

    expect(
      await screen.findByText("Paso actual: Conciliar el comprobante"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Verificar el resultado"),
    ).not.toBeInTheDocument();
  });

  it("keeps raw messages under «Detalle técnico»", async () => {
    renderShow(
      makeCase({
        events: [
          {
            id: 1,
            eventType: "RETRY_SCHEDULED",
            status: "WAITING_EXTERNAL",
            step: "FILE_CREDIT_NOTE",
            message: "raw internal text id=77",
            actorUserId: null,
            createdAt: "2026-08-19T14:30:00Z",
          },
        ],
      }),
    );

    expect(await screen.findByText("Reintento programado")).toBeInTheDocument();
    const raw = screen.getByText("raw internal text id=77");
    expect(raw.closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText("Detalle técnico")).toBeInTheDocument();
  });

  it("lists the findings with their severity", async () => {
    renderShow(
      makeCase({
        origin: "SCANNER",
        findings: [
          {
            id: 1,
            code: "VOIDED_PAYMENT_HAS_ACTIVE_DOCUMENT",
            entityKind: "PAYMENT",
            entityId: 900,
            severity: "CRITICAL",
            detectedAt: "2026-08-19T14:30:00Z",
            lastSeenAt: "2026-08-19T14:30:00Z",
            resolvedAt: null,
          },
        ],
      }),
    );
    expect(
      await screen.findByText("Pago anulado con comprobante vigente"),
    ).toBeInTheDocument();
    expect(screen.getByText("Crítica")).toBeInTheDocument();
  });

  it("links the credit note and the replacement payment", async () => {
    renderShow(
      makeCase({ creditNoteDocumentId: 902, replacementPaymentId: 903 }),
    );
    expect(await screen.findByText("Nota de crédito")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "N.º 902" })).toHaveAttribute(
      "href",
      expect.stringContaining("/payment-documents/902/show"),
    );
    expect(screen.getByText("Pago de reemplazo")).toBeInTheDocument();
  });

  it("polls only while the backend is working on the case", () => {
    expect(pollIntervalFor("QUEUED")).toBe(15_000);
    expect(pollIntervalFor("WAITING_EXTERNAL")).toBe(15_000);
    expect(pollIntervalFor("NEEDS_REVIEW")).toBe(false);
    expect(pollIntervalFor("COMPLETED")).toBe(false);
  });
});
