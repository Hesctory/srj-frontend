import { describe, expect, it } from "vitest";
import {
  actionLabel,
  causeCommissionHint,
  causeLabel,
  commissionTreatmentLabel,
  originLabel,
  eventTypeLabel,
  findingLabel,
  humanize,
  severityLabel,
  statusLabel,
  stepLabel,
} from "./labels";

describe("recovery labels", () => {
  // Exactly the vocabularies the contract declares.
  const vocabularies: [string, (code: string) => string, string[]][] = [
    [
      "action",
      actionLabel,
      [
        "VOID_PAYMENT",
        "REPLACE_PAYMENT",
        "VOID_DOCUMENT",
        "REPLACE_DOCUMENT",
        "REPAIR_INCONSISTENCY",
      ],
    ],
    [
      "cause",
      causeLabel,
      [
        "TYPING_ERROR",
        "PAYER_CHANGED_AMOUNT",
        "OTHER",
        "INCONSISTENCY_DETECTED",
      ],
    ],
    ["origin", originLabel, ["USER", "SCANNER"]],
    [
      "status",
      statusLabel,
      ["QUEUED", "WAITING_EXTERNAL", "NEEDS_REVIEW", "COMPLETED", "CANCELLED"],
    ],
    [
      "step",
      stepLabel,
      [
        "RECONCILE_DOCUMENT",
        "CREATE_CREDIT_NOTE",
        "FILE_CREDIT_NOTE",
        "FINALIZE_LOCALLY",
        "GENERATE_REPLACEMENT_DOCUMENT",
        "VERIFY",
      ],
    ],
    [
      "finding",
      findingLabel,
      [
        "VOIDED_PAYMENT_HAS_LIVE_ALLOCATIONS",
        "VOIDED_PAYMENT_HAS_LIVE_MOVEMENTS",
        "VOIDED_PAYMENT_HAS_ACTIVE_DOCUMENT",
        "ACTIVE_PAYMENT_HAS_PARTIAL_VOID",
        "STALE_SENT_DOCUMENT",
        "ACCEPTED_CREDIT_NOTE_UNFINISHED",
        "EXPIRED_RECOVERY_LEASE",
        "DOCUMENT_AMOUNT_MISMATCH",
      ],
    ],
    ["severity", severityLabel, ["CRITICAL", "WARNING"]],
    [
      "event type",
      eventTypeLabel,
      [
        "CREATED",
        "DETECTED",
        "RESOLVED",
        "CREDIT_NOTE_CREATED",
        "CREDIT_NOTE_RECOVERED",
        "WAITING_EXTERNAL",
        "NEEDS_REVIEW",
        "RETRY_SCHEDULED",
        "LOCAL_FINALIZED",
        "COMPLETED",
      ],
    ],
    [
      "commission treatment",
      commissionTreatmentLabel,
      ["RECOMPUTE", "PRESERVE", "NONE"],
    ],
  ];

  it.each(vocabularies)(
    "%s: every declared code has its own copy",
    (_, label, codes) => {
      for (const code of codes) expect(label(code)).not.toBe(humanize(code));
    },
  );

  it("translates a few codes to the expected Spanish", () => {
    expect(actionLabel("REPLACE_PAYMENT")).toBe("Reemplazar pago");
    expect(statusLabel("NEEDS_REVIEW")).toBe("Requiere revisión");
    expect(severityLabel("CRITICAL")).toBe("Crítica");
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
