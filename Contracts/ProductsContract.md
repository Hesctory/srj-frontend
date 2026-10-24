# Products API Contract

The sellable catalogue — the product line, the versions it has been redesigned into, their sizes and per-year prices — plus the stock ledger and the uniform sets that group lines together.

---

## `GarmentGender`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `ProductStockMovementType`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `ProductStockMovement`

```jsonc
{
  "id": 1,
  "productVariantId": 1,              // The variant whose stock this movement changed.
  "productOfferingId": 1,             // number | null — The offering the document was written against; null on a migrated row.
  "productId": 1,
  "productName": "…",                 // string | null
  "versionLabel": "…",                // string | null
  "sizeCode": "…",                    // string | null
  "gradeName": "…",                   // string | null
  "schoolYearId": 1,                  // number | null
  "movementTypeId": 1,
  "movementTypeCode": "…",            // string | null
  "movementTypeName": "…",            // string | null
  "quantityDelta": 1,
  "countsTowardStock": true,          // False on a movement from before the variant's last counted school year; it is listed but not part of the stock figure.
  "sourceKind": "…",                  // string | null — The document behind the movement — `sale`, `purchase`, `return`, `initial` or `legacy` — and its id, so the UI can link straight to it.
  "sourceId": 1,                      // number | null
  "sourceLabel": "…",                 // string | null
  "unitValue": 352.8,                 // number | null
  "notes": "…",                       // string | null
  "movedAt": "2026-08-19T14:30:00Z",  // ISO 8601
  "createdBy": 1,                     // number | null
  "createdByName": "…"                // string | null
}
```

A kardex row. `movementTypeId` follows from the document that caused the movement and `movedAt` is DB-generated, so neither is ever accepted from the client.

## `ProductType`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `ProductList`

```jsonc
{
  "id": 1,
  "name": "…",           // string | null
  "productTypeId": 1,
  "garmentGenderId": 1,  // number | null
  "sizeScaleId": 1,      // number | null
  "isActive": true,
  "versionCount": 1,
  "variantsOnOffer": 1   // number | null — Variants on offer in the filtered school year; null when the filter carried no year.
}
```

A product LINE as the catalog list renders it. The line is the thing the school names; its sizes, its redesigns and its prices hang off it and are fetched with the detail.

## `CreateProduct`

```jsonc
{
  "productTypeId": 1,
  "name": "…",           // string | null
  "garmentGenderId": 1,  // number | null
  "sizeScaleId": 1,      // number | null
  "isActive": true,
  "versions": [
    {
      "id": 1,           // number | null
      "label": "…",      // string | null
      "publisherId": 1,  // number | null
      "notes": "…",      // string | null
      "variants": [
        {
          "id": 1,       // number | null
          "sizeId": 1,   // number | null
          "gradeId": 1,  // number | null
          "offerings": [
            {
              "id": 1,                 // number | null
              "schoolYearId": 1,
              "salePrice": 352.8,
              "purchasePrice": 352.8   // number | null
            }
          ]
        }
      ]
    }
  ]
}
```

Body accepted by both create (POST) and update (PUT). A child carrying an `id` is updated in place; one without is inserted; on update, existing children absent from the payload are deleted.

## `CreatedId`

```jsonc
{
  "id": 1   // Identifier of the newly created resource.
}
```

The body every `POST` returns alongside `201 Created`: the id of the row just written, and nothing else. The client re-reads the resource through the `Location` header.

## `Size`

```jsonc
{
  "id": 1,
  "sizeScaleId": 1,
  "code": "…",  // string | null
  "name": "…",  // string | null
  "sortOrder": 1
}
```

One rung of a size ladder. `sortOrder` is what makes the ladder an ordered thing — the sizes run 2..16 and then XS..XXL, and price rises along that order, so the UI must never sort them alphabetically.

## `UniformSetList`

```jsonc
{
  "id": 1,
  "name": "…",           // string | null
  "garmentGenderId": 1,  // number | null
  "levelId": 1,          // number | null
  "isActive": true,
  "itemCount": 1
}
```

A named uniform and the product lines it is made of.

## `CreateUniformSet`

```jsonc
{
  "name": "…",           // string | null
  "garmentGenderId": 1,  // number | null
  "levelId": 1,          // number | null
  "isActive": true,
  "items": [
    {
      "id": 1,  // number | null
      "productId": 1,
      "quantity": 1,
      "isOptional": true
    }
  ],
  "offerings": [
    {
      "id": 1,               // number | null
      "schoolYearId": 1,
      "bundlePrice": 352.8   // number | null
    }
  ]
}
```

## `ProductOfferingList`

```jsonc
{
  "id": 1,
  "productId": 1,
  "productName": "…",      // string | null
  "productTypeId": 1,
  "productVersionId": 1,
  "versionLabel": "…",     // string | null
  "garmentGenderId": 1,    // number | null
  "publisherId": 1,        // number | null
  "publisherName": "…",    // string | null
  "productVariantId": 1,
  "sizeId": 1,             // number | null
  "sizeCode": "…",         // string | null
  "sizeSortOrder": 1,      // number | null — The size's place on the ladder (`sizes.sort_order`).
  "gradeId": 1,            // number | null
  "gradeName": "…",        // string | null
  "schoolYearId": 1,
  "salePrice": 352.8,
  "purchasePrice": 352.8,  // number | null
  "currentStock": 1,       // The variant's stock now; the same figure on every school year's row of one variant.
  "openingStock": 1,       // The variant's stock at the moment this offering was created.
  "isActive": true
}
```

The flat sellable grid: one row per variant on sale in a school year, already carrying the names the shop counter needs. This is the shape the stock and sales screens read, as opposed to the nested product detail which is the shape the catalog editor writes.

## `ProductDetail`

```jsonc
{
  "id": 1,
  "name": "…",           // string | null
  "productTypeId": 1,
  "garmentGenderId": 1,  // number | null
  "sizeScaleId": 1,      // number | null
  "isActive": true,
  "versions": [
    {
      "id": 1,
      "label": "…",      // string | null
      "publisherId": 1,  // number | null
      "notes": "…",      // string | null
      "variants": [
        {
          "id": 1,
          "sizeId": 1,   // number | null
          "gradeId": 1,  // number | null
          "offerings": [
            {
              "id": 1,
              "schoolYearId": 1,
              "salePrice": 352.8,
              "purchasePrice": 352.8,  // number | null
              "currentStock": 1,
              "openingStock": 1        // The variant's stock at the moment this offering was created.
            }
          ]
        }
      ]
    }
  ]
}
```

The line with every version, variant and per-year offering it has.

## `SizeScale`

```jsonc
{
  "id": 1,
  "code": "…",  // string | null
  "name": "…"   // string | null
}
```

## `UniformSetDetail`

```jsonc
{
  "id": 1,
  "name": "…",           // string | null
  "garmentGenderId": 1,  // number | null
  "levelId": 1,          // number | null
  "isActive": true,
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "…",  // string | null
      "quantity": 1,
      "isOptional": true
    }
  ],
  "offerings": [
    {
      "id": 1,
      "schoolYearId": 1,
      "bundlePrice": 352.8   // number | null
    }
  ]
}
```

## `UpdateProductVersion`

```jsonc
{
  "label": "…",      // string | null
  "publisherId": 1,  // number | null
  "notes": "…"       // string | null
}
```

## `UpdateProductLine`

```jsonc
{
  "productTypeId": 1,
  "name": "…",           // string | null
  "garmentGenderId": 1,  // number | null
  "sizeScaleId": 1,      // number | null
  "isActive": true
}
```

The line's own fields. Editing a name no longer rewrites the tree beneath it.

## `CreateProductVersion`

```jsonc
{
  "label": "…",      // string | null
  "publisherId": 1,  // number | null
  "notes": "…",      // string | null
  "sizeIds": [1],    // array | null — Optional: create the version's variants in the same call.
  "gradeIds": [1]    // array | null
}
```

A new cut of a garment or a new edition of a book. Both keep selling side by side, so a version is created rather than the old one edited.

## `Kardex`

```jsonc
{
  "productOfferingId": 1,
  "productVariantId": 1,
  "productId": 1,
  "productName": "…",    // string | null
  "versionLabel": "…",   // string | null
  "sizeCode": "…",       // string | null
  "gradeName": "…",      // string | null
  "schoolYearId": 1,
  "from": "2026-08-19",  // string | null — YYYY-MM-DD
  "to": "2026-08-19",    // string | null — YYYY-MM-DD
  "opening": 1,          // Balance before the first row shown.
  "totalIn": 1,
  "totalOut": 1,
  "closing": 1,
  "movements": [
    {
      "id": 1,
      "movedAt": "2026-08-19T14:30:00Z",  // ISO 8601
      "movementTypeId": 1,
      "movementTypeCode": "…",            // string | null
      "movementTypeName": "…",            // string | null
      "sourceKind": "…",                  // string | null
      "sourceId": 1,                      // number | null
      "sourceLabel": "…",                 // string | null
      "quantityIn": 1,
      "quantityOut": 1,
      "countsTowardStock": true,          // False on a movement from before the variant's last counted school year; it does not move `balance`, `totalIn` or `totalOut`.
      "balance": 1,
      "unitValue": 352.8,                 // number | null
      "notes": "…",                       // string | null
      "createdByName": "…"                // string | null
    }
  ]
}
```

One variant's kardex over a period, across school years: where it started, everything that moved it, and where it ended.

## `CloneProductVersion`

```jsonc
{
  "label": "…",        // string | null
  "publisherId": 1,    // number | null
  "notes": "…",        // string | null
  "schoolYearId": 1,   // number | null — Optionally price the clone for a school year straight away.
  "salePrice": 352.8,  // number | null
  "copyPrices": true   // Copy the source version's prices for SchoolYearId instead of using one flat SalePrice.
}
```

Clone a version's variants into a brand-new version — the changeover, where the old cut keeps selling until its stock runs out.

## `SetVersionPriceList`

```jsonc
{
  "schoolYearId": 1,
  "rows": [
    {
      "productVariantId": 1,   // The variant this price is for — a size of the version, a grade, or the version's single axis-less variant.
      "salePrice": 352.8,
      "purchasePrice": 352.8   // number | null
    }
  ],
  "replace": true   // Remove offerings this call did not price.
}
```

One version's prices for one school year: one row per variant, each carrying its own price.

## `CatalogWriteResult`

```jsonc
{
  "id": 1,
  "affected": 1
}
```

## `RollForwardOfferings`

```jsonc
{
  "fromSchoolYearId": 1,
  "toSchoolYearId": 1,
  "increasePercent": 352.8,  // number | null — Raise every copied price by this percentage.
  "increaseAmount": 352.8,   // number | null — Raise every copied price by this flat amount.
  "overwrite": true          // Overwrite prices already set for the target year.
}
```

Copy a version's prices from one school year into another.

## `AddProductVariants`

```jsonc
{
  "sizeIds": [1],   // array | null
  "gradeIds": [1],  // array | null
  "noAxis": true    // True for a variant with neither axis — a tie, a hat, cloth by the metre.
}
```

Give a version several variants at once — a whole size ladder or a whole level's grades.

---

## Endpoints

### 1. `GET /api/garment-genders` — List

**Response** `200` — body is `GarmentGender[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 2. `GET /api/product-stock-movement-types` — List

**Response** `200` — body is `ProductStockMovementType[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 3. `GET /api/product-stock-movements` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |
| `sort` | JSON | React-Admin sorting, a JSON pair: `["name","ASC"]`. |

`filter` accepts **`ProductStockMovementFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `productOfferingId` | `integer` |  |
| `productVariantId` | `integer` |  |
| `productId` | `integer` |  |
| `schoolYearId` | `integer` |  |
| `movementTypeId` | `integer` |  |
| `from` | `"YYYY-MM-DD"` |  |
| `to` | `"YYYY-MM-DD"` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `ProductStockMovement[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 4. `GET /api/product-types` — List

**Response** `200` — body is `ProductType[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 5. `GET /api/products` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |
| `sort` | JSON | React-Admin sorting, a JSON pair: `["name","ASC"]`. |

`filter` accepts **`ProductFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `schoolYearId` | `integer` |  |
| `productTypeId` | `integer` |  |
| `isActive` | `boolean` |  |
| `q` | `string` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `ProductList[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 6. `POST /api/products` — Create

**Request body**

```jsonc
{
  "productTypeId": 1,
  "name": "…",           // string | null
  "garmentGenderId": 1,  // number | null
  "sizeScaleId": 1,      // number | null
  "isActive": true,
  "versions": [
    {
      "id": 1,           // number | null
      "label": "…",      // string | null
      "publisherId": 1,  // number | null
      "notes": "…",      // string | null
      "variants": [
        {
          "id": 1,       // number | null
          "sizeId": 1,   // number | null
          "gradeId": 1,  // number | null
          "offerings": [
            {
              "id": 1,                 // number | null
              "schoolYearId": 1,
              "salePrice": 352.8,
              "purchasePrice": 352.8   // number | null
            }
          ]
        }
      ]
    }
  ]
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

### 7. `GET /api/sizes` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |
| `sort` | JSON | React-Admin sorting, a JSON pair: `["name","ASC"]`. |

`filter` accepts **`SizeFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `sizeScaleId` | `integer` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `Size[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 8. `GET /api/uniform-sets` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |
| `sort` | JSON | React-Admin sorting, a JSON pair: `["name","ASC"]`. |

`filter` accepts **`UniformSetFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `schoolYearId` | `integer` |  |
| `garmentGenderId` | `integer` |  |
| `levelId` | `integer` |  |
| `isActive` | `boolean` |  |
| `q` | `string` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `UniformSetList[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 9. `POST /api/uniform-sets` — Create

**Request body**

```jsonc
{
  "name": "…",           // string | null
  "garmentGenderId": 1,  // number | null
  "levelId": 1,          // number | null
  "isActive": true,
  "items": [
    {
      "id": 1,  // number | null
      "productId": 1,
      "quantity": 1,
      "isOptional": true
    }
  ],
  "offerings": [
    {
      "id": 1,               // number | null
      "schoolYearId": 1,
      "bundlePrice": 352.8   // number | null
    }
  ]
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

### 10. `GET /api/product-stock-movements/:id` — Get one

**Response** `200` — body is `ProductStockMovement`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 11. `GET /api/products/offerings` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |
| `sort` | JSON | React-Admin sorting, a JSON pair: `["name","ASC"]`. |

`filter` accepts **`ProductOfferingFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `schoolYearId` | `integer` |  |
| `productId` | `integer` |  |
| `productVersionId` | `integer` |  |
| `productTypeId` | `integer` |  |
| `sizeId` | `integer` |  |
| `gradeId` | `integer` |  |
| `publisherId` | `integer` |  |
| `garmentGenderId` | `integer` |  |
| `isActive` | `boolean` |  |
| `inStockOnly` | `boolean` |  |
| `lowStockOnly` | `boolean` |  |
| `lowStockThreshold` | `integer` |  |
| `q` | `string` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `ProductOfferingList[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 12. `GET /api/products/:id` — Get one

**Response** `200` — body is `ProductDetail`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 13. `PUT /api/products/:id` — Update

**Request body**

```jsonc
{
  "productTypeId": 1,
  "name": "…",           // string | null
  "garmentGenderId": 1,  // number | null
  "sizeScaleId": 1,      // number | null
  "isActive": true,
  "versions": [
    {
      "id": 1,           // number | null
      "label": "…",      // string | null
      "publisherId": 1,  // number | null
      "notes": "…",      // string | null
      "variants": [
        {
          "id": 1,       // number | null
          "sizeId": 1,   // number | null
          "gradeId": 1,  // number | null
          "offerings": [
            {
              "id": 1,                 // number | null
              "schoolYearId": 1,
              "salePrice": 352.8,
              "purchasePrice": 352.8   // number | null
            }
          ]
        }
      ]
    }
  ]
}
```

**Response** `200` — body is `ProductDetail`

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

### 14. `DELETE /api/products/:id` — Delete

**Response** `200` — body is `CreatedId`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 15. `GET /api/sizes/scales` — List

**Response** `200` — body is `SizeScale[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 16. `GET /api/uniform-sets/:id` — Get one

**Response** `200` — body is `UniformSetDetail`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 17. `PUT /api/uniform-sets/:id` — Update

**Request body**

```jsonc
{
  "name": "…",           // string | null
  "garmentGenderId": 1,  // number | null
  "levelId": 1,          // number | null
  "isActive": true,
  "items": [
    {
      "id": 1,  // number | null
      "productId": 1,
      "quantity": 1,
      "isOptional": true
    }
  ],
  "offerings": [
    {
      "id": 1,               // number | null
      "schoolYearId": 1,
      "bundlePrice": 352.8   // number | null
    }
  ]
}
```

**Response** `200` — body is `UniformSetDetail`

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

### 18. `DELETE /api/uniform-sets/:id` — Delete

**Response** `200` — body is `CreatedId`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 19. `GET /api/products/offerings/:id` — Get one

**Response** `200` — body is `ProductOfferingList`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 20. `DELETE /api/products/variants/:variantId` — Delete

**Response** `200`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 21. `PUT /api/products/versions/:versionId` — Update

**Request body**

```jsonc
{
  "label": "…",      // string | null
  "publisherId": 1,  // number | null
  "notes": "…"       // string | null
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

### 22. `DELETE /api/products/versions/:versionId` — Delete

**Response** `200`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 23. `PUT /api/products/:id/line` — Update

Edit the line's own fields. Its versions are untouched.

**Request body**

```jsonc
{
  "productTypeId": 1,
  "name": "…",           // string | null
  "garmentGenderId": 1,  // number | null
  "sizeScaleId": 1,      // number | null
  "isActive": true
}
```

**Response** `200` — body is `ProductDetail`

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

### 24. `POST /api/products/:id/versions` — Create

**Request body**

```jsonc
{
  "label": "…",      // string | null
  "publisherId": 1,  // number | null
  "notes": "…",      // string | null
  "sizeIds": [1],    // array | null — Optional: create the version's variants in the same call.
  "gradeIds": [1]    // array | null
}
```

**Response** `201` — body is `CreatedId`, plus a `Location` header pointing at the created resource

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

### 25. `GET /api/products/offerings/:id/kardex` — Get

The offering's kardex: opening balance, every movement with its running balance, and the closing balance.

**Query params**

| param | type | notes |
| --- | --- | --- |
| `from` | `string` |  |
| `to` | `string` |  |

**Response** `200` — body is `Kardex`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 26. `POST /api/products/versions/:versionId/clone` — Create

Copy a version's variants into a brand-new version — a redesign.

**Request body**

```jsonc
{
  "label": "…",        // string | null
  "publisherId": 1,    // number | null
  "notes": "…",        // string | null
  "schoolYearId": 1,   // number | null — Optionally price the clone for a school year straight away.
  "salePrice": 352.8,  // number | null
  "copyPrices": true   // Copy the source version's prices for SchoolYearId instead of using one flat SalePrice.
}
```

**Response** `201` — body is `CreatedId`, plus a `Location` header pointing at the created resource

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

### 27. `PUT /api/products/versions/:versionId/price-list` — Update

Price a whole version for one school year, one row per variant.

**Request body**

```jsonc
{
  "schoolYearId": 1,
  "rows": [
    {
      "productVariantId": 1,   // The variant this price is for — a size of the version, a grade, or the version's single axis-less variant.
      "salePrice": 352.8,
      "purchasePrice": 352.8   // number | null
    }
  ],
  "replace": true   // Remove offerings this call did not price.
}
```

**Response** `200` — body is `CatalogWriteResult`

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

### 28. `POST /api/products/versions/:versionId/roll-forward` — Roll Forward

Copy a version's prices into the next school year, optionally raising them.

**Request body**

```jsonc
{
  "fromSchoolYearId": 1,
  "toSchoolYearId": 1,
  "increasePercent": 352.8,  // number | null — Raise every copied price by this percentage.
  "increaseAmount": 352.8,   // number | null — Raise every copied price by this flat amount.
  "overwrite": true          // Overwrite prices already set for the target year.
}
```

**Response** `200` — body is `CatalogWriteResult`

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

### 29. `POST /api/products/versions/:versionId/variants` — Variants

Give a version a whole size ladder, or a level's grades, in one call.

**Request body**

```jsonc
{
  "sizeIds": [1],   // array | null
  "gradeIds": [1],  // array | null
  "noAxis": true    // True for a variant with neither axis — a tie, a hat, cloth by the metre.
}
```

**Response** `200` — body is `CatalogWriteResult`

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
