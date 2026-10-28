# Configurable Catalogs API Contract

The lookup tables an administrator maintains from a form, each a plain CRUD resource.

---

## `Account`

```jsonc
{
  "id": 1,
  "code": "…",           // string | null
  "name": "…",           // string | null
  "parentAccountId": 1,  // number | null
  "printCode": "…"       // string | null
}
```

## `CreateAccount`

```jsonc
{
  "code": "…",           // string | null
  "name": "…",           // string | null
  "parentAccountId": 1,  // number | null
  "printCode": "…"       // string | null
}
```

## `CreatedId`

```jsonc
{
  "id": 1   // Identifier of the newly created resource.
}
```

The body every `POST` returns alongside `201 Created`: the id of the row just written, and nothing else. The client re-reads the resource through the `Location` header.

## `GradeOffering`

```jsonc
{
  "id": 1,
  "gradeId": 1,
  "schoolYearId": 1,
  "shiftId": 1,
  "sections": 1   // number | null
}
```

## `CreateGradeOffering`

```jsonc
{
  "gradeId": 1,
  "schoolYearId": 1,
  "shiftId": 1,
  "sections": 1
}
```

## `Institution`

```jsonc
{
  "id": 1,
  "name": "…",  // string | null
  "ruc": "…",   // string | null
  "rucStateId": 1
}
```

## `CreateInstitution`

```jsonc
{
  "name": "…",  // string | null
  "ruc": "…",   // string | null
  "rucStateId": 1
}
```

## `JobPosition`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `CreateJobPosition`

```jsonc
{
  "name": "…"   // string | null
}
```

## `Provider`

```jsonc
{
  "id": 1,
  "ruc": "…",           // string | null
  "businessName": "…",  // string | null
  "isActive": true
}
```

## `CreateProvider`

```jsonc
{
  "ruc": "…",           // string | null
  "businessName": "…",  // string | null
  "isActive": true
}
```

## `Publisher`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `CreatePublisher`

```jsonc
{
  "name": "…"   // string | null
}
```

## `SchoolFeeConcept`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `CreateSchoolFeeConcept`

```jsonc
{
  "name": "…"   // string | null
}
```

## `SchoolFee`

```jsonc
{
  "id": 1,
  "schoolYearId": 1,
  "schoolYear": 1,              // The calendar year, e.g. 2027.
  "levelId": 1,
  "levelName": "…",             // string | null
  "shiftId": 1,
  "shiftName": "…",             // string | null
  "schoolFeeConceptId": 1,
  "schoolFeeConceptName": "…",  // string | null
  "enrollmentPrice": 352.8,     // The matrícula.
  "tuitionCost": 352.8,         // The monthly pensión.
  "registrationFee": 352.8,     // The cuota de ingreso.
  "description": "…"            // string | null
}
```

## `SaveSchoolFee`

```jsonc
{
  "schoolYearId": 1,
  "levelId": 1,
  "shiftId": 1,
  "schoolFeeConceptId": 1,
  "enrollmentPrice": 352.8,  // The matrícula.
  "tuitionCost": 352.8,      // The monthly pensión.
  "registrationFee": 352.8,  // The cuota de ingreso.
  "description": "…"         // string | null
}
```

The prices for one year, level, shift and fee concept.

## `VoucherSeries`

```jsonc
{
  "id": 1,
  "voucherType": "…",  // string | null
  "institutionId": 1,
  "series": "…"        // string | null
}
```

## `CreateVoucherSeries`

```jsonc
{
  "voucherType": "…",  // string | null
  "institutionId": 1,
  "series": "…"        // string | null
}
```

## `WorkArea`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `CreateWorkArea`

```jsonc
{
  "name": "…"   // string | null
}
```

---

## Endpoints

### 1. `GET /api/accounting-plan` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`AccountFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `parentAccountId` | `string` |  |
| `code` | `string` |  |
| `name` | `string` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `Account[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 2. `POST /api/accounting-plan` — Create

**Request body**

```jsonc
{
  "code": "…",           // string | null
  "name": "…",           // string | null
  "parentAccountId": 1,  // number | null
  "printCode": "…"       // string | null
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

### 3. `GET /api/grade-offerings` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`GradeOfferingFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `gradeId` | `integer` |  |
| `schoolYearId` | `integer` |  |
| `shiftId` | `integer` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `GradeOffering[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 4. `POST /api/grade-offerings` — Create

**Request body**

```jsonc
{
  "gradeId": 1,
  "schoolYearId": 1,
  "shiftId": 1,
  "sections": 1
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

### 5. `GET /api/institutions` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`InstitutionFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `id` | `integer[]` |  |

**Response** `200` — body is `Institution[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 6. `POST /api/institutions` — Create

**Request body**

```jsonc
{
  "name": "…",  // string | null
  "ruc": "…",   // string | null
  "rucStateId": 1
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

### 7. `GET /api/job-positions` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`JobPositionFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `name` | `string` |  |

**Response** `200` — body is `JobPosition[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 8. `POST /api/job-positions` — Create

**Request body**

```jsonc
{
  "name": "…"   // string | null
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

### 9. `GET /api/providers` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`ProviderFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `id` | `integer[]` |  |
| `q` | `string` |  |
| `isActive` | `boolean` |  |

**Response** `200` — body is `Provider[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 10. `POST /api/providers` — Create

**Request body**

```jsonc
{
  "ruc": "…",           // string | null
  "businessName": "…",  // string | null
  "isActive": true
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

### 11. `GET /api/publishers` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`PublisherFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `id` | `integer[]` |  |
| `name` | `string` |  |

**Response** `200` — body is `Publisher[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 12. `POST /api/publishers` — Create

**Request body**

```jsonc
{
  "name": "…"   // string | null
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

### 13. `GET /api/school-fee-concepts` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`SchoolFeeConceptFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `id` | `integer[]` |  |

**Response** `200` — body is `SchoolFeeConcept[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 14. `POST /api/school-fee-concepts` — Create

**Request body**

```jsonc
{
  "name": "…"   // string | null
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

### 15. `GET /api/school-fees` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`SchoolFeeFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `schoolYearId` | `integer` |  |
| `levelId` | `integer` |  |
| `shiftId` | `integer` |  |
| `schoolFeeConceptId` | `integer` |  |

**Response** `200` — body is `SchoolFee[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 16. `POST /api/school-fees` — Create

**Request body**

```jsonc
{
  "schoolYearId": 1,
  "levelId": 1,
  "shiftId": 1,
  "schoolFeeConceptId": 1,
  "enrollmentPrice": 352.8,  // The matrícula.
  "tuitionCost": 352.8,      // The monthly pensión.
  "registrationFee": 352.8,  // The cuota de ingreso.
  "description": "…"         // string | null
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

### 17. `GET /api/voucher-series` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`VoucherSeriesFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `id` | `integer[]` |  |

**Response** `200` — body is `VoucherSeries[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 18. `POST /api/voucher-series` — Create

**Request body**

```jsonc
{
  "voucherType": "…",  // string | null
  "institutionId": 1,
  "series": "…"        // string | null
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

### 19. `GET /api/work-areas` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`WorkAreaFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `name` | `string` |  |

**Response** `200` — body is `WorkArea[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 20. `POST /api/work-areas` — Create

**Request body**

```jsonc
{
  "name": "…"   // string | null
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

### 21. `GET /api/accounting-plan/:id` — Get one

**Response** `200` — body is `Account`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 22. `PUT /api/accounting-plan/:id` — Update

**Request body**

```jsonc
{
  "code": "…",           // string | null
  "name": "…",           // string | null
  "parentAccountId": 1,  // number | null
  "printCode": "…"       // string | null
}
```

**Response** `200` — body is `Account`

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

### 23. `DELETE /api/accounting-plan/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 24. `GET /api/grade-offerings/:id` — Get one

**Response** `200` — body is `GradeOffering`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 25. `PUT /api/grade-offerings/:id` — Update

**Request body**

```jsonc
{
  "gradeId": 1,
  "schoolYearId": 1,
  "shiftId": 1,
  "sections": 1
}
```

**Response** `200` — body is `GradeOffering`

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

### 26. `DELETE /api/grade-offerings/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 27. `GET /api/institutions/:id` — Get one

**Response** `200` — body is `Institution`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 28. `PUT /api/institutions/:id` — Update

**Request body**

```jsonc
{
  "name": "…",  // string | null
  "ruc": "…",   // string | null
  "rucStateId": 1
}
```

**Response** `200` — body is `Institution`

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

### 29. `DELETE /api/institutions/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 30. `GET /api/job-positions/:id` — Get one

**Response** `200` — body is `JobPosition`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 31. `PUT /api/job-positions/:id` — Update

**Request body**

```jsonc
{
  "name": "…"   // string | null
}
```

**Response** `200` — body is `JobPosition`

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

### 32. `DELETE /api/job-positions/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 33. `GET /api/providers/:id` — Get one

**Response** `200` — body is `Provider`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 34. `PUT /api/providers/:id` — Update

**Request body**

```jsonc
{
  "ruc": "…",           // string | null
  "businessName": "…",  // string | null
  "isActive": true
}
```

**Response** `200` — body is `Provider`

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

### 35. `DELETE /api/providers/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 36. `GET /api/publishers/:id` — Get one

**Response** `200` — body is `Publisher`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 37. `PUT /api/publishers/:id` — Update

**Request body**

```jsonc
{
  "name": "…"   // string | null
}
```

**Response** `200` — body is `Publisher`

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

### 38. `DELETE /api/publishers/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 39. `GET /api/school-fee-concepts/:id` — Get one

**Response** `200` — body is `SchoolFeeConcept`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 40. `PUT /api/school-fee-concepts/:id` — Update

**Request body**

```jsonc
{
  "name": "…"   // string | null
}
```

**Response** `200` — body is `SchoolFeeConcept`

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

### 41. `DELETE /api/school-fee-concepts/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 42. `GET /api/school-fees/:id` — Get one

**Response** `200` — body is `SchoolFee`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 43. `PUT /api/school-fees/:id` — Update

**Request body**

```jsonc
{
  "schoolYearId": 1,
  "levelId": 1,
  "shiftId": 1,
  "schoolFeeConceptId": 1,
  "enrollmentPrice": 352.8,  // The matrícula.
  "tuitionCost": 352.8,      // The monthly pensión.
  "registrationFee": 352.8,  // The cuota de ingreso.
  "description": "…"         // string | null
}
```

**Response** `200` — body is `SchoolFee`

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

### 44. `GET /api/voucher-series/:id` — Get one

**Response** `200` — body is `VoucherSeries`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 45. `PUT /api/voucher-series/:id` — Update

**Request body**

```jsonc
{
  "voucherType": "…",  // string | null
  "institutionId": 1,
  "series": "…"        // string | null
}
```

**Response** `200` — body is `VoucherSeries`

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

### 46. `DELETE /api/voucher-series/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 47. `GET /api/work-areas/:id` — Get one

**Response** `200` — body is `WorkArea`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 48. `PUT /api/work-areas/:id` — Update

**Request body**

```jsonc
{
  "name": "…"   // string | null
}
```

**Response** `200` — body is `WorkArea`

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

### 49. `DELETE /api/work-areas/:id` — Delete

**Response** `204` — no body

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
