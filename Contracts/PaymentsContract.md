# Payments API Contract

The generic settlement records produced by business-specific payment workflows.

---

## `Payment`

```jsonc
{
  "id": 1,
  "date": "2026-08-19",                 // YYYY-MM-DD
  "amount": 352.8,                      // What the payer was charged.
  "totalAllocated": 352.8,
  "totalToAccounts": 352.8,             // What reached the cash accounts.
  "isVoided": true,
  "voidedAt": "2026-08-19T14:30:00Z",   // string | null — ISO 8601
  "voidedBy": 1,                        // number | null
  "voidReason": "…",                    // string | null
  "createdAt": "2026-08-19T14:30:00Z",  // ISO 8601
  "createdBy": 1,                       // number | null
  "tenders": [
    {
      "id": 1,
      "paymentMethodId": 1,
      "paymentMethodName": "…",  // string | null
      "cashAccountId": 1,
      "cashAccountName": "…",    // string | null
      "amount": 352.8,
      "reference": "…",          // string | null
      "isVoided": true
    }
  ],
  "allocations": [
    {
      "id": 1,
      "obligationId": 1,
      "description": "…",     // string | null
      "amountApplied": 352.8,
      "originTypeCode": "…",  // string | null
      "isVoided": true
    }
  ]
}
```

A settled payment as stored.

## `ConfirmPaymentRequest`

```jsonc
{
  "previewToken": "…"   // string | null
}
```

## `ConfirmPaymentResponse`

```jsonc
{
  "id": 1,                          // The stored payment's id — what the caller hands to `POST /api/payment-documents` next.
  "requiresPaymentDocument": true,  // Whether this payment still owes a comprobante.
  "plan": {
    "date": "2026-08-19",      // YYYY-MM-DD
    "baseAmount": 352.8,       // What the payer chose to put toward their debt.
    "commissionTotal": 352.8,  // Added on top by the acquirers.
    "amount": 352.8,           // What the payer is actually charged — `BaseAmount + CommissionTotal`, and the value stored on the payment.
    "totalToAccounts": 352.8,  // What reaches the school's cash accounts.
    "tenders": [
      {
        "paymentMethodId": 1,
        "paymentMethodName": "…",  // string | null
        "amount": 352.8,
        "rate": 352.8,             // number | null — The commission rate applied, or null when this method takes none.
        "commission": 352.8,
        "charged": 352.8,          // What the payer is charged on this line: `Amount + Commission`.
        "netToAccount": 352.8,     // What lands in CashAccountName — equals Amount, since the commission never arrives.
        "cashAccountId": 1,
        "cashAccountName": "…",    // string | null
        "reference": "…"           // string | null
      }
    ],
    "allocations": [
      {
        "obligationId": 1,          // number | null — Null on commission lines in a <i>preview</i>: the obligation does not exist until the payment is confirmed.
        "kind": "…",                // string | null — `ENROLLMENT_CHARGE` or `CARD_COMMISSION`.
        "description": "…",         // string | null
        "allocated": 352.8,
        "outstandingBefore": 352.8,
        "outstandingAfter": 352.8,  // The balance this obligation is left with.
        "newStatusCode": "…",       // string | null
        "newStatusName": "…",       // string | null
        "dueDate": "2026-08-19"     // string | null — YYYY-MM-DD
      }
    ]
  }
}
```

## `PendingPaymentDocument`

```jsonc
{
  "paymentId": 1,
  "date": "2026-08-19",                 // YYYY-MM-DD
  "amount": 352.8,
  "payerName": "…",                     // string | null
  "createdAt": "2026-08-19T14:30:00Z"   // ISO 8601
}
```

A payment that still owes a comprobante. Derived, never flagged: a flag would have to be written by the very transaction whose failure it is meant to record.

---

## Endpoints

### 1. `GET /api/payments` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`PaymentFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `id` | `integer[]` |  |
| `dateFrom` | `"YYYY-MM-DD"` |  |
| `dateTo` | `"YYYY-MM-DD"` |  |
| `isVoided` | `boolean` |  |
| `createdBy` | `integer` |  |
| `obligationId` | `integer` |  |

**Response** `200` — body is `Payment[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 2. `POST /api/payments` — Create

**Deprecated.** Responses carry `Deprecation: true` and a `Link` header naming the successor.

**Request body**

```jsonc
{
  "previewToken": "…"   // string | null
}
```

**Response** `201` — body is `ConfirmPaymentResponse`, plus a `Location` header pointing at the created resource

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 3. `GET /api/payments/pending-documents` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |

**Response** `200` — body is `PendingPaymentDocument[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 4. `GET /api/payments/:id` — Get one

**Response** `200` — body is `Payment`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

## Error body shapes

Shared with the rest of the API:

| Status | Body |
| --- | --- |
| `400`, `404`, `409`, `500` | `{ "message": "…" }` |
| `422` | `{ "errors": { "<field>": "<message>" } }` |

Messages are in Spanish and are written to be shown to the user as-is.
