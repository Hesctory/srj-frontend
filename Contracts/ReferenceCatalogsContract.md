# Reference Catalogs API Contract

The read-mostly lookup tables the rest of the API references by id.

---

## `ChildbirthType`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `CivilState`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `Country`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `Department`

```jsonc
{
  "id": 1,
  "name": "…",  // string | null
  "code": "…"   // string | null
}
```

## `District`

```jsonc
{
  "id": 1,
  "name": "…",  // string | null
  "code": "…",  // string | null
  "provinceId": 1,
  "isInEffect": true
}
```

## `DocumentType`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `EthnicSelfIdentification`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `FamiliarRelationshipType`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `Gender`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `Grade`

```jsonc
{
  "id": 1,
  "levelId": 1,
  "name": "…",  // string | null
  "year": 1
}
```

## `CreateGrade`

```jsonc
{
  "levelId": 1,
  "name": "…",  // string | null
  "year": 1
}
```

## `CreatedId`

```jsonc
{
  "id": 1   // Identifier of the newly created resource.
}
```

The body every `POST` returns alongside `201 Created`: the id of the row just written, and nothing else. The client re-reads the resource through the `Location` header.

## `Language`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `LevelOfEducation`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `Level`

```jsonc
{
  "id": 1,
  "name": "…",  // string | null
  "orderIndex": 1
}
```

## `CreateLevel`

```jsonc
{
  "name": "…",  // string | null
  "orderIndex": 1
}
```

## `Province`

```jsonc
{
  "id": 1,
  "name": "…",  // string | null
  "code": "…",  // string | null
  "departmentId": 1
}
```

## `Religion`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `RequiredDocument`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `RucState`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

## `SchoolYear`

```jsonc
{
  "id": 1,
  "year": 1,
  "startDate": "2026-08-19",  // YYYY-MM-DD
  "endDate": "2026-08-19",    // string | null — YYYY-MM-DD
  "isActive": true            // boolean | null
}
```

## `CreateSchoolYear`

```jsonc
{
  "year": 1,
  "startDate": "2026-08-19",  // YYYY-MM-DD
  "endDate": "2026-08-19",    // string | null — YYYY-MM-DD
  "isActive": true            // boolean | null
}
```

## `Section`

```jsonc
{
  "id": 1,
  "section": "…",
  "sectionNumber": 1
}
```

## `Shift`

```jsonc
{
  "id": 1,
  "name": "…"   // string | null
}
```

---

## Endpoints

### 1. `GET /api/childbirth-types` — List

**Response** `200` — body is `ChildbirthType[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 2. `GET /api/civil-states` — List

**Response** `200` — body is `CivilState[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 3. `GET /api/countries` — List

**Response** `200` — body is `Country[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 4. `GET /api/departments` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`DepartmentFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `name` | `string` |  |

**Response** `200` — body is `Department[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |

---

### 5. `GET /api/districts` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`DistrictFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `provinceId` | `integer` |  |
| `isInEffect` | `boolean` |  |

**Response** `200` — body is `District[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |

---

### 6. `GET /api/document-types` — List

**Response** `200` — body is `DocumentType[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 7. `GET /api/ethnic-self-identifications` — List

**Response** `200` — body is `EthnicSelfIdentification[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 8. `GET /api/familiar-relationship-types` — List

**Response** `200` — body is `FamiliarRelationshipType[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 9. `GET /api/genders` — List

**Response** `200` — body is `Gender[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 10. `GET /api/grades` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`GradeFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `levelId` | `integer` |  |
| `name` | `string` |  |
| `year` | `integer` |  |
| `schoolYearId` | `integer` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `Grade[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 11. `POST /api/grades` — Create

**Request body**

```jsonc
{
  "levelId": 1,
  "name": "…",  // string | null
  "year": 1
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

### 12. `GET /api/languages` — List

**Response** `200` — body is `Language[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 13. `GET /api/level-of-educations` — List

**Response** `200` — body is `LevelOfEducation[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 14. `GET /api/levels` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`LevelFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `id` | `integer[]` |  |

**Response** `200` — body is `Level[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 15. `POST /api/levels` — Create

**Request body**

```jsonc
{
  "name": "…",  // string | null
  "orderIndex": 1
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

### 16. `GET /api/provinces` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`ProvinceFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `departmentId` | `integer` |  |

**Response** `200` — body is `Province[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |

---

### 17. `GET /api/religions` — List

**Response** `200` — body is `Religion[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 18. `GET /api/required-documents` — List

**Response** `200` — body is `RequiredDocument[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 19. `GET /api/ruc-states` — List

**Response** `200` — body is `RucState[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |

---

### 20. `GET /api/school-years` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`SchoolYearFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `year` | `integer` |  |
| `isActive` | `boolean` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `SchoolYear[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 21. `POST /api/school-years` — Create

**Request body**

```jsonc
{
  "year": 1,
  "startDate": "2026-08-19",  // YYYY-MM-DD
  "endDate": "2026-08-19",    // string | null — YYYY-MM-DD
  "isActive": true            // boolean | null
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

### 22. `GET /api/sections` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`SectionFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `schoolYearId` | `integer` |  |
| `levelId` | `integer` |  |
| `gradeId` | `integer` |  |
| `shiftId` | `integer` |  |

**Response** `200` — body is `Section[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 23. `GET /api/shifts` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`ShiftFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `schoolYearId` | `integer` |  |
| `gradeId` | `integer` |  |

**Response** `200` — body is `Shift[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 24. `GET /api/grades/:id` — Get one

**Response** `200` — body is `Grade`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 25. `PUT /api/grades/:id` — Update

**Request body**

```jsonc
{
  "levelId": 1,
  "name": "…",  // string | null
  "year": 1
}
```

**Response** `200` — body is `Grade`

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

### 26. `DELETE /api/grades/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 27. `GET /api/levels/:id` — Get one

**Response** `200` — body is `Level`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 28. `PUT /api/levels/:id` — Update

**Request body**

```jsonc
{
  "name": "…",  // string | null
  "orderIndex": 1
}
```

**Response** `200` — body is `Level`

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

### 29. `DELETE /api/levels/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 30. `GET /api/school-years/:id` — Get one

**Response** `200` — body is `SchoolYear`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 31. `PUT /api/school-years/:id` — Update

**Request body**

```jsonc
{
  "year": 1,
  "startDate": "2026-08-19",  // YYYY-MM-DD
  "endDate": "2026-08-19",    // string | null — YYYY-MM-DD
  "isActive": true            // boolean | null
}
```

**Response** `200` — body is `SchoolYear`

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

### 32. `DELETE /api/school-years/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 33. `GET /api/shifts/:id` — Get one

**Response** `200` — body is `Shift`

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
