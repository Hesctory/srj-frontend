import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdmin } from "@/test/render-with-admin";
import { PaymentRecoveryCasesList } from "@/features/cashier/recovery/resources/payment-recovery-cases/payment-recovery-cases-list";
import { makeCase } from "./fixtures";

type Provider = Record<string, (...args: never[]) => Promise<unknown>>;

const renderList = (getList: Provider["x"], extra: Provider = {}) =>
  renderWithAdmin(<PaymentRecoveryCasesList />, {
    resource: "payment-recovery-cases",
    dataProvider: { getList, ...extra },
  });

const rows = (data: ReturnType<typeof makeCase>[]) =>
  vi.fn(async (..._args: unknown[]) => ({ data, total: data.length }));

type ListMock = ReturnType<typeof rows>;
type ListParams = { filter: Record<string, string[]> };
const lastParams = (getList: ListMock) =>
  getList.mock.calls[getList.mock.calls.length - 1][1] as ListParams;

const lastStatus = (getList: ListMock) => lastParams(getList).filter.status;

describe("Correcciones list", { timeout: 30_000 }, () => {
  it("opens on the cases that need review and never asks for CANCELLED", async () => {
    const getList = rows([makeCase({ status: "NEEDS_REVIEW" })]);
    renderList(getList);

    expect(await screen.findByText("#41")).toBeInTheDocument();
    expect(lastStatus(getList)).toEqual(["NEEDS_REVIEW"]);

    await userEvent.click(screen.getByRole("tab", { name: "En curso" }));
    await waitFor(() =>
      expect(lastStatus(getList)).toEqual(["QUEUED", "WAITING_EXTERNAL"]),
    );

    await userEvent.click(screen.getByRole("tab", { name: "Completados" }));
    await waitFor(() => expect(lastStatus(getList)).toEqual(["COMPLETED"]));

    await userEvent.click(screen.getByRole("tab", { name: "Todos" }));
    await waitFor(() =>
      expect(lastStatus(getList)).toEqual([
        "QUEUED",
        "WAITING_EXTERNAL",
        "NEEDS_REVIEW",
        "COMPLETED",
      ]),
    );
    expect(lastStatus(getList)).not.toContain("CANCELLED");
  });

  it("translates the codes of a row", async () => {
    renderList(
      rows([
        makeCase({
          status: "WAITING_EXTERNAL",
          action: "VOID_PAYMENT",
          origin: "SCANNER",
          currentStep: "FILE_CREDIT_NOTE",
        }),
      ]),
    );

    expect(await screen.findByText("Anular pago")).toBeInTheDocument();
    expect(screen.getByText("Esperando a SUNAT")).toBeInTheDocument();
    expect(
      screen.getByText("Enviar la nota de crédito a SUNAT"),
    ).toBeInTheDocument();
    expect(screen.queryByText("WAITING_EXTERNAL")).not.toBeInTheDocument();
  });

  it("says nothing needs review on the review tab when it is empty", async () => {
    renderList(rows([]));
    expect(
      await screen.findByText("No hay casos que requieran revisión."),
    ).toBeInTheDocument();
  });

  it("explains that nothing exists yet on «Todos» without filters", async () => {
    renderList(rows([]));
    await userEvent.click(await screen.findByRole("tab", { name: "Todos" }));
    expect(
      await screen.findByText(/Aún no hay correcciones/),
    ).toBeInTheDocument();
  });

  it("tells no-match apart from nothing-exists when a filter is set", async () => {
    const getList = rows([makeCase()]);
    renderList(getList);
    await screen.findByText("#41");

    getList.mockImplementation(async () => ({ data: [], total: 0 }));
    await userEvent.click(screen.getAllByRole("combobox")[0]);
    await userEvent.click(
      await screen.findByRole("option", { name: "Anular pago" }),
    );

    expect(
      await screen.findByText("Ningún caso coincide con estos filtros."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quitar filtros" }),
    ).toBeInTheDocument();
    expect(lastParams(getList).filter.action).toEqual(["VOID_PAYMENT"]);
  });

  it("shows an error with a retry when the list fails", async () => {
    const getList = vi.fn(async (..._args: unknown[]) => {
      throw new Error("boom");
    });
    renderList(getList);
    expect(
      await screen.findByText("No se pudo cargar la lista de casos."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });
});

describe("Correcciones scan", { timeout: 30_000 }, () => {
  it("reports what the scan found", async () => {
    const scanRecoveryCases = vi.fn(async () => ({
      scannedAt: "2026-08-19T14:30:00Z",
      detected: 5,
      opened: 2,
      autoQueued: 1,
      needsReview: 1,
    }));
    renderList(rows([]), { scanRecoveryCases });

    await userEvent.click(
      await screen.findByRole("button", { name: "Escanear inconsistencias" }),
    );

    expect(
      await screen.findByText(/5 inconsistencias detectadas/),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 casos nuevos/)).toBeInTheDocument();
    expect(screen.getByText(/1 en cola automática/)).toBeInTheDocument();
    expect(screen.getByText(/1 requiere revisión/)).toBeInTheDocument();
  });

  it("says a scan is already running on 409", async () => {
    const scanRecoveryCases = vi.fn(async () => {
      throw { status: 409, body: { message: "interno" } };
    });
    renderList(rows([]), { scanRecoveryCases });

    await userEvent.click(
      await screen.findByRole("button", { name: "Escanear inconsistencias" }),
    );

    expect(
      await screen.findByText("Ya hay un escaneo en curso."),
    ).toBeInTheDocument();
  });
});
