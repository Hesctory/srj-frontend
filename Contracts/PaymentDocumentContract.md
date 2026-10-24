# Payment Documents API Contract

Comprobantes de pago — generating one for a payment, reading them, and filing them with SUNAT.

---

## `PaymentDocument`

```jsonc
{
  "id": 1,
  "paymentId": 1,                       // number | null
  "seriesId": 1,
  "series": "…",                        // string | null
  "correlative": "…",                   // string | null
  "number": "…",                        // string | null — Series and correlative as the school writes them, e.g. `BB01-00000123` — the correlative is stored zero-padded to eight digits.
  "voucherTypeCode": "FACTURA",         // "FACTURA" | "BOLETA" | "NOTA_CREDITO" | "NOTA_DEBITO" | "RECIBO_INTERNO" — string | null
  "voucherTypeName": "…",               // string | null
  "sunatVoucherCode": "…",              // string | null
  "paymentForm": "…",                   // string | null
  "issueDate": "2026-08-19",            // YYYY-MM-DD
  "dueDate": "2026-08-19",              // string | null — YYYY-MM-DD
  "amount": 352.8,
  "acquirerDocumentType": 1,            // number | null
  "acquirerDocumentNumber": "…",        // string | null
  "acquirerFullName": "…",              // string | null
  "payerNote": "…",                     // string | null
  "link": "…",                          // string | null
  "isVoided": true,
  "retiredAt": "2026-08-19T14:30:00Z",  // string | null — ISO 8601
  "retiredBy": 1,                       // number | null
  "retirementKind": "LOCAL_DISCARD",    // "LOCAL_DISCARD" | "FULL_CREDIT_NOTE" | "LEGACY_VOID" — string | null
  "retirementReason": "…",              // string | null
  "correctionDocumentId": 1,            // number | null — The accepted full credit note that neutralised this comprobante — set only when `retirementKind` is `FULL_CREDIT_NOTE`.
  "sunatStatusCode": "PENDING",         // "PENDING" | "SENT" | "ACCEPTED" | "REJECTED" | "NOT_APPLICABLE" — string | null — Filing state, from `sunat_statuses`.
  "sunatStatusName": "…",               // string | null
  "sunatMessage": "…",                  // string | null
  "createdAt": "2026-08-19T14:30:00Z"   // ISO 8601
}
```

One comprobante as stored — the list read model.

## `GeneratePaymentDocumentRequest`

```jsonc
{
  "paymentId": 1,
  "payerRelationship": "…",  // string | null — `"MADRE" | "PADRE" | "APODERADO" | "OTRO"`, or omitted when the school does not want a payer note on this comprobante.
  "payerName": "…"           // string | null — Required, and used verbatim, only when PayerRelationship is `"OTRO"` — there is no family record to resolve a name from.
}
```

Generating a comprobante takes the payment, plus an optional note on who physically paid. Everything else — series, correlative, acquirer, lines, amounts — is derived server-side from what the payment already settled; amounts a client could send are amounts a client could change.

## `PaymentDocumentDetail`

```jsonc
{
  "document": {
    "id": 1,
    "paymentId": 1,                       // number | null
    "seriesId": 1,
    "series": "…",                        // string | null
    "correlative": "…",                   // string | null
    "number": "…",                        // string | null — Series and correlative as the school writes them, e.g. `BB01-00000123` — the correlative is stored zero-padded to eight digits.
    "voucherTypeCode": "FACTURA",         // "FACTURA" | "BOLETA" | "NOTA_CREDITO" | "NOTA_DEBITO" | "RECIBO_INTERNO" — string | null
    "voucherTypeName": "…",               // string | null
    "sunatVoucherCode": "…",              // string | null
    "paymentForm": "…",                   // string | null
    "issueDate": "2026-08-19",            // YYYY-MM-DD
    "dueDate": "2026-08-19",              // string | null — YYYY-MM-DD
    "amount": 352.8,
    "acquirerDocumentType": 1,            // number | null
    "acquirerDocumentNumber": "…",        // string | null
    "acquirerFullName": "…",              // string | null
    "payerNote": "…",                     // string | null
    "link": "…",                          // string | null
    "isVoided": true,
    "retiredAt": "2026-08-19T14:30:00Z",  // string | null — ISO 8601
    "retiredBy": 1,                       // number | null
    "retirementKind": "LOCAL_DISCARD",    // "LOCAL_DISCARD" | "FULL_CREDIT_NOTE" | "LEGACY_VOID" — string | null
    "retirementReason": "…",              // string | null
    "correctionDocumentId": 1,            // number | null — The accepted full credit note that neutralised this comprobante — set only when `retirementKind` is `FULL_CREDIT_NOTE`.
    "sunatStatusCode": "PENDING",         // "PENDING" | "SENT" | "ACCEPTED" | "REJECTED" | "NOT_APPLICABLE" — string | null — Filing state, from `sunat_statuses`.
    "sunatStatusName": "…",               // string | null
    "sunatMessage": "…",                  // string | null
    "createdAt": "2026-08-19T14:30:00Z"   // ISO 8601
  },
  "lines": [
    {
      "id": 1,
      "description": "…",  // string | null
      "quantity": 352.8,
      "unitPrice": 352.8,
      "subtotal": 352.8,
      "obligationId": 1    // number | null
    }
  ]
}
```

A comprobante with its fiscal lines.

## `CreditNoteReason`

```jsonc
{
  "code": "…",  // string | null
  "name": "…"   // string | null
}
```

---

## Endpoints

### 1. `GET /api/payment-documents` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`PaymentDocumentFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `paymentId` | `integer` |  |
| `seriesId` | `integer` |  |
| `institutionId` | `integer` |  |
| `voucherTypeCode` | `string` | "FACTURA" \| "BOLETA" \| "NOTA_CREDITO" \| "NOTA_DEBITO" \| "RECIBO_INTERNO" |
| `sunatStatusCode` | `string[]` | "PENDING" \| "SENT" \| "ACCEPTED" \| "REJECTED" \| "NOT_APPLICABLE" |
| `issueDateFrom` | `"YYYY-MM-DD"` |  |
| `issueDateTo` | `"YYYY-MM-DD"` |  |
| `includeVoided` | `boolean` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `PaymentDocument[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 2. `POST /api/payment-documents` — Create

Issue the comprobante for an already-registered payment. The body carries the payment id plus an optional payer note — series, correlative, acquirer and lines are all derived server-side.

**Request body**

```jsonc
{
  "paymentId": 1,
  "payerRelationship": "…",  // string | null — `"MADRE" | "PADRE" | "APODERADO" | "OTRO"`, or omitted when the school does not want a payer note on this comprobante.
  "payerName": "…"           // string | null — Required, and used verbatim, only when PayerRelationship is `"OTRO"` — there is no family record to resolve a name from.
}
```

**Response** `201` — body is `PaymentDocumentDetail`, plus a `Location` header pointing at the created resource

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 3. `GET /api/payment-documents/credit-note-reasons` — List

**Response** `200` — body is `CreditNoteReason[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 4. `GET /api/payment-documents/:id` — Get one

**Response** `200` — body is `PaymentDocumentDetail`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 5. `POST /api/payment-documents/:id/issue` — Issue

Present a stored comprobante to the OSE/SUNAT. Safe to call again after an unknown outcome: the provider is asked what it already holds before anything is resent.

**Response** `200` — body is `PaymentDocumentDetail`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

## Error body shapes

Shared with the rest of the API:

| Status | Body |
| --- | --- |
| `400`, `404`, `409`, `500` | `{ "message": "…" }` |
| `422` | `{ "errors": { "<field>": "<message>" } }` |

Messages are in Spanish and are written to be shown to the user as-is.
