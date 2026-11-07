import type { PaymentRecoveryCase } from "@/types/payment-recovery";

/** Synthetic case: every value here is made up. */
export const makeCase = (
  overrides: Partial<PaymentRecoveryCase> = {},
): PaymentRecoveryCase => ({
  id: 41,
  requestId: "00000000-0000-4000-8000-000000000041",
  origin: "USER",
  paymentId: 900,
  documentId: 901,
  action: "REPLACE_DOCUMENT",
  cause: "TYPING_ERROR",
  commissionTreatment: "RECOMPUTE",
  justification: "Prueba sintética",
  creditNoteReasonCode: null,
  status: "QUEUED",
  currentStep: "RECONCILE_DOCUMENT",
  creditNoteDocumentId: null,
  replacementPaymentId: null,
  attemptCount: 1,
  nextAttemptAt: null,
  lastError: null,
  version: 3,
  createdBy: 1,
  createdAt: "2026-08-19T14:30:00Z",
  updatedAt: "2026-08-19T14:30:00Z",
  completedAt: null,
  availableActions: [],
  findings: [],
  events: [],
  ...overrides,
});
