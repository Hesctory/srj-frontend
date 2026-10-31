# Enrollment Charges API Contract

The per-enrollment ledger of matrícula and pensión charges and what remains owed.

---

## `EnrollmentCharge`

```jsonc
{
  "id": 1,                        // The <b>charge</b> id.
  "studentId": 1,
  "enrollmentId": 1,
  "schoolYearId": 1,
  "year": 1,                      // `school_year.year` — the calendar year the academic year is <b>named for</b>, not the year in `start_date`.
  "chargeTypeId": 1,
  "chargeTypeName": "…",          // string | null — `charge_types.name`.
  "month": 1,                     // number | null — Academic month.
  "monthName": "…",               // string | null — Derived.
  "amount": 352.8,                // Gross list price, before any discount.
  "discount": 352.8,
  "discountReason": "…",          // string | null
  "netAmount": 352.8,             // `Amount − Discount` — what the student actually owes.
  "description": "…",             // string | null
  "isChargeVoided": true,
  "isFullyWaived": true,          // Derived.
  "obligationId": 1,              // number | null
  "dueDate": "2026-08-19",        // string | null — YYYY-MM-DD
  "effectiveDate": "2026-08-19",  // string | null — YYYY-MM-DD — Legal start.
  "originalAmount": 352.8,        // number | null
  "outstandingAmount": 352.8,     // number | null — Trigger-owned (`recalculate_obligation_status`), never recomputed from allocations.
  "paidAmount": 352.8,            // number | null — Derived.
  "isObligationVoided": true,     // boolean | null
  "accountId": 1,                 // number | null — The PCGE concept account the income books to — 479/480/481 for pensión, matrícula and cuota de ingreso.
  "accountCode": "…",             // string | null
  "accountName": "…",             // string | null
  "statusCode": "…",              // string | null — What `obligations.status_id` actually says today.
  "statusName": "…",              // string | null
  "statusIsTerminal": true,       // boolean | null — `obligation_statuses.is_terminal` — PAID and CANCELLED.
  "effectiveStatusCode": "…",     // string | null — Derived.
  "effectiveStatusName": "…",     // string | null
  "isOverdue": true,              // Derived, mirrors `DObligation.IsOverdue(asOf)`: not terminal, still owing, and past its due date.
  "daysOverdue": 1,
  "isEffective": true,            // Derived, mirrors `DObligation.IsEffective(asOf)`.
  "asOf": "2026-08-19"            // YYYY-MM-DD — The Peru-local date every derived field was computed against.
}
```

One line of a student's account statement: an `enrollment_charges` row and, when it raised one, the obligation it compiled into.

---

## Endpoints

### 1. `GET /api/enrollment-charges` — List

**Query params**

| param | type | notes |
| --- | --- | --- |
| `range` | JSON | React-Admin pagination, a JSON pair of inclusive bounds: `[0,24]`. Omit for the whole list. |
| `filter` | JSON | React-Admin filtering, a JSON object with camelCase keys: `{"schoolYearId":3}`. |
| `sort` | JSON | React-Admin sorting, a JSON pair: `["name","ASC"]`. |

`filter` accepts **`EnrollmentChargeFilter`** — every field optional unless marked:

| field | type | values |
| --- | --- | --- |
| `studentId` | `integer` |  |
| `enrollmentId` | `integer` |  |
| `schoolYearId` | `integer` |  |
| `chargeTypeId` | `integer` |  |
| `month` | `integer` |  |
| `accountId` | `integer` |  |
| `statusCode` | `string[]` |  |
| `onlyOverdue` | `boolean` |  |
| `onlyOutstanding` | `boolean` |  |
| `dueDateFrom` | `"YYYY-MM-DD"` |  |
| `dueDateTo` | `"YYYY-MM-DD"` |  |
| `includeVoided` | `boolean` |  |
| `id` | `integer[]` |  |

**Response** `200` — body is `EnrollmentCharge[]`, plus a `Content-Range` header carrying the total row count

**Errors**

| Status | When |
| --- | --- |
| `400` | Malformed input, or a business rule rejected the request. |
| `401` | No token, or a token that is expired or invalid. |
| `403` | Authenticated, but lacking the required permission. |

---

### 2. `GET /api/enrollment-charges/:id` — Get one

The id is a charge id — the only key present on every row, since a waived charge has no obligation.

**Response** `200` — body is `EnrollmentCharge`

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
