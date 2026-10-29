# Students API Contract

The student record and its family, health, schooling and document sections.

---

## `StudentList`

```jsonc
{
  "id": 1,
  "fullName": "…",        // string | null
  "dni": "…",             // string | null
  "enrollmentCode": "…",  // string | null
  "level": "…",           // string | null
  "grade": "…",           // string | null
  "shift": "…",           // string | null
  "section": "…"          // string | null
}
```

## `CreateStudent`

```jsonc
{
  "names": "…",                     // string | null
  "paternalLastname": "…",          // string | null
  "maternalLastname": "…",          // string | null
  "genderId": 1,
  "birthDate": "2026-08-19",        // YYYY-MM-DD
  "documentTypeId": 1,
  "idDocumentNumber": "…",          // string | null
  "religionId": 1,                  // number | null
  "civilStateId": 1,                // number | null
  "address": "…",                   // string | null
  "addressLocation": {
    "departmentId": 1,
    "provinceId": 1,
    "districtId": 1
  },
  "email": "…",                     // string | null
  "landlinePhone": "…",             // string | null
  "cellPhone": "…",                 // string | null
  "countryOfBirthId": 1,            // number | null
  "nativeLanguageId": 1,
  "ethnicSelfIdentificationId": 1,  // number | null
  "secondLanguageIds": [1],         // array | null
  "birthLocation": {
    "departmentId": 1,
    "provinceId": 1,
    "districtId": 1
  },
  "hasElectronicDevices": true,
  "hasInternetAccess": true,
  "hasDisability": true,
  "siblings": 1,                    // number | null
  "childbirthTypeId": 1,            // number | null
  "hasBirthComplications": true,
  "birthOrder": 1,
  "familiars": [
    {
      "names": "…",                     // string | null
      "paternalLastname": "…",          // string | null
      "maternalLastname": "…",          // string | null
      "genderId": 1,
      "birthDate": "2026-08-19",        // YYYY-MM-DD
      "documentTypeId": 1,
      "idDocumentNumber": "…",          // string | null
      "religionId": 1,                  // number | null
      "civilStateId": 1,                // number | null
      "address": "…",                   // string | null
      "addressLocation": {
        "departmentId": 1,
        "provinceId": 1,
        "districtId": 1
      },
      "email": "…",                     // string | null
      "landlinePhone": "…",             // string | null
      "cellPhone": "…",                 // string | null
      "countryOfBirthId": 1,            // number | null
      "nativeLanguageId": 1,
      "ethnicSelfIdentificationId": 1,  // number | null
      "secondLanguageIds": [1],         // array | null
      "levelOfEducationId": 1,          // number | null
      "occupation": "…",                // string | null
      "workCenter": "…",                // string | null
      "lives": true,
      "livesWithStudent": true,
      "relationshipId": 1,
      "isGuardian": true
    }
  ],
  "enrollment": {
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
}
```

## `CreatedId`

```jsonc
{
  "id": 1   // Identifier of the newly created resource.
}
```

The body every `POST` returns alongside `201 Created`: the id of the row just written, and nothing else. The client re-reads the resource through the `Location` header.

## `StudentDetail`

```jsonc
{
  "id": 1,
  "names": "…",                     // string | null
  "paternalLastname": "…",          // string | null
  "maternalLastname": "…",          // string | null
  "fullName": "…",                  // string | null
  "genderId": 1,                    // number | null
  "birthDate": "2026-08-19",        // string | null — YYYY-MM-DD
  "documentTypeId": 1,              // number | null
  "idDocumentNumber": "…",          // string | null
  "address": "…",                   // string | null
  "addressUbigeoId": 1,             // number | null
  "religionId": 1,                  // number | null
  "civilStateId": 1,                // number | null
  "email": "…",                     // string | null
  "landlinePhone": "…",             // string | null
  "cellPhone": "…",                 // string | null
  "nativeLanguageId": 1,            // number | null
  "ethnicSelfIdentificationId": 1,  // number | null
  "secondLanguageIds": [1],         // array | null
  "hasElectronicDevices": true,
  "hasInternetAccess": true,
  "birthLocation": {
    "departmentId": 1,
    "provinceId": 1,
    "districtId": 1
  },
  "addressLocation": {
    "departmentId": 1,
    "provinceId": 1,
    "districtId": 1
  },
  "hasDisability": true,
  "siblings": 1,                    // number | null
  "childbirthTypeId": 1,            // number | null
  "hasBirthComplications": true,
  "birthOrder": 1,
  "countryOfBirthId": 1,            // number | null
  "familiars": [
    {
      "id": 1,
      "names": "…",                     // string | null
      "paternalLastname": "…",          // string | null
      "maternalLastname": "…",          // string | null
      "fullName": "…",                  // string | null
      "genderId": 1,                    // number | null
      "birthDate": "2026-08-19",        // string | null — YYYY-MM-DD
      "documentTypeId": 1,              // number | null
      "idDocumentNumber": "…",          // string | null
      "address": "…",                   // string | null
      "addressUbigeoId": 1,             // number | null
      "religionId": 1,                  // number | null
      "civilStateId": 1,                // number | null
      "email": "…",                     // string | null
      "landlinePhone": "…",             // string | null
      "cellPhone": "…",                 // string | null
      "nativeLanguageId": 1,            // number | null
      "ethnicSelfIdentificationId": 1,  // number | null
      "secondLanguageIds": [1],         // array | null
      "levelOfEducationId": 1,          // number | null
      "occupation": "…",                // string | null
      "workCenter": "…",                // string | null
      "addressLocation": {
        "departmentId": 1,
        "provinceId": 1,
        "districtId": 1
      },
      "lives": true,
      "livesWithStudent": true,
      "relationshipId": 1,
      "isGuardian": true,
      "countryOfBirthId": 1             // number | null
    }
  ]
}
```

## `UpdateStudent`

```jsonc
{
  "names": "…",                     // string | null
  "paternalLastname": "…",          // string | null
  "maternalLastname": "…",          // string | null
  "genderId": 1,
  "birthDate": "2026-08-19",        // YYYY-MM-DD
  "documentTypeId": 1,
  "idDocumentNumber": "…",          // string | null
  "religionId": 1,                  // number | null
  "civilStateId": 1,                // number | null
  "address": "…",                   // string | null
  "addressLocation": {
    "departmentId": 1,
    "provinceId": 1,
    "districtId": 1
  },
  "email": "…",                     // string | null
  "landlinePhone": "…",             // string | null
  "cellPhone": "…",                 // string | null
  "countryOfBirthId": 1,            // number | null
  "nativeLanguageId": 1,
  "ethnicSelfIdentificationId": 1,  // number | null
  "secondLanguageIds": [1],         // array | null
  "birthLocation": {
    "departmentId": 1,
    "provinceId": 1,
    "districtId": 1
  },
  "hasElectronicDevices": true,
  "hasInternetAccess": true,
  "hasDisability": true,
  "siblings": 1,                    // number | null
  "childbirthTypeId": 1,            // number | null
  "hasBirthComplications": true,
  "birthOrder": 1,
  "familiars": [
    {
      "names": "…",                     // string | null
      "paternalLastname": "…",          // string | null
      "maternalLastname": "…",          // string | null
      "genderId": 1,
      "birthDate": "2026-08-19",        // YYYY-MM-DD
      "documentTypeId": 1,
      "idDocumentNumber": "…",          // string | null
      "religionId": 1,                  // number | null
      "civilStateId": 1,                // number | null
      "address": "…",                   // string | null
      "addressLocation": {
        "departmentId": 1,
        "provinceId": 1,
        "districtId": 1
      },
      "email": "…",                     // string | null
      "landlinePhone": "…",             // string | null
      "cellPhone": "…",                 // string | null
      "countryOfBirthId": 1,            // number | null
      "nativeLanguageId": 1,
      "ethnicSelfIdentificationId": 1,  // number | null
      "secondLanguageIds": [1],         // array | null
      "levelOfEducationId": 1,          // number | null
      "occupation": "…",                // string | null
      "workCenter": "…",                // string | null
      "lives": true,
      "livesWithStudent": true,
      "relationshipId": 1,
      "isGuardian": true
    }
  ]
}
```

---

## Endpoints

### 1. `GET /api/students` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |

`filter` accepts **`StudentFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `schoolYearId` | `integer` |  |
| `fullName` | `string` |  |
| `dni` | `string` |  |
| `levelId` | `integer` |  |
| `gradeId` | `integer` |  |
| `shiftId` | `integer` |  |
| `sectionId` | `integer` |  |

**Response** `200` — body is `StudentList[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 2. `POST /api/students` — Create

**Request body**

```jsonc
{
  "names": "…",                     // string | null
  "paternalLastname": "…",          // string | null
  "maternalLastname": "…",          // string | null
  "genderId": 1,
  "birthDate": "2026-08-19",        // YYYY-MM-DD
  "documentTypeId": 1,
  "idDocumentNumber": "…",          // string | null
  "religionId": 1,                  // number | null
  "civilStateId": 1,                // number | null
  "address": "…",                   // string | null
  "addressLocation": {
    "departmentId": 1,
    "provinceId": 1,
    "districtId": 1
  },
  "email": "…",                     // string | null
  "landlinePhone": "…",             // string | null
  "cellPhone": "…",                 // string | null
  "countryOfBirthId": 1,            // number | null
  "nativeLanguageId": 1,
  "ethnicSelfIdentificationId": 1,  // number | null
  "secondLanguageIds": [1],         // array | null
  "birthLocation": {
    "departmentId": 1,
    "provinceId": 1,
    "districtId": 1
  },
  "hasElectronicDevices": true,
  "hasInternetAccess": true,
  "hasDisability": true,
  "siblings": 1,                    // number | null
  "childbirthTypeId": 1,            // number | null
  "hasBirthComplications": true,
  "birthOrder": 1,
  "familiars": [
    {
      "names": "…",                     // string | null
      "paternalLastname": "…",          // string | null
      "maternalLastname": "…",          // string | null
      "genderId": 1,
      "birthDate": "2026-08-19",        // YYYY-MM-DD
      "documentTypeId": 1,
      "idDocumentNumber": "…",          // string | null
      "religionId": 1,                  // number | null
      "civilStateId": 1,                // number | null
      "address": "…",                   // string | null
      "addressLocation": {
        "departmentId": 1,
        "provinceId": 1,
        "districtId": 1
      },
      "email": "…",                     // string | null
      "landlinePhone": "…",             // string | null
      "cellPhone": "…",                 // string | null
      "countryOfBirthId": 1,            // number | null
      "nativeLanguageId": 1,
      "ethnicSelfIdentificationId": 1,  // number | null
      "secondLanguageIds": [1],         // array | null
      "levelOfEducationId": 1,          // number | null
      "occupation": "…",                // string | null
      "workCenter": "…",                // string | null
      "lives": true,
      "livesWithStudent": true,
      "relationshipId": 1,
      "isGuardian": true
    }
  ],
  "enrollment": {
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

### 3. `GET /api/students/:id` — Get one

**Response** `200` — body is `StudentDetail`

**Errors**

| Status | When |
| --- | --- |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |
| `404` | No such resource. |

---

### 4. `PUT /api/students/:id` — Update

**Request body**

```jsonc
{
  "names": "…",                     // string | null
  "paternalLastname": "…",          // string | null
  "maternalLastname": "…",          // string | null
  "genderId": 1,
  "birthDate": "2026-08-19",        // YYYY-MM-DD
  "documentTypeId": 1,
  "idDocumentNumber": "…",          // string | null
  "religionId": 1,                  // number | null
  "civilStateId": 1,                // number | null
  "address": "…",                   // string | null
  "addressLocation": {
    "departmentId": 1,
    "provinceId": 1,
    "districtId": 1
  },
  "email": "…",                     // string | null
  "landlinePhone": "…",             // string | null
  "cellPhone": "…",                 // string | null
  "countryOfBirthId": 1,            // number | null
  "nativeLanguageId": 1,
  "ethnicSelfIdentificationId": 1,  // number | null
  "secondLanguageIds": [1],         // array | null
  "birthLocation": {
    "departmentId": 1,
    "provinceId": 1,
    "districtId": 1
  },
  "hasElectronicDevices": true,
  "hasInternetAccess": true,
  "hasDisability": true,
  "siblings": 1,                    // number | null
  "childbirthTypeId": 1,            // number | null
  "hasBirthComplications": true,
  "birthOrder": 1,
  "familiars": [
    {
      "names": "…",                     // string | null
      "paternalLastname": "…",          // string | null
      "maternalLastname": "…",          // string | null
      "genderId": 1,
      "birthDate": "2026-08-19",        // YYYY-MM-DD
      "documentTypeId": 1,
      "idDocumentNumber": "…",          // string | null
      "religionId": 1,                  // number | null
      "civilStateId": 1,                // number | null
      "address": "…",                   // string | null
      "addressLocation": {
        "departmentId": 1,
        "provinceId": 1,
        "districtId": 1
      },
      "email": "…",                     // string | null
      "landlinePhone": "…",             // string | null
      "cellPhone": "…",                 // string | null
      "countryOfBirthId": 1,            // number | null
      "nativeLanguageId": 1,
      "ethnicSelfIdentificationId": 1,  // number | null
      "secondLanguageIds": [1],         // array | null
      "levelOfEducationId": 1,          // number | null
      "occupation": "…",                // string | null
      "workCenter": "…",                // string | null
      "lives": true,
      "livesWithStudent": true,
      "relationshipId": 1,
      "isGuardian": true
    }
  ]
}
```

**Response** `200` — body is `StudentDetail`

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

### 5. `DELETE /api/students/:id` — Delete

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
