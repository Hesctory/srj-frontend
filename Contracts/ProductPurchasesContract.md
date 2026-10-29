# Product Purchases API Contract

Recording goods received from suppliers and paying what is owed for them.

---

## `ProductPurchaseList`

```jsonc
{
  "id": 1,
  "providerId": 1,
  "providerName": "…",                  // string | null
  "providerRuc": "…",                   // string | null
  "institutionId": 1,
  "purchasedAt": "2026-08-19",          // YYYY-MM-DD
  "dueDate": "2026-08-19",              // YYYY-MM-DD
  "voucherNumber": "…",                 // string | null
  "voucherTypeId": 1,                   // number | null
  "lineCount": 1,
  "itemCount": 1,
  "total": 352.8,
  "outstanding": 352.8,                 // What is still owed on the payable this purchase raised.
  "statusCode": "…",                    // string | null
  "isVoided": true,
  "notes": "…",                         // string | null
  "createdAt": "2026-08-19T14:30:00Z"   // ISO 8601
}
```

## `CreateProductPurchase`

```jsonc
{
  "providerId": 1,
  "institutionId": 1,
  "purchasedAt": "2026-08-19",  // YYYY-MM-DD
  "dueDate": "2026-08-19",      // YYYY-MM-DD
  "lines": [
    {
      "productOfferingId": 1,
      "quantity": 1,
      "unitCost": 352.8,
      "discount": 352.8
    }
  ],
  "voucher": {
    "voucherTypeId": 1,
    "series": "…",             // string | null
    "number": "…",             // string | null
    "issuedAt": "2026-08-19"   // string | null — YYYY-MM-DD
  },
  "notes": "…"                  // string | null
}
```

Goods received from a supplier. Recorded in one call: the payable it raises is settled later, through the ordinary provider-payment flow.

## `CreatedId`

```jsonc
{
  "id": 1   // Identifier of the newly created resource.
}
```

The body every `POST` returns alongside `201 Created`: the id of the row just written, and nothing else. The client re-reads the resource through the `Location` header.

## `ConfirmProviderPaymentRequest`

```jsonc
{
  "previewToken": "…"   // string | null
}
```

## `ConfirmProviderPaymentResponse`

```jsonc
{
  "paymentId": 1,
  "plan": {
    "providerId": 1,
    "providerName": "…",   // string | null
    "date": "2026-08-19",  // YYYY-MM-DD
    "allocations": [
      {
        "obligationId": 1,
        "description": "…",  // string | null
        "outstandingBefore": 352.8,
        "allocated": 352.8,
        "outstandingAfter": 352.8
      }
    ],
    "tenders": [
      {
        "paymentMethodId": 1,
        "paymentMethodName": "…",      // string | null
        "amount": 352.8,
        "commission": 352.8,
        "reference": "…",              // string | null
        "suggestedCommission": 352.8,  // number | null — The suggested commission.
        "commissionTyped": true        // True when Commission is what staff typed.
      }
    ],
    "total": 352.8
  }
}
```

## `ProductPurchaseDetail`

```jsonc
{
  "id": 1,
  "providerId": 1,
  "providerName": "…",                  // string | null
  "providerRuc": "…",                   // string | null
  "institutionId": 1,
  "purchasedAt": "2026-08-19",          // YYYY-MM-DD
  "dueDate": "2026-08-19",              // YYYY-MM-DD
  "voucherNumber": "…",                 // string | null
  "voucherTypeId": 1,                   // number | null
  "lineCount": 1,
  "itemCount": 1,
  "total": 352.8,
  "outstanding": 352.8,                 // What is still owed on the payable this purchase raised.
  "statusCode": "…",                    // string | null
  "isVoided": true,
  "notes": "…",                         // string | null
  "createdAt": "2026-08-19T14:30:00Z",  // ISO 8601
  "subtotal": 352.8,
  "discountTotal": 352.8,
  "voucherIssuedAt": "2026-08-19",      // string | null — YYYY-MM-DD
  "voucherSeries": "…",                 // string | null
  "voidReason": "…",                    // string | null
  "obligationId": 1,                    // number | null
  "lines": [
    {
      "id": 1,
      "productOfferingId": 1,
      "productId": 1,
      "productName": "…",   // string | null
      "versionLabel": "…",  // string | null
      "sizeCode": "…",      // string | null
      "gradeName": "…",     // string | null
      "schoolYearId": 1,
      "quantity": 1,
      "unitCost": 352.8,
      "discount": 352.8,
      "subtotal": 352.8
    }
  ]
}
```

## `ProviderPaymentPreviewRequest`

```jsonc
{
  "providerId": 1,
  "obligationIds": [1],  // array | null
  "date": "2026-08-19",  // string | null — YYYY-MM-DD
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

Paying a supplier. Money out, settling payables that already exist.

## `ProviderPaymentPreviewResponse`

```jsonc
{
  "previewToken": "…",                  // string | null
  "expiresAt": "2026-08-19T14:30:00Z",  // ISO 8601
  "plan": {
    "providerId": 1,
    "providerName": "…",   // string | null
    "date": "2026-08-19",  // YYYY-MM-DD
    "allocations": [
      {
        "obligationId": 1,
        "description": "…",  // string | null
        "outstandingBefore": 352.8,
        "allocated": 352.8,
        "outstandingAfter": 352.8
      }
    ],
    "tenders": [
      {
        "paymentMethodId": 1,
        "paymentMethodName": "…",      // string | null
        "amount": 352.8,
        "commission": 352.8,
        "reference": "…",              // string | null
        "suggestedCommission": 352.8,  // number | null — The suggested commission.
        "commissionTyped": true        // True when Commission is what staff typed.
      }
    ],
    "total": 352.8
  }
}
```

## `VoidProductPurchaseRequest`

```jsonc
{
  "reason": "…"   // string | null
}
```

## `ProviderPayable`

```jsonc
{
  "obligationId": 1,
  "productPurchaseId": 1,   // number | null
  "description": "…",       // string | null
  "dueDate": "2026-08-19",  // YYYY-MM-DD
  "originalAmount": 352.8,
  "outstandingAmount": 352.8,
  "statusCode": "…",        // string | null
  "statusName": "…",        // string | null
  "isOverdue": true,
  "voucherNumber": "…"      // string | null
}
```

What the school still owes one supplier, obligation by obligation.

---

## Endpoints

### 1. `GET /api/product-purchases` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |
| `sort` | JSON | React-Admin sorting, a JSON pair: `["name","ASC"]`. |

`filter` accepts **`ProductPurchaseFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `providerId` | `integer` |  |
| `from` | `"YYYY-MM-DD"` |  |
| `to` | `"YYYY-MM-DD"` |  |
| `institutionId` | `integer` |  |
| `productId` | `integer` |  |
| `isVoided` | `boolean` |  |
| `outstandingOnly` | `boolean` |  |
| `q` | `string` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `ProductPurchaseList[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 2. `POST /api/product-purchases` — Create

**Request body**

```jsonc
{
  "providerId": 1,
  "institutionId": 1,
  "purchasedAt": "2026-08-19",  // YYYY-MM-DD
  "dueDate": "2026-08-19",      // YYYY-MM-DD
  "lines": [
    {
      "productOfferingId": 1,
      "quantity": 1,
      "unitCost": 352.8,
      "discount": 352.8
    }
  ],
  "voucher": {
    "voucherTypeId": 1,
    "series": "…",             // string | null
    "number": "…",             // string | null
    "issuedAt": "2026-08-19"   // string | null — YYYY-MM-DD
  },
  "notes": "…"                  // string | null
}
```

**Response** `201` — body is `CreatedId`, plus a `Location` header pointing at the created resource

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 3. `POST /api/provider-payments` — Provider Payments

**Request body**

```jsonc
{
  "previewToken": "…"   // string | null
}
```

**Response** `200` — body is `ConfirmProviderPaymentResponse`

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 4. `GET /api/product-purchases/:id` — Get one

**Response** `200` — body is `ProductPurchaseDetail`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 5. `POST /api/provider-payments/preview` — Preview

**Request body**

```jsonc
{
  "providerId": 1,
  "obligationIds": [1],  // array | null
  "date": "2026-08-19",  // string | null — YYYY-MM-DD
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

**Response** `200` — body is `ProviderPaymentPreviewResponse`

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 6. `POST /api/product-purchases/:id/void` — Void

**Request body**

```jsonc
{
  "reason": "…"   // string | null
}
```

**Response** `200`

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

### 7. `GET /api/provider-payments/payables/:providerId` — List

What one supplier is still owed.

**Response** `200` — body is `ProviderPayable[]`, plus a `Content-Range` header carrying the total row count

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
