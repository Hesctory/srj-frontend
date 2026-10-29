# Product Sales API Contract

Selling catalogue products over the counter, and the returns and exchanges against them.

---

## `ProductSaleReturnList`

```jsonc
{
  "id": 1,
  "productSaleId": 1,
  "returnedAt": "2026-08-19",           // YYYY-MM-DD
  "reason": "…",                        // string | null
  "returnedValue": 352.8,
  "replacementValue": 352.8,
  "netAmount": 352.8,
  "direction": "…",                     // string | null
  "isVoided": true,
  "createdAt": "2026-08-19T14:30:00Z"   // ISO 8601
}
```

## `ConfirmProductSaleReturnRequest`

```jsonc
{
  "previewToken": "…"   // string | null
}
```

## `ConfirmProductSaleReturnResponse`

```jsonc
{
  "id": 1,
  "paymentId": 1,      // number | null
  "documentId": 1,     // number | null
  "series": "…",       // string | null
  "correlative": "…",  // string | null
  "netAmount": 352.8,
  "plan": {
    "productSaleId": 1,
    "returnedAt": "2026-08-19",  // YYYY-MM-DD
    "reason": "…",               // string | null
    "buyerName": "…",            // string | null
    "returned": [
      {
        "productSaleLineId": 1,  // number | null
        "productOfferingId": 1,
        "description": "…",      // string | null
        "quantity": 1,
        "unitPrice": 352.8,
        "amount": 352.8,
        "currentStock": 1,
        "sufficientStock": true
      }
    ],
    "replacements": [
      {
        "productSaleLineId": 1,  // number | null
        "productOfferingId": 1,
        "description": "…",      // string | null
        "quantity": 1,
        "unitPrice": 352.8,
        "amount": 352.8,
        "currentStock": 1,
        "sufficientStock": true
      }
    ],
    "returnedValue": 352.8,
    "replacementValue": 352.8,
    "netAmount": 352.8,          // Replacement value minus returned value.
    "direction": "…",            // string | null — `charge`, `refund` or `even` — what the counter has to do next.
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
    "warnings": ["…"]            // array | null
  }
}
```

## `ProductSaleList`

```jsonc
{
  "id": 1,
  "soldAt": "2026-08-19",               // YYYY-MM-DD
  "partyTypeCode": "…",                 // string | null
  "partyId": 1,
  "buyerName": "…",                     // string | null
  "institutionId": 1,
  "lineCount": 1,
  "itemCount": 1,
  "total": 352.8,
  "isVoided": true,
  "paymentId": 1,                       // number | null
  "documentId": 1,                      // number | null
  "documentNumber": "…",                // string | null
  "notes": "…",                         // string | null
  "createdAt": "2026-08-19T14:30:00Z"   // ISO 8601
}
```

## `ConfirmProductSaleRequest`

```jsonc
{
  "previewToken": "…"   // string | null
}
```

## `ConfirmProductSaleResponse`

```jsonc
{
  "id": 1,             // The stored sale's id.
  "paymentId": 1,      // The settlement the engine wrote for it.
  "documentId": 1,     // number | null — The receipt raised in the same transaction, when one was.
  "series": "…",       // string | null
  "correlative": "…",  // string | null
  "total": 352.8,
  "plan": {
    "soldAt": "2026-08-19",  // YYYY-MM-DD
    "partyTypeCode": "…",    // string | null
    "partyId": 1,
    "buyerName": "…",        // string | null
    "institutionId": 1,
    "lines": [
      {
        "productOfferingId": 1,
        "productId": 1,
        "productName": "…",       // string | null
        "versionLabel": "…",      // string | null
        "sizeCode": "…",          // string | null
        "gradeName": "…",         // string | null
        "publisherName": "…",     // string | null
        "description": "…",       // string | null
        "quantity": 1,
        "unitPrice": 352.8,
        "discount": 352.8,
        "subtotal": 352.8,
        "currentStock": 1,
        "sufficientStock": true,  // False when the shelf cannot cover the quantity.
        "uniformSetId": 1,        // number | null
        "uniformSetName": "…"     // string | null
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
    "subtotal": 352.8,
    "discountTotal": 352.8,
    "total": 352.8,
    "commissionTotal": 352.8,
    "amountCharged": 352.8,
    "warnings": ["…"]        // array | null
  }
}
```

## `ProductSaleReturnPreviewRequest`

```jsonc
{
  "productSaleId": 1,
  "returned": [
    {
      "productSaleLineId": 1,
      "quantity": 1
    }
  ],
  "replacements": [
    {
      "productOfferingId": 1,
      "quantity": 1,
      "uniformSetId": 1   // number | null — Set this when the line was picked from a uniform set, so the set's bundle price for the year can replace the sum of its parts.
    }
  ],
  "tenders": [
    {
      "paymentMethodId": 1,
      "amount": 352.8,      // What the payer puts toward their debt on this line, before any commission.
      "reference": "…",     // string | null — Operation number from the bank or POS.
      "commission": 352.8   // number | null — Card commission in soles, charged on top of Amount.
    }
  ],
  "returnedAt": "2026-08-19",  // string | null — YYYY-MM-DD
  "reason": "…"                // string | null
}
```

A garment coming back, on its own or swapped for another.

## `ProductSaleReturnPreviewResponse`

```jsonc
{
  "previewToken": "…",                  // string | null
  "expiresAt": "2026-08-19T14:30:00Z",  // ISO 8601
  "plan": {
    "productSaleId": 1,
    "returnedAt": "2026-08-19",  // YYYY-MM-DD
    "reason": "…",               // string | null
    "buyerName": "…",            // string | null
    "returned": [
      {
        "productSaleLineId": 1,  // number | null
        "productOfferingId": 1,
        "description": "…",      // string | null
        "quantity": 1,
        "unitPrice": 352.8,
        "amount": 352.8,
        "currentStock": 1,
        "sufficientStock": true
      }
    ],
    "replacements": [
      {
        "productSaleLineId": 1,  // number | null
        "productOfferingId": 1,
        "description": "…",      // string | null
        "quantity": 1,
        "unitPrice": 352.8,
        "amount": 352.8,
        "currentStock": 1,
        "sufficientStock": true
      }
    ],
    "returnedValue": 352.8,
    "replacementValue": 352.8,
    "netAmount": 352.8,          // Replacement value minus returned value.
    "direction": "…",            // string | null — `charge`, `refund` or `even` — what the counter has to do next.
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
    "warnings": ["…"]            // array | null
  }
}
```

## `ProductSaleReturnDetail`

```jsonc
{
  "id": 1,
  "productSaleId": 1,
  "returnedAt": "2026-08-19",           // YYYY-MM-DD
  "reason": "…",                        // string | null
  "returnedValue": 352.8,
  "replacementValue": 352.8,
  "netAmount": 352.8,
  "direction": "…",                     // string | null
  "isVoided": true,
  "createdAt": "2026-08-19T14:30:00Z",  // ISO 8601
  "buyerName": "…",                     // string | null
  "paymentId": 1,                       // number | null
  "lines": [
    {
      "id": 1,
      "productSaleLineId": 1,  // number | null
      "productOfferingId": 1,
      "productName": "…",      // string | null
      "versionLabel": "…",     // string | null
      "sizeCode": "…",         // string | null
      "gradeName": "…",        // string | null
      "quantity": 1,
      "unitPrice": 352.8,
      "amount": 352.8,
      "isReplacement": true
    }
  ]
}
```

## `ProductSalePreviewRequest`

```jsonc
{
  "partyTypeCode": "…",    // string | null — Who is buying: `STUDENT`, `GUARDIAN` or `STAFF`.
  "partyId": 1,
  "institutionId": 1,
  "lines": [
    {
      "productOfferingId": 1,
      "quantity": 1,
      "uniformSetId": 1   // number | null — Set this when the line was picked from a uniform set, so the set's bundle price for the year can replace the sum of its parts.
    }
  ],
  "tenders": [
    {
      "paymentMethodId": 1,
      "amount": 352.8,      // What the payer puts toward their debt on this line, before any commission.
      "reference": "…",     // string | null — Operation number from the bank or POS.
      "commission": 352.8   // number | null — Card commission in soles, charged on top of Amount.
    }
  ],
  "soldAt": "2026-08-19",  // string | null — YYYY-MM-DD
  "notes": "…"             // string | null
}
```

What the clerk is proposing to sell. Nothing is written for a preview.

## `ProductSalePreviewResponse`

```jsonc
{
  "previewToken": "…",                  // string | null
  "expiresAt": "2026-08-19T14:30:00Z",  // ISO 8601
  "plan": {
    "soldAt": "2026-08-19",  // YYYY-MM-DD
    "partyTypeCode": "…",    // string | null
    "partyId": 1,
    "buyerName": "…",        // string | null
    "institutionId": 1,
    "lines": [
      {
        "productOfferingId": 1,
        "productId": 1,
        "productName": "…",       // string | null
        "versionLabel": "…",      // string | null
        "sizeCode": "…",          // string | null
        "gradeName": "…",         // string | null
        "publisherName": "…",     // string | null
        "description": "…",       // string | null
        "quantity": 1,
        "unitPrice": 352.8,
        "discount": 352.8,
        "subtotal": 352.8,
        "currentStock": 1,
        "sufficientStock": true,  // False when the shelf cannot cover the quantity.
        "uniformSetId": 1,        // number | null
        "uniformSetName": "…"     // string | null
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
    "subtotal": 352.8,
    "discountTotal": 352.8,
    "total": 352.8,
    "commissionTotal": 352.8,
    "amountCharged": 352.8,
    "warnings": ["…"]        // array | null
  }
}
```

## `ProductSaleDetail`

```jsonc
{
  "id": 1,
  "soldAt": "2026-08-19",               // YYYY-MM-DD
  "partyTypeCode": "…",                 // string | null
  "partyId": 1,
  "buyerName": "…",                     // string | null
  "institutionId": 1,
  "lineCount": 1,
  "itemCount": 1,
  "total": 352.8,
  "isVoided": true,
  "paymentId": 1,                       // number | null
  "documentId": 1,                      // number | null
  "documentNumber": "…",                // string | null
  "notes": "…",                         // string | null
  "createdAt": "2026-08-19T14:30:00Z",  // ISO 8601
  "subtotal": 352.8,
  "discountTotal": 352.8,
  "voidReason": "…",                    // string | null
  "lines": [
    {
      "id": 1,
      "productOfferingId": 1,
      "productId": 1,
      "productName": "…",     // string | null
      "versionLabel": "…",    // string | null
      "sizeCode": "…",        // string | null
      "gradeName": "…",       // string | null
      "schoolYearId": 1,
      "quantity": 1,
      "unitPrice": 352.8,
      "discount": 352.8,
      "subtotal": 352.8,
      "uniformSetId": 1,      // number | null
      "uniformSetName": "…",  // string | null
      "returnedQuantity": 1   // How many of this line have since come back through a return.
    }
  ],
  "returns": [
    {
      "id": 1,
      "productSaleId": 1,
      "returnedAt": "2026-08-19",           // YYYY-MM-DD
      "reason": "…",                        // string | null
      "returnedValue": 352.8,
      "replacementValue": 352.8,
      "netAmount": 352.8,
      "direction": "…",                     // string | null
      "isVoided": true,
      "createdAt": "2026-08-19T14:30:00Z"   // ISO 8601
    }
  ]
}
```

## `VoidProductSaleRequest`

```jsonc
{
  "reason": "…"   // string | null
}
```

## `ProductSalesHistory`

```jsonc
{
  "productId": 1,
  "productName": "…",  // string | null
  "schoolYearId": 1,   // number | null
  "unitsSold": 1,
  "revenue": 352.8,
  "rows": [
    {
      "productVersionId": 1,
      "versionLabel": "…",  // string | null
      "productVariantId": 1,
      "sizeCode": "…",      // string | null
      "gradeName": "…",     // string | null
      "schoolYearId": 1,
      "productOfferingId": 1,
      "salePrice": 352.8,
      "unitsSold": 1,
      "revenue": 352.8,
      "currentStock": 1
    }
  ]
}
```

One product's sales history — what it sold, to how many buyers, for how much.

## `ProductSellable`

```jsonc
{
  "productId": 1,
  "productName": "…",    // string | null
  "productTypeId": 1,
  "garmentGenderId": 1,  // number | null
  "sizeScaleId": 1,      // number | null
  "schoolYearId": 1,
  "versions": [
    {
      "productVersionId": 1,
      "label": "…",          // string | null
      "publisherId": 1,      // number | null
      "publisherName": "…",  // string | null
      "notes": "…",          // string | null
      "variants": [
        {
          "productVariantId": 1,
          "productOfferingId": 1,
          "sizeId": 1,         // number | null
          "sizeCode": "…",     // string | null
          "sizeSortOrder": 1,  // number | null
          "gradeId": 1,        // number | null
          "gradeName": "…",    // string | null
          "salePrice": 352.8,
          "currentStock": 1
        }
      ]
    }
  ]
}
```

What a clerk can actually sell of one product in one school year.

## `UniformSetSellable`

```jsonc
{
  "uniformSetId": 1,
  "name": "…",           // string | null
  "garmentGenderId": 1,  // number | null
  "levelId": 1,          // number | null
  "schoolYearId": 1,
  "bundlePrice": 352.8,  // number | null — The set's own price for the year.
  "items": [
    {
      "uniformSetItemId": 1,
      "quantity": 1,
      "isOptional": true,
      "product": {
        "productId": 1,
        "productName": "…",    // string | null
        "productTypeId": 1,
        "garmentGenderId": 1,  // number | null
        "sizeScaleId": 1,      // number | null
        "schoolYearId": 1,
        "versions": [
          {
            "productVersionId": 1,
            "label": "…",          // string | null
            "publisherId": 1,      // number | null
            "publisherName": "…",  // string | null
            "notes": "…",          // string | null
            "variants": [
              {
                "productVariantId": 1,
                "productOfferingId": 1,
                "sizeId": 1,         // number | null
                "sizeCode": "…",     // string | null
                "sizeSortOrder": 1,  // number | null
                "gradeId": 1,        // number | null
                "gradeName": "…",    // string | null
                "salePrice": 352.8,
                "currentStock": 1
              }
            ]
          }
        ]
      }
    }
  ]
}
```

A uniform set as the counter sells it: the parts, and for each part the versions and sizes to choose from. The set never fixes a size — that is chosen per student at the counter.

---

## Endpoints

### 1. `GET /api/product-sale-returns` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |
| `sort` | JSON | React-Admin sorting, a JSON pair: `["name","ASC"]`. |

`filter` accepts **`ProductSaleReturnFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `productSaleId` | `integer` |  |
| `from` | `"YYYY-MM-DD"` |  |
| `to` | `"YYYY-MM-DD"` |  |
| `isVoided` | `boolean` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `ProductSaleReturnList[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 2. `POST /api/product-sale-returns` — Create

**Request body**

```jsonc
{
  "previewToken": "…"   // string | null
}
```

**Response** `201` — body is `ConfirmProductSaleReturnResponse`, plus a `Location` header pointing at the created resource

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 3. `GET /api/product-sales` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |
| `sort` | JSON | React-Admin sorting, a JSON pair: `["name","ASC"]`. |

`filter` accepts **`ProductSaleFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `from` | `"YYYY-MM-DD"` |  |
| `to` | `"YYYY-MM-DD"` |  |
| `partyTypeCode` | `string` |  |
| `partyId` | `integer` |  |
| `schoolYearId` | `integer` |  |
| `productId` | `integer` |  |
| `productOfferingId` | `integer` |  |
| `institutionId` | `integer` |  |
| `isVoided` | `boolean` |  |
| `q` | `string` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `ProductSaleList[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 4. `POST /api/product-sales` — Create

**Request body**

```jsonc
{
  "previewToken": "…"   // string | null
}
```

**Response** `201` — body is `ConfirmProductSaleResponse`, plus a `Location` header pointing at the created resource

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 5. `POST /api/product-sale-returns/preview` — Preview

**Request body**

```jsonc
{
  "productSaleId": 1,
  "returned": [
    {
      "productSaleLineId": 1,
      "quantity": 1
    }
  ],
  "replacements": [
    {
      "productOfferingId": 1,
      "quantity": 1,
      "uniformSetId": 1   // number | null — Set this when the line was picked from a uniform set, so the set's bundle price for the year can replace the sum of its parts.
    }
  ],
  "tenders": [
    {
      "paymentMethodId": 1,
      "amount": 352.8,      // What the payer puts toward their debt on this line, before any commission.
      "reference": "…",     // string | null — Operation number from the bank or POS.
      "commission": 352.8   // number | null — Card commission in soles, charged on top of Amount.
    }
  ],
  "returnedAt": "2026-08-19",  // string | null — YYYY-MM-DD
  "reason": "…"                // string | null
}
```

**Response** `200` — body is `ProductSaleReturnPreviewResponse`

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 6. `GET /api/product-sale-returns/:id` — Get one

**Response** `200` — body is `ProductSaleReturnDetail`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 7. `POST /api/product-sales/preview` — Preview

Price the basket and check the shelf. Writes nothing.

**Request body**

```jsonc
{
  "partyTypeCode": "…",    // string | null — Who is buying: `STUDENT`, `GUARDIAN` or `STAFF`.
  "partyId": 1,
  "institutionId": 1,
  "lines": [
    {
      "productOfferingId": 1,
      "quantity": 1,
      "uniformSetId": 1   // number | null — Set this when the line was picked from a uniform set, so the set's bundle price for the year can replace the sum of its parts.
    }
  ],
  "tenders": [
    {
      "paymentMethodId": 1,
      "amount": 352.8,      // What the payer puts toward their debt on this line, before any commission.
      "reference": "…",     // string | null — Operation number from the bank or POS.
      "commission": 352.8   // number | null — Card commission in soles, charged on top of Amount.
    }
  ],
  "soldAt": "2026-08-19",  // string | null — YYYY-MM-DD
  "notes": "…"             // string | null
}
```

**Response** `200` — body is `ProductSalePreviewResponse`

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 8. `GET /api/product-sales/:id` — Get one

**Response** `200` — body is `ProductSaleDetail`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 9. `POST /api/product-sales/:id/void` — Void

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

### 10. `GET /api/products/:id/sales-history` — Get

What this product has sold, by version and variant.

**Query params**

| param | type | notes |
| --- | --- | --- |
| `schoolYearId` | `integer` |  |

**Response** `200` — body is `ProductSalesHistory`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 11. `GET /api/products/:id/sellable` — Get

What can actually be sold of this product in a school year: the versions on offer, and the sizes or grades of each with their price and stock.

**Query params**

| param | type | notes |
| --- | --- | --- |
| `schoolYearId` | `integer` |  |

**Response** `200` — body is `ProductSellable`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 12. `GET /api/uniform-sets/:id/sellable` — Get

The set as the counter sells it: each part with the versions and sizes to choose from, plus the set's bundle price for the year.

**Query params**

| param | type | notes |
| --- | --- | --- |
| `schoolYearId` | `integer` |  |

**Response** `200` — body is `UniformSetSellable`

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
