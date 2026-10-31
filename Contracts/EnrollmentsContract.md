# Enrollments API Contract

Placing a student in a grade, shift and section for a school year.

---

## `EnrollmentSummary`

```jsonc
{
  "id": 1,
  "year": 1,
  "level": "…",    // string | null
  "grade": "…",    // string | null
  "shift": "…",    // string | null
  "section": "…",  // string | null
  "state": "…"     // string | null
}
```

## `EnrollStudent`

```jsonc
{
  "studentId": 1,
  "schoolYearId": 1,
  "levelId": 1,
  "gradeId": 1,
  "shiftId": 1,
  "sectionId": 1,
  "schoolFeeConceptId": 1,
  "previousSchool": "…",        // string | null
  "graceDays": 1,               // Days of grace on the matrícula and cuota de ingreso, 0–2.
  "billEnrollmentMonth": true,  // Whether the pensión of the month the student starts in is billed.
  "documents": [
    {
      "requiredDocumentId": 1,
      "submitted": true
    }
  ]
}
```

## `Enrollment`

```jsonc
{
  "id": 1,
  "code": "…",            // string | null
  "codeNumber": 1,
  "studentId": 1,
  "levelId": 1,
  "gradeId": 1,
  "shiftId": 1,
  "sectionId": 1,
  "schoolFeeConceptId": 1,
  "schoolYearId": 1,
  "previousSchool": "…",  // string | null
  "documents": [
    {
      "requiredDocumentId": 1,
      "submitted": true
    }
  ]
}
```

## `PreviewEnrollment`

```jsonc
{
  "studentId": 1,               // number | null — The student, or null when the student is not registered yet (the new-student form).
  "schoolYearId": 1,
  "levelId": 1,
  "gradeId": 1,
  "shiftId": 1,
  "schoolFeeConceptId": 1,
  "graceDays": 1,               // Days of grace on the matrícula and cuota de ingreso, 0–2.
  "billEnrollmentMonth": true,  // Whether the pensión of the month the student starts in is billed.
  "familiarDocuments": [
    {
      "documentTypeId": 1,
      "idDocumentNumber": "…"   // string | null
    }
  ]
}
```

What the enroll dialog has chosen so far, to show the charges it would raise.

## `EnrollmentPreview`

```jsonc
{
  "charges": [
    {
      "chargeTypeId": 1,        // 1 cuota de ingreso, 2 matrícula, 3 pensión.
      "month": 1,               // number | null — The pensión's month (3–12); null for the other charges.
      "description": "…",       // string | null
      "amount": 352.8,          // Gross, before the discount.
      "discountAmount": 352.8,
      "netAmount": 352.8,       // What the family will owe.
      "discountReason": "…",    // string | null
      "dueDate": "2026-08-19"   // YYYY-MM-DD
    }
  ],
  "warnings": [
    {
      "code": "SIBLING_NOT_FOUND",  // "SIBLING_NOT_FOUND" | "STAFF_PARENT_NOT_FOUND" | "LATE_ENROLLMENT" | "DISCOUNT_UNVERIFIED" — string | null
      "message": "…"                // string | null
    }
  ],
  "eligibility": {
    "condition": "SIBLING",  // "SIBLING" | "STAFF_CHILD" — string | null
    "met": true,             // boolean | null — True when someone qualifies, false when nobody does, null when there was nothing to check against.
    "matches": [
      {
        "personId": 1,
        "fullName": "…"   // string | null
      }
    ]
  },
  "enrollmentDate": "2026-08-19",  // YYYY-MM-DD — The API's today, the day the enrollment would take.
  "enrollmentMonthChoice": 1       // number | null — The month whose pensión staff must decide on; null when there is no choice.
}
```

The charges an enrollment would raise today, and what staff should check first.

## `UpdateEnrollment`

```jsonc
{
  "levelId": 1,
  "gradeId": 1,
  "shiftId": 1,
  "sectionId": 1,
  "schoolFeeConceptId": 1,
  "previousSchool": "…",  // string | null
  "stateName": "…",       // string | null
  "documents": [
    {
      "requiredDocumentId": 1,
      "submitted": true
    }
  ]
}
```

---

## Endpoints

### 1. `GET /api/enrollments` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `sort` | JSON | React-Admin sorting, a JSON pair: `["name","ASC"]`. |

`filter` accepts **`EnrollmentFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `studentId` | `integer` |  |

**Response** `200` — body is `EnrollmentSummary[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 2. `POST /api/enrollments` — Create

**Request body**

```jsonc
{
  "studentId": 1,
  "schoolYearId": 1,
  "levelId": 1,
  "gradeId": 1,
  "shiftId": 1,
  "sectionId": 1,
  "schoolFeeConceptId": 1,
  "previousSchool": "…",        // string | null
  "graceDays": 1,               // Days of grace on the matrícula and cuota de ingreso, 0–2.
  "billEnrollmentMonth": true,  // Whether the pensión of the month the student starts in is billed.
  "documents": [
    {
      "requiredDocumentId": 1,
      "submitted": true
    }
  ]
}
```

**Response** `201` — body is `Enrollment`, plus a `Location` header pointing at the created resource

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 3. `POST /api/enrollments/preview` — Preview

**Request body**

```jsonc
{
  "studentId": 1,               // number | null — The student, or null when the student is not registered yet (the new-student form).
  "schoolYearId": 1,
  "levelId": 1,
  "gradeId": 1,
  "shiftId": 1,
  "schoolFeeConceptId": 1,
  "graceDays": 1,               // Days of grace on the matrícula and cuota de ingreso, 0–2.
  "billEnrollmentMonth": true,  // Whether the pensión of the month the student starts in is billed.
  "familiarDocuments": [
    {
      "documentTypeId": 1,
      "idDocumentNumber": "…"   // string | null
    }
  ]
}
```

**Response** `200` — body is `EnrollmentPreview`

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `409` | The resource is in a state that forbids this operation. |
| `422` | Field-level validation failed. |

---

### 4. `GET /api/enrollments/:id` — Get one

**Response** `200` — body is `Enrollment`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 5. `PUT /api/enrollments/:id` — Update

**Request body**

```jsonc
{
  "levelId": 1,
  "gradeId": 1,
  "shiftId": 1,
  "sectionId": 1,
  "schoolFeeConceptId": 1,
  "previousSchool": "…",  // string | null
  "stateName": "…",       // string | null
  "documents": [
    {
      "requiredDocumentId": 1,
      "submitted": true
    }
  ]
}
```

**Response** `200` — body is `Enrollment`

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

### 6. `DELETE /api/enrollments/:id` — Delete

**Response** `204` — no body

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |
| `409` | The resource is in a state that forbids this operation. |

---

### 7. `GET /api/enrollments/student/:studentId/latest` — Get

**Response** `200` — body is `Enrollment`

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
