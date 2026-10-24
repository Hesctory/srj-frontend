# Payment Recovery API Contract

Durable recovery cases for correcting payments and payment documents.

---

## `PaymentRecoveryCase`

```jsonc
{
  "id": 1,
  "requestId": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  "origin": "USER",                         // "USER" | "SCANNER" — string | null
  "paymentId": 1,                           // number | null
  "documentId": 1,                          // number | null
  "action": "VOID_PAYMENT",                 // "VOID_PAYMENT" | "REPLACE_PAYMENT" | "VOID_DOCUMENT" | "REPLACE_DOCUMENT" | "REPAIR_INCONSISTENCY" — string | null
  "cause": "TYPING_ERROR",                  // "TYPING_ERROR" | "PAYER_CHANGED_AMOUNT" | "OTHER" | "INCONSISTENCY_DETECTED" — string | null
  "commissionTreatment": "RECOMPUTE",       // "RECOMPUTE" | "PRESERVE" | "NONE" — string | null
  "justification": "…",                     // string | null
  "creditNoteReasonCode": "…",              // string | null
  "status": "QUEUED",                       // "QUEUED" | "WAITING_EXTERNAL" | "NEEDS_REVIEW" | "COMPLETED" | "CANCELLED" — string | null
  "currentStep": "RECONCILE_DOCUMENT",      // "RECONCILE_DOCUMENT" | "CREATE_CREDIT_NOTE" | "FILE_CREDIT_NOTE" | "FINALIZE_LOCALLY" | "GENERATE_REPLACEMENT_DOCUMENT" | "VERIFY" — string | null
  "creditNoteDocumentId": 1,                // number | null
  "replacementPaymentId": 1,                // number | null
  "attemptCount": 1,
  "nextAttemptAt": "2026-08-19T14:30:00Z",  // ISO 8601
  "lastError": "…",                         // string | null
  "version": 1,
  "createdBy": 1,                           // number | null
  "createdAt": "2026-08-19T14:30:00Z",      // ISO 8601
  "updatedAt": "2026-08-19T14:30:00Z",      // ISO 8601
  "completedAt": "2026-08-19T14:30:00Z",    // string | null — ISO 8601
  "availableActions": ["…"],                // array | null
  "findings": [
    {
      "id": 1,
      "code": "VOIDED_PAYMENT_HAS_LIVE_ALLOCATIONS",  // "VOIDED_PAYMENT_HAS_LIVE_ALLOCATIONS" | "VOIDED_PAYMENT_HAS_LIVE_MOVEMENTS" | "VOIDED_PAYMENT_HAS_ACTIVE_DOCUMENT" | "ACTIVE_PAYMENT_HAS_PARTIAL_VOID" | "STALE_SENT_DOCUMENT" | "ACCEPTED_CREDIT_NOTE_UNFINISHED" | "EXPIRED_RECOVERY_LEASE" | "DOCUMENT_AMOUNT_MISMATCH" — string | null
      "entityKind": "…",                              // string | null
      "entityId": 1,
      "severity": "…",                                // string | null
      "detectedAt": "2026-08-19T14:30:00Z",           // ISO 8601
      "lastSeenAt": "2026-08-19T14:30:00Z",           // ISO 8601
      "resolvedAt": "2026-08-19T14:30:00Z"            // string | null — ISO 8601
    }
  ],
  "events": [
    {
      "id": 1,
      "eventType": "…",                     // string | null
      "status": "…",                        // string | null
      "step": "…",                          // string | null
      "message": "…",                       // string | null
      "actorUserId": 1,                     // number | null
      "createdAt": "2026-08-19T14:30:00Z"   // ISO 8601
    }
  ]
}
```

## `PaymentRecoveryScanResult`

```jsonc
{
  "scannedAt": "2026-08-19T14:30:00Z",  // ISO 8601
  "detected": 1,
  "opened": 1,
  "autoQueued": 1,
  "needsReview": 1
}
```

## `CreatePaymentRecoveryCaseRequest`

```jsonc
{
  "requestId": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  "action": "VOID_PAYMENT",        // "VOID_PAYMENT" | "REPLACE_PAYMENT" | "VOID_DOCUMENT" | "REPLACE_DOCUMENT" | "REPAIR_INCONSISTENCY" — string | null
  "cause": "TYPING_ERROR",         // "TYPING_ERROR" | "PAYER_CHANGED_AMOUNT" | "OTHER" | "INCONSISTENCY_DETECTED" — string | null
  "justification": "…",            // string | null
  "creditNoteReasonCode": "…",     // string | null
  "replacementPreviewToken": "…",  // string | null
  "payerRelationship": "…",        // string | null
  "payerName": "…"                 // string | null
}
```

## `ResolvePaymentRecoveryCaseRequest`

```jsonc
{
  "expectedVersion": 1,
  "action": "VOID_PAYMENT",        // "VOID_PAYMENT" | "REPLACE_PAYMENT" | "VOID_DOCUMENT" | "REPLACE_DOCUMENT" | "REPAIR_INCONSISTENCY" — string | null
  "cause": "TYPING_ERROR",         // "TYPING_ERROR" | "PAYER_CHANGED_AMOUNT" | "OTHER" | "INCONSISTENCY_DETECTED" — string | null
  "justification": "…",            // string | null
  "creditNoteReasonCode": "…",     // string | null
  "replacementPreviewToken": "…"   // string | null
}
```

---

## Endpoints

### 1. `GET /api/payment-recovery-cases` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`PaymentRecoveryCaseFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `id` | `integer[]` |  |
| `status` | `string[]` | "QUEUED" \| "WAITING_EXTERNAL" \| "NEEDS_REVIEW" \| "COMPLETED" \| "CANCELLED" |
| `action` | `string[]` | "VOID_PAYMENT" \| "REPLACE_PAYMENT" \| "VOID_DOCUMENT" \| "REPLACE_DOCUMENT" \| "REPAIR_INCONSISTENCY" |
| `origin` | `string[]` | "USER" \| "SCANNER" |
| `paymentId` | `integer` |  |
| `documentId` | `integer` |  |
| `needsReview` | `boolean` |  |

**Response** `200` — body is `PaymentRecoveryCase[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 2. `POST /api/payment-recovery-cases/scan` — Scan

**Response** `200` — body is `PaymentRecoveryScanResult`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |

---

### 3. `GET /api/payment-recovery-cases/:id` — Get one

**Response** `200` — body is `PaymentRecoveryCase`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 4. `POST /api/payment-documents/:documentId/recovery-cases` — Recovery Cases

**Request body**

```jsonc
{
  "requestId": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  "action": "VOID_PAYMENT",        // "VOID_PAYMENT" | "REPLACE_PAYMENT" | "VOID_DOCUMENT" | "REPLACE_DOCUMENT" | "REPAIR_INCONSISTENCY" — string | null
  "cause": "TYPING_ERROR",         // "TYPING_ERROR" | "PAYER_CHANGED_AMOUNT" | "OTHER" | "INCONSISTENCY_DETECTED" — string | null
  "justification": "…",            // string | null
  "creditNoteReasonCode": "…",     // string | null
  "replacementPreviewToken": "…",  // string | null
  "payerRelationship": "…",        // string | null
  "payerName": "…"                 // string | null
}
```

**Response** `202` — body is `PaymentRecoveryCase`, plus a `Location` header pointing at the created resource

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 5. `PUT /api/payment-recovery-cases/:id/resolution` — Update

**Request body**

```jsonc
{
  "expectedVersion": 1,
  "action": "VOID_PAYMENT",        // "VOID_PAYMENT" | "REPLACE_PAYMENT" | "VOID_DOCUMENT" | "REPLACE_DOCUMENT" | "REPAIR_INCONSISTENCY" — string | null
  "cause": "TYPING_ERROR",         // "TYPING_ERROR" | "PAYER_CHANGED_AMOUNT" | "OTHER" | "INCONSISTENCY_DETECTED" — string | null
  "justification": "…",            // string | null
  "creditNoteReasonCode": "…",     // string | null
  "replacementPreviewToken": "…"   // string | null
}
```

**Response** `200` — body is `PaymentRecoveryCase`

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 6. `POST /api/payment-recovery-cases/:id/resume` — Resume

**Response** `202` — body is `PaymentRecoveryCase`, plus a `Location` header pointing at the created resource

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 7. `POST /api/payments/:paymentId/recovery-cases` — Recovery Cases

**Request body**

```jsonc
{
  "requestId": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  "action": "VOID_PAYMENT",        // "VOID_PAYMENT" | "REPLACE_PAYMENT" | "VOID_DOCUMENT" | "REPLACE_DOCUMENT" | "REPAIR_INCONSISTENCY" — string | null
  "cause": "TYPING_ERROR",         // "TYPING_ERROR" | "PAYER_CHANGED_AMOUNT" | "OTHER" | "INCONSISTENCY_DETECTED" — string | null
  "justification": "…",            // string | null
  "creditNoteReasonCode": "…",     // string | null
  "replacementPreviewToken": "…",  // string | null
  "payerRelationship": "…",        // string | null
  "payerName": "…"                 // string | null
}
```

**Response** `202` — body is `PaymentRecoveryCase`, plus a `Location` header pointing at the created resource

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

## Error body shapes

Shared with the rest of the API:

| Status | Body |
| --- | --- |
| `400`, `404`, `409`, `500` | `{ "message": "…" }` |
| `422` | `{ "errors": { "<field>": "<message>" } }` |

Messages are in Spanish and are written to be shown to the user as-is.
