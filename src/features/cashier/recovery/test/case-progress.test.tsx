import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PaymentRecoveryCase } from "@/types/payment-recovery";
import CaseProgress from "@/features/cashier/recovery/components/case-progress";
import { makeCase } from "./fixtures";

const NC_PATH: PaymentRecoveryCase["plannedSteps"] = [
  "RECONCILE_DOCUMENT",
  "CREATE_CREDIT_NOTE",
  "FILE_CREDIT_NOTE",
  "FINALIZE_LOCALLY",
  "GENERATE_REPLACEMENT_DOCUMENT",
  "VERIFY",
];

const items = () => screen.getAllByRole("listitem");
const captions = () =>
  items().map((li) => {
    const texts = Array.from(li.querySelectorAll("p, span")).map(
      (n) => n.textContent,
    );
    return texts[texts.length - 1];
  });

describe("CaseProgress", () => {
  it("document never sent: reconcile then verify, nothing done", () => {
    render(
      <CaseProgress
        record={makeCase({
          action: "VOID_DOCUMENT",
          status: "QUEUED",
          currentStep: "RECONCILE_DOCUMENT",
          plannedSteps: ["RECONCILE_DOCUMENT", "FINALIZE_LOCALLY", "VERIFY"],
        })}
      />,
    );
    expect(captions()).toEqual(["En curso", "Pendiente", "Pendiente"]);
    expect(items()[0]).toHaveAttribute("aria-current", "step");
  });

  it("accepted with a credit note: earlier steps done, current marked", () => {
    render(
      <CaseProgress
        record={makeCase({
          status: "QUEUED",
          currentStep: "FINALIZE_LOCALLY",
          plannedSteps: NC_PATH!.filter(
            (s) => s !== "GENERATE_REPLACEMENT_DOCUMENT",
          ),
        })}
      />,
    );
    expect(captions()).toEqual([
      "Hecho",
      "Hecho",
      "Hecho",
      "En curso",
      "Pendiente",
    ]);
  });

  it("REPLACE_DOCUMENT shows the replacement step; others do not invent it", () => {
    const { rerender } = render(
      <CaseProgress
        record={makeCase({
          currentStep: "RECONCILE_DOCUMENT",
          plannedSteps: NC_PATH,
        })}
      />,
    );
    expect(
      screen.getByText("Emitir el comprobante de reemplazo"),
    ).toBeInTheDocument();

    rerender(
      <CaseProgress
        record={makeCase({
          action: "VOID_PAYMENT",
          currentStep: "RECONCILE_DOCUMENT",
          plannedSteps: ["RECONCILE_DOCUMENT", "FINALIZE_LOCALLY", "VERIFY"],
        })}
      />,
    );
    expect(
      screen.queryByText("Emitir el comprobante de reemplazo"),
    ).not.toBeInTheDocument();
    expect(items()).toHaveLength(3);
  });

  it("stale-send scanner case is just reconcile and verify", () => {
    render(
      <CaseProgress
        record={makeCase({
          origin: "SCANNER",
          action: "REPAIR_INCONSISTENCY",
          currentStep: "VERIFY",
          plannedSteps: ["RECONCILE_DOCUMENT", "VERIFY"],
        })}
      />,
    );
    expect(captions()).toEqual(["Hecho", "En curso"]);
  });

  it("waiting on the comprobante vs on the credit note", () => {
    const { rerender } = render(
      <CaseProgress
        record={makeCase({
          status: "WAITING_EXTERNAL",
          currentStep: "RECONCILE_DOCUMENT",
          plannedSteps: NC_PATH,
        })}
      />,
    );
    expect(
      within(items()[0]).getByText("Esperando a SUNAT: el comprobante"),
    ).toBeInTheDocument();

    rerender(
      <CaseProgress
        record={makeCase({
          status: "WAITING_EXTERNAL",
          currentStep: "FILE_CREDIT_NOTE",
          plannedSteps: NC_PATH,
        })}
      />,
    );
    expect(
      within(items()[2]).getByText("Esperando a SUNAT: la nota de crédito"),
    ).toBeInTheDocument();
    expect(captions().slice(0, 2)).toEqual(["Hecho", "Hecho"]);
  });

  it("flags the failing step when the case needs review", () => {
    render(
      <CaseProgress
        record={makeCase({
          status: "NEEDS_REVIEW",
          currentStep: "CREATE_CREDIT_NOTE",
          plannedSteps: NC_PATH,
        })}
      />,
    );
    expect(captions()).toEqual([
      "Hecho",
      "Requiere revisión",
      "Pendiente",
      "Pendiente",
      "Pendiente",
      "Pendiente",
    ]);
    expect(items()[1]).toHaveAttribute("aria-current", "step");
  });

  it("COMPLETED marks every step done and none current", () => {
    render(
      <CaseProgress
        record={makeCase({
          status: "COMPLETED",
          currentStep: "VERIFY",
          plannedSteps: NC_PATH,
        })}
      />,
    );
    expect(new Set(captions())).toEqual(new Set(["Hecho"]));
    expect(screen.queryByText("En curso")).not.toBeInTheDocument();
  });

  it("follows a path that shrinks between renders", () => {
    const { rerender } = render(
      <CaseProgress
        record={makeCase({
          currentStep: "CREATE_CREDIT_NOTE",
          plannedSteps: NC_PATH,
        })}
      />,
    );
    expect(items()).toHaveLength(6);

    rerender(
      <CaseProgress
        record={makeCase({
          currentStep: "FINALIZE_LOCALLY",
          plannedSteps: ["RECONCILE_DOCUMENT", "FINALIZE_LOCALLY", "VERIFY"],
        })}
      />,
    );
    expect(captions()).toEqual(["Hecho", "En curso", "Pendiente"]);
  });

  it("a current step missing from the path leaves everything pending", () => {
    render(
      <CaseProgress
        record={makeCase({
          currentStep: "CREATE_CREDIT_NOTE",
          plannedSteps: ["RECONCILE_DOCUMENT", "VERIFY"],
        })}
      />,
    );
    expect(captions()).toEqual(["Pendiente", "Pendiente"]);
  });

  it("without a path says only where the case is", () => {
    render(<CaseProgress record={makeCase({ plannedSteps: null })} />);
    expect(
      screen.getByText("Paso actual: Conciliar el comprobante"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
