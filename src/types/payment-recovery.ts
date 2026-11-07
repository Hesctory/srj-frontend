/**
 * Payment recovery cases — `Contracts/PaymentRecoveryContract.md`.
 *
 * A case is the durable record of one correction (void or replace a payment or
 * a comprobante). The backend runs it by itself and parks it in
 * `NEEDS_REVIEW` when a person must decide. `CANCELLED` is unreachable and is
 * never shown.
 */

import type { PaymentLine } from "./payment";

export type RecoveryOrigin = "USER" | "SCANNER";

export type RecoveryAction =
  | "VOID_PAYMENT"
  | "REPLACE_PAYMENT"
  | "VOID_DOCUMENT"
  | "REPLACE_DOCUMENT"
  | "REPAIR_INCONSISTENCY";

export type RecoveryCause =
  | "TYPING_ERROR"
  | "PAYER_CHANGED_AMOUNT"
  | "OTHER"
  | "INCONSISTENCY_DETECTED";

export type CommissionTreatment = "RECOMPUTE" | "PRESERVE" | "NONE";

export type RecoveryStatus =
  | "QUEUED"
  | "WAITING_EXTERNAL"
  | "NEEDS_REVIEW"
  | "COMPLETED"
  | "CANCELLED";

export type RecoveryStep =
  | "RECONCILE_DOCUMENT"
  | "CREATE_CREDIT_NOTE"
  | "FILE_CREDIT_NOTE"
  | "FINALIZE_LOCALLY"
  | "GENERATE_REPLACEMENT_DOCUMENT"
  | "VERIFY";

/** What the case offers a person to do. Buttons follow this, never `status`. */
export type RecoveryAvailableAction = "RESUME" | "RESOLVE";

export type PlannedStepState = "DONE" | "CURRENT" | "PENDING" | "SKIPPED";

/**
 * One station of the case's own path. Not in the contract yet (the backend
 * will add it); until then it is absent and the screen shows only the current
 * step. The exact shape is the backend's call, so `step` stays a plain string.
 */
export interface PlannedStep {
  step: string;
  state: PlannedStepState;
}

export interface RecoveryFinding {
  id: number;
  code: string | null;
  entityKind: string | null;
  entityId: number;
  /** `CRITICAL` | `WARNING`. */
  severity: string | null;
  detectedAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
}

export interface RecoveryEvent {
  id: number;
  eventType: string | null;
  status: string | null;
  step: string | null;
  /** Can be raw technical text with internal ids: never headline copy. */
  message: string | null;
  actorUserId: number | null;
  createdAt: string;
}

export interface PaymentRecoveryCase {
  id: number;
  requestId: string;
  origin: RecoveryOrigin | null;
  paymentId: number | null;
  documentId: number | null;
  action: RecoveryAction | null;
  cause: RecoveryCause | null;
  commissionTreatment: CommissionTreatment | null;
  justification: string | null;
  creditNoteReasonCode: string | null;
  status: RecoveryStatus | null;
  currentStep: RecoveryStep | null;
  creditNoteDocumentId: number | null;
  replacementPaymentId: number | null;
  attemptCount: number;
  nextAttemptAt: string | null;
  /** Can be raw technical text: show under "Detalle técnico". */
  lastError: string | null;
  version: number;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  availableActions: RecoveryAvailableAction[] | null;
  findings: RecoveryFinding[];
  events: RecoveryEvent[];
  /** Backend addition pending (B1). Optional on purpose. */
  plannedSteps?: PlannedStep[];
}

export interface PaymentRecoveryScanResult {
  scannedAt: string;
  detected: number;
  opened: number;
  autoQueued: number;
  needsReview: number;
}

export interface CreatePaymentRecoveryCaseRequest {
  requestId: string;
  action: RecoveryAction;
  cause: RecoveryCause;
  justification: string;
  creditNoteReasonCode?: string | null;
  replacementPreviewToken?: string | null;
  payerRelationship?: string | null;
  payerName?: string | null;
}

export interface ResolvePaymentRecoveryCaseRequest {
  expectedVersion: number;
  action: RecoveryAction;
  cause: RecoveryCause;
  justification: string;
  creditNoteReasonCode?: string | null;
  replacementPreviewToken?: string | null;
}

/** `POST /enrollment-payments/:paymentId/replacement-preview` body. */
export interface ReplacementPreviewRequest {
  cause: RecoveryCause;
  lines: PaymentLine[];
}

/** `GET /payment-documents/credit-note-reasons` — SUNAT catalogue 09. */
export interface CreditNoteReason {
  code: string | null;
  name: string | null;
}
