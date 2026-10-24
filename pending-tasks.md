# Pending Tasks — Payment contracts

Gap analysis of the four contracts in `Contracts/` against the current codebase
(`develop` branch). Each ticket below is work that has **no implementation at
all** today and must be built from zero.

## Already handled (not ticketed)

The pieces that were *technically built but pointed at deprecated endpoints*
have been migrated in place — no ticket needed:

| Call | Was | Now |
| --- | --- | --- |
| `previewPayment()` — `src/features/enrollment-payments/api/payments.ts` | `POST /api/payment-preview` | `POST /api/enrollment-payments/preview` |
| `confirmPayment()` — `src/features/enrollment-payments/api/payments.ts` | `POST /api/payments` | `POST /api/enrollment-payments` |

Request/response shapes are identical between the deprecated and successor
endpoints, so the flow (`usePaymentFlow`, `usePaymentDraft`, `PaymentDrawer`,
`PaymentPlanReview`, `PaymentReceipt`) is unchanged. Doc comments in
`src/types/payment.ts` updated to match. `npm run type-check` passes.

---

## Ticket index

| ID | Title | Contract | Priority | Depends on |
| --- | --- | --- | --- | --- |
| TASK-001 | Payments list & detail view | Payments | P1 | — |
| TASK-002 | Payment-document retirement model & display | Payment Documents | P1 | — |
| TASK-003 | Credit-note reasons reference endpoint | Payment Documents | P2 | — |
| TASK-004 | Replacement payment preview | Enrollment Payments | P2 | — |
| TASK-005 | Payment Recovery Cases subsystem | Payment Recovery | P2 | TASK-003, TASK-004 (TASK-001 / TASK-002 for entry points & result display) |
| TASK-006 | Test tooling — the app has none | — | P3 | — |

Repo conventions every ticket follows (see `CLAUDE.md`):

- Feature-first: new module under `src/features/<module>/`, own `resources/`,
  `routes/`, `components/`, `hooks/`, `api/`, and an `index.tsx` barrel that
  exports `<module>CustomRoutes` + any `Resource`.
- `src/features/index.tsx` composes routes into `AppCustomRoutes` and re-exports
  resources; `src/app/App.tsx` registers them.
- Non-CRUD / RPC calls live in a feature `api/*.ts` module using `httpClient`
  from `@/app/data-provider` — pattern already in
  `src/features/enrollment-payments/api/payments.ts` and
  `src/features/payment-documents/api/payment-documents.ts`, including the
  `toXError(cause) → { status, message, fieldErrors, ... }` flattener (`422`
  carries `{ errors: { field: msg } }`, every other status `{ message }`).
- Shared types go in flat `src/types/`; money/date helpers in
  `@/shared/utils/money` (`formatMoney`, `formatIsoDate`, `formatIsoDateTime`,
  `daysSince`, `formatAge`).
- Navigation in `src/modules.tsx`; sidebar count badges via the `ModuleBadge`
  union + `MyMenu` (see `pending-payment-documents`).
- UI text Spanish, code English. RA `List`/`Show`/`DataTable`, no guessers.
- All backend `message` strings are Spanish and safe to render verbatim.

---

## TASK-001 — Payments list & detail view

**Contract:** `Contracts/PaymentsContract.md` — endpoints 1 and 4
**Priority:** P1 · **Depends on:** none

### Context

`GET /api/payments` (list) and `GET /api/payments/:id` (get one) are specified
but have no frontend. There is currently **no way in the app to browse settled
payments**, inspect a payment's tenders/allocations, or see which payments were
voided and why. The only payment list that exists is the narrow
`GET /api/payments/pending-documents` backlog.

`fetchPayment(id)` already exists in
`src/features/enrollment-payments/api/payments.ts` but is dead code (never
imported). It hits the correct, non-deprecated `GET /api/payments/:id`, so it
can become the detail view's loader or be replaced by an RA resource `getOne`.

### Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/payments` | `range` + `filter` query params, `PaymentFilter`. Body `Payment[]` + `Content-Range`. |
| `GET` | `/api/payments/:id` | Body `Payment`. `404` when missing. |

`PaymentFilter` (all optional): `id: integer[]`, `dateFrom: "YYYY-MM-DD"`,
`dateTo: "YYYY-MM-DD"`, `isVoided: boolean`, `createdBy: integer`,
`obligationId: integer`.

### Data model

`Payment` (`src/types/payment.ts` already has most of this — **add the missing
fields**):

- present: `id`, `date`, `amount`, `totalAllocated`, `totalToAccounts`,
  `isVoided`, `createdAt`, `createdBy`, `tenders[]`, `allocations[]`
- **missing, add:** `voidedAt: string | null` (ISO), `voidedBy: number | null`,
  `voidReason: string | null`
- `tenders[]`: `id`, `paymentMethodId`, `paymentMethodName`, `cashAccountId`,
  `cashAccountName`, `amount`, `reference`, `isVoided` — already modelled
- `allocations[]`: `id`, `obligationId`, `description`, `amountApplied`,
  `originTypeCode`, `isVoided` — already modelled

### Frontend work

1. `src/types/payment.ts` — add `voidedAt` / `voidedBy` / `voidReason` to
   `Payment`; add a `PaymentFilter` interface mirroring the table above.
2. New feature slice `src/features/payments/` (or fold into
   `enrollment-payments` — decide during grooming; a standalone `payments`
   module reads cleaner because a payment is not always an enrollment payment):
   - `resources/payments/` — RA `Resource` (`list` + `show`, no create/edit;
     payments are produced by workflows, never hand-entered). Plain
     simple-rest — no dataProvider override needed, the record already has a
     top-level `id`.
   - `resources/payments/payments-list.tsx` — `DataTable` columns: date,
     amount (PEN), `totalToAccounts`, tender method summary, allocation count,
     voided badge. `rowClick="show"`.
   - `resources/payments/payments-filters.tsx` — `DateInput` from/to
     (`alwaysOn`), `BooleanInput` `isVoided`, `ReferenceInput`→user for
     `createdBy`, `NumberInput` `obligationId`. `id[]` skipped (internal links
     only, same rationale as `payment-documents/filters.tsx`).
   - `resources/payments/payment-show.tsx` — header (id, date, totals, void
     state + `voidReason` / `voidedAt` / `voidedBy` when voided), tenders table,
     allocations table. Mirror the visual language of
     `payment-documents/resources/payment-documents/payment-document-show.tsx`.
3. `index.tsx` barrel + register in `src/features/index.tsx` and
   `src/app/App.tsx`.
4. `src/modules.tsx` — add a nav item. Candidate home: under **Ingresos y
   Egresos** (id 6) or alongside **Comprobantes de Pago** under **Facturación
   Electrónica** (id 5).
5. Delete the now-redundant `fetchPayment` from
   `enrollment-payments/api/payments.ts`, or move it to the new slice if the
   detail view is custom rather than an RA `show`.

### Acceptance criteria

- Payments list paginates, sorts by date desc by default, honours every
  `PaymentFilter` field, shows the `Content-Range` total.
- A voided payment is visually distinct and its `voidReason` / `voidedAt` /
  `voidedBy` are shown on the detail page.
- Detail page renders all tenders and allocations, flags per-line `isVoided`.
- Deep-linking `/payments/:id/show` works; unknown id shows RA's 404.

### Notes

- This list is the natural host for the "iniciar recuperación de pago" action
  from TASK-005 (`POST /api/payments/:paymentId/recovery-cases`). Build the
  detail page with a right-hand action slot in mind.

---

## TASK-002 — Payment-document retirement model & display

**Contract:** `Contracts/PaymentDocumentContract.md` — `PaymentDocument` /
`PaymentDocumentDetail` read model
**Priority:** P1 · **Depends on:** none

### Context

The contract's `PaymentDocument` grew a whole **retirement block** plus
`payerNote`, and loosened several fields to nullable. `src/types/payment-document.ts`
and both the list and show pages still only understand `isVoided` → the word
"Anulado". Nothing shows *why*, *when*, *by whom*, or *through which mechanism*
a comprobante was retired, and there is no link from a retired document to the
credit note that neutralised it.

`payerNote` is written by the app today (`GeneratePaymentDocumentRequest` in
`issue-document-dialog.tsx`) but never read back.

### Data model — add to `PaymentDocument` in `src/types/payment-document.ts`

| Field | Type | Meaning |
| --- | --- | --- |
| `payerNote` | `string \| null` | Free-text "who physically paid" note recorded at generation. |
| `retiredAt` | `string \| null` (ISO) | When the comprobante was retired. |
| `retiredBy` | `number \| null` | User id who retired it. |
| `retirementKind` | `"LOCAL_DISCARD" \| "FULL_CREDIT_NOTE" \| "LEGACY_VOID" \| null` | How it was retired. |
| `retirementReason` | `string \| null` | Human reason. |
| `correctionDocumentId` | `number \| null` | The accepted full credit note that neutralised it — set only when `retirementKind === "FULL_CREDIT_NOTE"`. |

Also loosen to nullable (contract now marks them `string | null`): `series`,
`correlative`, `number`, `voucherTypeCode`, `voucherTypeName`,
`sunatVoucherCode`, `paymentForm`, `sunatStatusCode`, `sunatStatusName`.
Audit every `.sunatStatusCode` / `.number` dereference in
`payment-documents/` for the new `null` case (`SUNAT_STATUS_COLOR[code]`
already has a `?? "default"` guard; `isDeclarable` / `isInternalReceipt` need a
null check).

### Frontend work

1. `src/types/payment-document.ts` — add the fields above; add a
   `RETIREMENT_KIND_LABEL` map (Spanish) and a helper
   `isRetired(doc) => doc.isVoided || doc.retiredAt != null`.
2. `payment-documents/resources/payment-documents/payment-document-show.tsx`:
   - When retired, replace the bare "Anulado" pill with a card: kind label,
     `retirementReason`, `formatIsoDateTime(retiredAt)`, retired-by.
   - When `correctionDocumentId != null`, render a link/button
     "Ver nota de crédito" → `/payment-documents/:correctionDocumentId/show`.
   - Add a "Quién pagó" row showing `payerNote` when present (in the
     "Datos del comprobante" card).
3. `payment-documents/resources/payment-documents/payment-documents-list.tsx`
   — the `DocumentNumberField` sub-caption currently only says "Anulado";
   extend to show the retirement kind label when set.
4. `payment-documents/components/sunat-status-chip.tsx` — already special-cases
   `isVoided`; extend to cover `retiredAt` set without `isVoided` if the
   backend can produce that combination (confirm during grooming).

### Acceptance criteria

- A retired comprobante's detail page shows kind, reason, timestamp and actor.
- `FULL_CREDIT_NOTE` retirements link to the correcting document.
- `payerNote` is visible on the detail page when the backend returns one.
- No runtime error when `number` / `sunatStatusCode` / etc. come back `null`.

### Notes

- These fields are *written* by TASK-005's recovery outcomes; this ticket is
  just the read/display side and can ship independently ahead of TASK-005.

---

## TASK-003 — Credit-note reasons reference endpoint

**Contract:** `Contracts/PaymentDocumentContract.md` — endpoint 3
**Priority:** P2 · **Depends on:** none

### Context

`GET /api/payment-documents/credit-note-reasons` returns the SUNAT credit-note
reason catalogue. It has no type, no fetch, and no consumer. It is required by
TASK-005: `CreatePaymentRecoveryCaseRequest.creditNoteReasonCode` and
`ResolvePaymentRecoveryCaseRequest.creditNoteReasonCode` must be picked from
this list whenever a recovery action files a credit note against a
SUNAT-declared document.

### Endpoint

| Method | Path | Response |
| --- | --- | --- |
| `GET` | `/api/payment-documents/credit-note-reasons` | `CreditNoteReason[]` + `Content-Range`. `401` / `403` only. |

`CreditNoteReason`: `{ code: string \| null, name: string \| null }`.

### Frontend work

1. `src/types/payment-document.ts` — add `CreditNoteReason`.
2. `src/features/payment-documents/api/payment-documents.ts` — add
   `fetchCreditNoteReasons(): Promise<CreditNoteReason[]>` using `httpClient`
   (this path is a sub-resource, not RA-modellable — same reason the file's
   other three calls sit outside the dataProvider).
3. `src/features/payment-documents/hooks/` — add
   `useCreditNoteReasons()` wrapping it in `useQuery` (react-query is already
   the pattern in `use-pending-payments.ts`), `staleTime` generous — this is a
   catalogue.
4. Expose a small `<CreditNoteReasonSelect>` component in
   `payment-documents/components/` for TASK-005's forms to reuse.

### Acceptance criteria

- `useCreditNoteReasons()` returns `{ data, isLoading, error }`, one request
  shared across consumers, cached.
- Empty / failed load degrades gracefully (the select is disabled with a
  helper text, not a crash).

---

## TASK-004 — Replacement payment preview

**Contract:** `Contracts/EnrollmentPaymentsContract.md` — endpoint 5
**Priority:** P2 · **Depends on:** none (consumed by TASK-005)

### Context

`POST /api/enrollment-payments/:paymentId/replacement-preview` computes the
settlement plan for a payment that will *replace* an existing (wrong) payment.
It returns the same `PaymentPreviewResponse` (token + plan) as the normal
preview, so its `previewToken` can be handed to TASK-005 as
`replacementPreviewToken` on a `REPLACE_PAYMENT` recovery case. Nothing for
this exists today.

### Endpoint

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/api/enrollment-payments/:paymentId/replacement-preview` | `ReplacementPaymentPreviewRequest` | `200` `PaymentPreviewResponse` |

`ReplacementPaymentPreviewRequest`:

```jsonc
{
  "cause": "…",          // string | null
  "lines": [
    { "paymentMethodId": 1, "amount": 352.8, "reference": "…" }
  ]
}
```

`lines[]` is the same `PaymentLine` shape used everywhere else. Errors:
`400 / 401 / 403 / 404 / 409 / 422`.

### Frontend work

1. `src/types/payment.ts` — add `ReplacementPaymentPreviewRequest`
   (`cause?: string | null`, `lines: PaymentLine[]`).
2. `src/features/enrollment-payments/api/payments.ts` — add
   `previewReplacementPayment(paymentId, request): Promise<PaymentPreviewResponse>`.
   Reuse the existing `toPaymentError` flattener.
3. Reuse `usePaymentDraft` (tender-lines editing already solved) and the
   `PaymentPlanSummary` / countdown components for the replacement plan review.
   A dedicated `useReplacementPaymentFlow` hook (thin variant of
   `usePaymentFlow`, minus the confirm step — confirmation happens through the
   recovery case, not `POST /api/enrollment-payments`).
4. No standalone route — this is only ever reached from the TASK-005
   `REPLACE_PAYMENT` wizard. Ship it as the plumbing that wizard imports.

### Acceptance criteria

- `previewReplacementPayment` returns a `previewToken` + `plan`; the plan is
  rendered with `PaymentPlanSummary` and the 5-minute countdown.
- `409` / `404` surface the backend Spanish message and force a recompute.
- The resulting `previewToken` is exposed to the caller for use as
  `replacementPreviewToken`.

---

## TASK-005 — Payment Recovery Cases subsystem

**Contract:** `Contracts/PaymentRecoveryContract.md` — all 7 endpoints
**Priority:** P2 · **Depends on:** TASK-003, TASK-004; TASK-001 & TASK-002 for
entry points and outcome display
**Size:** large — groom into the sub-tasks listed under "Frontend work".

### Context

Durable, async **recovery cases** for correcting money that was collected or
invoiced wrong: void a payment, replace a payment, void a comprobante, replace
a comprobante, or repair a detected inconsistency. A case is a long-running
state machine driven by a backend worker; the frontend creates cases, watches
them progress, resolves the ones that stall in `NEEDS_REVIEW`, and can trigger
a `scan` that opens cases automatically.

**None of this exists** — no feature folder, types, api module, resource,
routes, or nav entry. It is also the subsystem that finally gives the app an
"anular / reemplazar" action; there is no void/replace button anywhere today.

### State machine (for whoever builds the detail view)

- `status`: `QUEUED` → `WAITING_EXTERNAL` ⇄ `NEEDS_REVIEW` → `COMPLETED` /
  `CANCELLED`.
- `currentStep`: `RECONCILE_DOCUMENT` | `CREATE_CREDIT_NOTE` |
  `FILE_CREDIT_NOTE` | `FINALIZE_LOCALLY` | `GENERATE_REPLACEMENT_DOCUMENT` |
  `VERIFY`.
- Worker retry telemetry: `attemptCount`, `nextAttemptAt`, `lastError`.
- `availableActions: string[]` is the **authoritative** list of what the UI may
  offer for the case *right now* — render action buttons from it, never from a
  hand-maintained status→action table (`CLAUDE.md`: no hand-maintained
  dispatch tables; centralise, don't hardcode).
- `version` + `ResolvePaymentRecoveryCaseRequest.expectedVersion` — optimistic
  concurrency; a stale `expectedVersion` returns `409`.
- `requestId` — client-generated UUID (`crypto.randomUUID()`) for idempotent
  create; keep it stable across retries of the same user intent.
- `origin`: `USER` (created from a payment/document page) vs `SCANNER` (opened
  by `POST /scan`).
- `findings[]` — detected inconsistencies attached to the case (codes:
  `VOIDED_PAYMENT_HAS_LIVE_ALLOCATIONS`, `VOIDED_PAYMENT_HAS_LIVE_MOVEMENTS`,
  `VOIDED_PAYMENT_HAS_ACTIVE_DOCUMENT`, `ACTIVE_PAYMENT_HAS_PARTIAL_VOID`,
  `STALE_SENT_DOCUMENT`, `ACCEPTED_CREDIT_NOTE_UNFINISHED`,
  `EXPIRED_RECOVERY_LEASE`, `DOCUMENT_AMOUNT_MISMATCH`).
- `events[]` — append-only audit timeline (`eventType`, `status`, `step`,
  `message`, `actorUserId`, `createdAt`).

### Endpoints

| # | Method | Path | Body | Response |
| --- | --- | --- | --- | --- |
| 1 | `GET` | `/api/payment-recovery-cases` | `range` + `filter` (`PaymentRecoveryCaseFilter`) | `200` `PaymentRecoveryCase[]` + `Content-Range` |
| 2 | `POST` | `/api/payment-recovery-cases/scan` | — | `200` `PaymentRecoveryScanResult` |
| 3 | `GET` | `/api/payment-recovery-cases/:id` | — | `200` `PaymentRecoveryCase` |
| 4 | `POST` | `/api/payment-documents/:documentId/recovery-cases` | `CreatePaymentRecoveryCaseRequest` | `202` `PaymentRecoveryCase` + `Location` |
| 5 | `PUT` | `/api/payment-recovery-cases/:id/resolution` | `ResolvePaymentRecoveryCaseRequest` | `200` `PaymentRecoveryCase` |
| 6 | `POST` | `/api/payment-recovery-cases/:id/resume` | — | `202` `PaymentRecoveryCase` + `Location` |
| 7 | `POST` | `/api/payments/:paymentId/recovery-cases` | `CreatePaymentRecoveryCaseRequest` | `202` `PaymentRecoveryCase` + `Location` |

`PaymentRecoveryCaseFilter` (all optional): `id: integer[]`,
`status: string[]`, `action: string[]`, `origin: string[]`,
`paymentId: integer`, `documentId: integer`, `needsReview: boolean`.

Only #1 and #3 map to RA verbs. #5 is `PUT .../resolution` (not
`PUT /:id`), so it is a custom call, **not** `dataProvider.update`. #2/#4/#6/#7
are RPCs. All non-CRUD calls belong in `api/payment-recovery.ts` via
`httpClient`.

### Data model — `src/types/payment-recovery.ts` (new)

`PaymentRecoveryCase`: `id`, `requestId`, `origin`, `paymentId`, `documentId`,
`action` (`VOID_PAYMENT | REPLACE_PAYMENT | VOID_DOCUMENT | REPLACE_DOCUMENT | REPAIR_INCONSISTENCY`),
`cause` (`TYPING_ERROR | PAYER_CHANGED_AMOUNT | OTHER | INCONSISTENCY_DETECTED`),
`commissionTreatment` (`RECOMPUTE | PRESERVE | NONE` — server-derived, read-only),
`justification`, `creditNoteReasonCode`, `status`, `currentStep`,
`creditNoteDocumentId`, `replacementPaymentId`, `attemptCount`,
`nextAttemptAt`, `lastError`, `version`, `createdBy`, `createdAt`, `updatedAt`,
`completedAt`, `availableActions: string[]`, `findings: Finding[]`,
`events: RecoveryEvent[]`.

`PaymentRecoveryScanResult`: `scannedAt`, `detected`, `opened`, `autoQueued`,
`needsReview`.

`CreatePaymentRecoveryCaseRequest`: `requestId`, `action`, `cause`,
`justification`, `creditNoteReasonCode`, `replacementPreviewToken`,
`payerRelationship`, `payerName`.

`ResolvePaymentRecoveryCaseRequest`: `expectedVersion`, `action`, `cause`,
`justification`, `creditNoteReasonCode`, `replacementPreviewToken`.

Which fields matter per `action` (for the create/resolve forms):

| action | needs |
| --- | --- |
| `VOID_PAYMENT` / `VOID_DOCUMENT` | `cause`, `justification`; `creditNoteReasonCode` when the target document was declared to SUNAT |
| `REPLACE_PAYMENT` | `replacementPreviewToken` (TASK-004), `payerRelationship` / `payerName` for the new document |
| `REPLACE_DOCUMENT` | `creditNoteReasonCode`, `payerRelationship` / `payerName` |
| `REPAIR_INCONSISTENCY` | `justification` |

Reuse `PAYER_RELATIONSHIPS` / `PAYER_RELATIONSHIP_LABEL` from
`src/types/payment-document.ts` for the payer-note fields (same semantics as
generating a comprobante: `payerName` only travels with `OTRO`).

### Frontend work (groom into sub-tasks)

**5a — Types + API + data layer**
- `src/types/payment-recovery.ts` — all interfaces + Spanish label maps for
  `action`, `cause`, `status`, `currentStep`, `finding.code`.
- `src/features/payment-recovery/api/payment-recovery.ts` — `httpClient`
  wrappers for scan (2), createFromDocument (4), resolve (5), resume (6),
  createFromPayment (7); `toRecoveryError(cause)` flattener (mirror
  `toPaymentDocumentError`).
- `payment-recovery-cases` as a plain RA `Resource` (`list` + `show`) — bare
  record has a top-level `id`, no dataProvider override required. Register in
  `App.tsx` + `src/features/index.tsx`.

**5b — List + worklist + navigation**
- `resources/.../recovery-cases-list.tsx` — `DataTable`: case id, action label,
  status chip, `currentStep`, origin, linked payment/document, `updatedAt`,
  `attemptCount` / `lastError` when retrying. `rowClick="show"`.
- Filters: `status[]`, `action[]`, `origin[]`, `needsReview` toggle,
  `paymentId`, `documentId`.
- A tab or default-filter "Requieren revisión" (`needsReview=true`) as the
  worklist, matching the `payment-documents` "Observados" pattern.
- `src/modules.tsx` — nav item under **Facturación Electrónica** (id 5); add a
  `ModuleBadge` `"recovery-cases-need-review"` counting `needsReview=true`
  (count via `range=[0,0]` + `Content-Range`, same trick as
  `fetchPendingPaymentsCount`), wired in `MyMenu`.

**5c — Case detail view**
- `resources/.../recovery-case-show.tsx` — header (action, status, step,
  cause), the linked payment/document with a link out, `justification`,
  `creditNoteReasonCode` name, `creditNoteDocumentId` / `replacementPaymentId`
  links once populated.
- `findings` panel — grouped by severity, each with its code label and
  resolved/unresolved state.
- `events` timeline — chronological, actor + message + step.
- Poll the detail (`useGetOne` refetch interval, or react-query
  `refetchInterval`) while `status ∈ {QUEUED, WAITING_EXTERNAL}`; stop on
  `COMPLETED` / `CANCELLED` / `NEEDS_REVIEW`.
- Action buttons rendered from `availableActions[]`. "Reanudar" → endpoint 6.
  "Resolver" → opens the 5e form.

**5d — "Start recovery" wizard (create)**
- Entry points:
  - `payment-documents/.../payment-document-show.tsx` — "Anular / reemplazar
    comprobante" → `POST /api/payment-documents/:documentId/recovery-cases`.
  - Payment detail from TASK-001 — "Anular / reemplazar pago" →
    `POST /api/payments/:paymentId/recovery-cases`.
- Dialog/stepper: pick `action` → fill the action-specific fields (table
  above) → for `REPLACE_*`, embed the TASK-004 replacement-preview step and
  capture its `previewToken` → confirm.
- Generate `requestId` once when the dialog opens; reuse on retry.
- On `202`, navigate to the new case's detail (`Location` header / response
  `id`).

**5e — Resolve a NEEDS_REVIEW case**
- Form bound to `ResolvePaymentRecoveryCaseRequest`; send `expectedVersion`
  from the loaded case.
- On `409` (version moved), refetch the case, show "el caso cambió, revisa de
  nuevo", re-seed the form.

**5f — Scan**
- "Escanear inconsistencias" button (case list toolbar) → `POST /scan` →
  toast the `PaymentRecoveryScanResult` counts (`detected` / `opened` /
  `autoQueued` / `needsReview`) → invalidate the list + the nav badge query.

### Acceptance criteria

- A user can open a recovery case from both a payment and a comprobante, for
  every applicable `action`, and lands on the case detail afterwards.
- The case detail reflects worker progress without a manual refresh and stops
  polling at a terminal/blocked state.
- Action buttons shown are exactly `availableActions`; none are hardcoded.
- `NEEDS_REVIEW` cases can be resolved, with `expectedVersion` conflict
  handled.
- `Reanudar` and `Escanear` work and refresh the list + badge.
- Once a case reaches `COMPLETED`, the linked comprobante's retirement fields
  (TASK-002) and/or the replacement payment/credit note are reachable from the
  case.

### Open questions for grooming

- Permissions: which roles may create / resolve / scan? Must come from the
  central permissions source, not component checks (`CLAUDE.md`).
- Is there a SUNAT/e-billing hub page these cases should also surface on
  (the `SunatSummary` placeholder at `/e-billing/sunat-summary`)?
- Does the backend emit `retiredAt`-set-without-`isVoided` for
  `LOCAL_DISCARD`? Affects TASK-002 chip logic.
- Polling interval + max backoff for the detail view.

---

## TASK-006 — There is no test tooling at all

**Contract:** none — this is repo infrastructure, not a feature
**Priority:** P3 · **Depends on:** —
**Size:** small to stand up; ongoing to use.

### Context

Raised from the backend's QA review (`QAFailures.md`, QA-14) rather than from a
contract gap, because the two repositories are one product and the backend's
`check-contracts.sh` already reaches across the boundary to read `src/`.

```bash
grep -nE '"(vitest|jest|@testing-library|cypress|playwright)' package.json
# no results
```

No test runner, no assertion library, no component or E2E tool, and therefore
zero tests. `npm run type-check` is currently the only automated check this repo
has.

### Why it matters

The backend contract gate proves the frontend **calls** the routes the backend
**declares**. It cannot prove the frontend does anything correct with the
responses — and the response handling is where this app's money bugs would live:

- `Content-Range` parsing drives every list's pagination. The backend now has
  tests pinning the header it sends (`ListContractTests`); nothing pins that
  this app reads it correctly.
- The 422 `{ errors: { field: message } }` shape is how every form shows a field
  error. A change in how it is unpacked silently produces forms that reject
  input while displaying nothing.
- TASK-005's recovery-case UI must render its action buttons from
  `availableActions` and handle a `409` on a stale `expectedVersion`. Both are
  exactly the kind of branch that is written once, never exercised by hand in
  the failing case, and wrong.

### Suggested work

Vitest + React Testing Library is the low-friction fit for the existing Vite
setup — Vitest reuses `vite.config.ts`, so there is no second build to keep in
sync.

1. Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom` and
   `jsdom`; add a `test` script and wire `test` into whatever CI this repo gains.
2. Start with the seams that break everything at once rather than with
   components: the data provider's `Content-Range` parsing and its 422 → field
   error mapping.
3. Then the money flows as they are built — `usePaymentFlow` /
   `usePaymentDraft` (TASK-004) and the recovery-case action/conflict handling
   (TASK-005).

Do **not** aim for a global coverage percentage. The backend deliberately gates
coverage only on its money paths for the same reason: a blanket threshold on a
UI codebase demands tests for presentational components and gets itself disabled.

### Acceptance

- `npm test` runs and is green.
- The data provider's `Content-Range` and 422 handling each have a test.
- A CI job runs `npm run type-check`, lint and `npm test` on push.
