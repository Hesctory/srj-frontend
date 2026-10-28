# Enrollment Payments API Contract

Registering a payment against outstanding obligations, in a preview and a commit step.

---

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
        "paymentMethodName": "…",      // string | null
        "amount": 352.8,
        "rate": 352.8,                 // number | null — The commission rate applied, or null when this method takes none.
        "commission": 352.8,           // The commission applied: typed by staff, or the suggestion.
        "charged": 352.8,              // What the payer is charged on this line: `Amount + Commission`.
        "netToAccount": 352.8,         // What lands in CashAccountName — equals Amount, since the commission never arrives.
        "cashAccountId": 1,
        "cashAccountName": "…",        // string | null
        "reference": "…",              // string | null
        "suggestedCommission": 352.8,  // number | null — The suggested commission.
        "commissionTyped": true        // True when Commission is what staff typed.
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

## `PaymentMethod`

```jsonc
{
  "id": 1,
  "name": "…",    // string | null
  "rate": 352.8   // number | null — The card commission rate in force today; null when the method takes no commission.
}
```

## `PaymentPreviewRequest`

```jsonc
{
  "studentId": 1,        // number | null — Settle across every enrollment of this student.
  "enrollmentId": 1,     // number | null — Settle within one enrollment.
  "obligationIds": [1],  // array | null — Target specific obligations instead of waterfalling.
  "date": "2026-08-19",  // string | null — YYYY-MM-DD — Operative date.
  "lines": [
    {
      "paymentMethodId": 1,
      "amount": 352.8,      // What the payer puts toward their debt on this line, before any commission.
      "reference": "…",     // string | null — Operation number from the bank or POS.
      "commission": 352.8   // number | null — Card commission in soles, charged on top of Amount.
    }
  ]
}
```

What the cashier is proposing to collect. Nothing is written for a preview.

## `PaymentPreviewResponse`

```jsonc
{
  "previewToken": "…",                  // string | null — Hand this back to `POST /api/payments` to commit the plan.
  "expiresAt": "2026-08-19T14:30:00Z",  // ISO 8601
  "plan": {
    "date": "2026-08-19",      // YYYY-MM-DD
    "baseAmount": 352.8,       // What the payer chose to put toward their debt.
    "commissionTotal": 352.8,  // Added on top by the acquirers.
    "amount": 352.8,           // What the payer is actually charged — `BaseAmount + CommissionTotal`, and the value stored on the payment.
    "totalToAccounts": 352.8,  // What reaches the school's cash accounts.
    "tenders": [
      {
        "paymentMethodId": 1,
        "paymentMethodName": "…",      // string | null
        "amount": 352.8,
        "rate": 352.8,                 // number | null — The commission rate applied, or null when this method takes none.
        "commission": 352.8,           // The commission applied: typed by staff, or the suggestion.
        "charged": 352.8,              // What the payer is charged on this line: `Amount + Commission`.
        "netToAccount": 352.8,         // What lands in CashAccountName — equals Amount, since the commission never arrives.
        "cashAccountId": 1,
        "cashAccountName": "…",        // string | null
        "reference": "…",              // string | null
        "suggestedCommission": 352.8,  // number | null — The suggested commission.
        "commissionTyped": true        // True when Commission is what staff typed.
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

## `ReplacementPaymentPreviewRequest`

```jsonc
{
  "cause": "…",  // string | null
  "lines": [
    {
      "paymentMethodId": 1,
      "amount": 352.8,      // What the payer puts toward their debt on this line, before any commission.
      "reference": "…",     // string | null — Operation number from the bank or POS.
      "commission": 352.8   // number | null — Card commission in soles, charged on top of Amount.
    }
  ]
}
```

---

## Endpoints

### 1. `POST /api/enrollment-payments` — Create

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

### 2. `GET /api/payment-methods` — List

**Response** `200` — body is `PaymentMethod[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 3. `POST /api/payment-preview` — Payment Preview

**Deprecated.** Responses carry `Deprecation: true` and a `Link` header naming the successor.

**Request body**

```jsonc
{
  "studentId": 1,        // number | null — Settle across every enrollment of this student.
  "enrollmentId": 1,     // number | null — Settle within one enrollment.
  "obligationIds": [1],  // array | null — Target specific obligations instead of waterfalling.
  "date": "2026-08-19",  // string | null — YYYY-MM-DD — Operative date.
  "lines": [
    {
      "paymentMethodId": 1,
      "amount": 352.8,      // What the payer puts toward their debt on this line, before any commission.
      "reference": "…",     // string | null — Operation number from the bank or POS.
      "commission": 352.8   // number | null — Card commission in soles, charged on top of Amount.
    }
  ]
}
```

**Response** `200` — body is `PaymentPreviewResponse`

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 4. `POST /api/enrollment-payments/preview` — Preview

**Request body**

```jsonc
{
  "studentId": 1,        // number | null — Settle across every enrollment of this student.
  "enrollmentId": 1,     // number | null — Settle within one enrollment.
  "obligationIds": [1],  // array | null — Target specific obligations instead of waterfalling.
  "date": "2026-08-19",  // string | null — YYYY-MM-DD — Operative date.
  "lines": [
    {
      "paymentMethodId": 1,
      "amount": 352.8,      // What the payer puts toward their debt on this line, before any commission.
      "reference": "…",     // string | null — Operation number from the bank or POS.
      "commission": 352.8   // number | null — Card commission in soles, charged on top of Amount.
    }
  ]
}
```

**Response** `200` — body is `PaymentPreviewResponse`

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 5. `POST /api/enrollment-payments/:paymentId/replacement-preview` — Replacement Preview

**Request body**

```jsonc
{
  "cause": "…",  // string | null
  "lines": [
    {
      "paymentMethodId": 1,
      "amount": 352.8,      // What the payer puts toward their debt on this line, before any commission.
      "reference": "…",     // string | null — Operation number from the bank or POS.
      "commission": 352.8   // number | null — Card commission in soles, charged on top of Amount.
    }
  ]
}
```

**Response** `200` — body is `PaymentPreviewResponse`

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
