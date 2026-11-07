import { describe, expect, it } from "vitest";
import {
  actionLabel,
  causeCommissionHint,
  eventTypeLabel,
  findingLabel,
  humanize,
  severityLabel,
  statusLabel,
  stepLabel,
} from "./labels";

describe("recovery labels", () => {
  it("translates every known code", () => {
    expect(actionLabel("REPLACE_PAYMENT")).toBe("Reemplazar pago");
    expect(statusLabel("NEEDS_REVIEW")).toBe("Requiere revisión");
    expect(stepLabel("FILE_CREDIT_NOTE")).toBe(
      "Enviar la nota de crédito a SUNAT",
    );
    expect(severityLabel("CRITICAL")).toBe("Crítica");
    expect(findingLabel("STALE_SENT_DOCUMENT")).toBe(
      "Comprobante enviado sin respuesta",
    );
    for (const type of [
      "DETECTED",
      "RESOLVED",
      "CREDIT_NOTE_CREATED",
      "CREDIT_NOTE_RECOVERED",
      "WAITING_EXTERNAL",
      "NEEDS_REVIEW",
      "RETRY_SCHEDULED",
      "LOCAL_FINALIZED",
      "COMPLETED",
    ]) {
      expect(eventTypeLabel(type)).not.toBe(humanize(type));
    }
  });

  it("falls back to a readable sentence for unknown codes", () => {
    expect(stepLabel("SOMETHING_NEW")).toBe("Something new");
    expect(eventTypeLabel("BRAND_NEW_EVENT")).toBe("Brand new event");
  });

  it("shows a dash for a missing code", () => {
    expect(statusLabel(null)).toBe("—");
    expect(actionLabel(undefined)).toBe("—");
  });

  it("explains the commission effect of each cause", () => {
    expect(causeCommissionHint("TYPING_ERROR")).toMatch(/recalcula/);
    expect(causeCommissionHint("PAYER_CHANGED_AMOUNT")).toMatch(/conserva/);
    expect(causeCommissionHint("OTHER")).toMatch(/No cambia/);
  });
});
