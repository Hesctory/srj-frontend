import simpleRestProvider from "ra-data-simple-rest";
import {
  fetchUtils,
  DataProvider,
  type GetOneResult,
  type Identifier,
  type UpdateResult,
} from "react-admin";
import type {
  PaymentDocumentDetail,
  PaymentDocumentRecord,
} from "@/types/payment-document";
import type {
  AddProductVariants,
  CatalogWriteResult,
  CloneProductVersion,
  CreatedId,
  CreateProductVersion,
  Kardex,
  RollForwardOfferings,
  SetVersionPriceList,
  UpdateProductLine,
  UpdateProductVersion,
} from "@/types/product";
import type {
  ConfirmPaymentResponse,
  PaymentPreviewRequest,
  PaymentPreviewResponse,
} from "@/types/payment";
import type {
  EnrollmentChangePreview,
  EnrollmentChangePreviewRequest,
  EnrollmentPreview,
  EnrollmentWithdrawalPreview,
  PreviewEnrollment,
} from "@/types/enrollment";

// VITE_API_URL (in .env.local) points the app at another backend, e.g. an
// agent's own instance running next to yours on a different port.
export const API_URL: string =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Cliente HTTP personalizado para agregar JWT
const httpClient = (url: string, options: fetchUtils.Options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: "application/json" });
  }

  const token = localStorage.getItem("token");

  if (token) {
    (options.headers as Headers).set("Authorization", `Bearer ${token}`);
  }

  return fetchUtils.fetchJson(url, options);
};

// --- Base provider ----------------------------------------------------------
// Plain REST CRUD against the backend; the app extensions below wrap it.
const baseProvider: DataProvider = simpleRestProvider(API_URL, httpClient);

// --- Report read endpoints --------------------------------------------------
// Map of report-only resources to their backend URL builders.
// Each entry receives the filter object and returns the full URL.
// Add a new entry here whenever a new report endpoint is needed.
const REPORT_ENDPOINTS: Record<
  string,
  (filter: Record<string, string>) => string
> = {
  "students-enrolled-report": (filter) => {
    const q = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    return `${API_URL}/students/report?${q.toString()}`;
  },
  "students-registration-card-report": (filter) => {
    const q = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    return `${API_URL}/students/registration-card?${q.toString()}`;
  },
  "students-birthdays-report": (filter) => {
    const q = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    return `${API_URL}/students/birthdays?${q.toString()}`;
  },
  "students-withdrawn-report": (filter) => {
    const q = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    return `${API_URL}/students/withdrawn?${q.toString()}`;
  },
  "students-submitted-documents-report": (filter) => {
    const q = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    return `${API_URL}/students/submitted-documents?${q.toString()}`;
  },
};

// --- Report file exports ----------------------------------------------------
// Base URLs for the backend file-export endpoints. Each report exposes an
// `.../export?format=pdf|xlsx` sibling of its JSON endpoint. Add a new entry
// here whenever a report needs backend-generated files.
const REPORT_EXPORT_BASES = {
  enrolled: `${API_URL}/students/report`,
  birthdays: `${API_URL}/students/birthdays`,
  withdrawn: `${API_URL}/students/withdrawn`,
  registrationCard: `${API_URL}/students/registration-card`,
  submittedDocuments: `${API_URL}/students/submitted-documents`,
} as const;

export type ReportExportKey = keyof typeof REPORT_EXPORT_BASES;

export type ExportReportParams = {
  report: ReportExportKey;
  format: "pdf" | "xlsx";
  filter: Record<string, unknown>;
};

// Custom dataProvider method for binary file downloads. `httpClient`
// (fetchUtils.fetchJson) JSON-parses every response and can't read a Blob, so
// this uses a raw fetch. Returns `{ data: null }` on 204 (no rows) so callers
// can surface an empty-state notice instead of downloading a blank file.
const exportReport = async ({
  report,
  format,
  filter,
}: ExportReportParams): Promise<{ data: Blob | null }> => {
  const q = new URLSearchParams({ format });
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });

  const token = localStorage.getItem("token");
  const res = await fetch(`${REPORT_EXPORT_BASES[report]}/export?${q}`, {
    headers: {
      Accept:
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 204) return { data: null };
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return { data: await res.blob() };
};

// --- Resources whose GET /{id} is not the record itself ---------------------
// `GET /api/payment-documents/{id}` answers `{ document, lines }`, not a bare
// record. React Admin needs something with an `id` at the top level, so the
// document is lifted and its lines ride along as a field. Everything else
// about the resource (list, filters, Content-Range) is plain simple-rest.
const flattenPaymentDocument = (json: unknown) => {
  const detail = json as Partial<PaymentDocumentDetail> | null;
  return detail?.document
    ? { ...detail.document, lines: detail.lines ?? [] }
    : (json as PaymentDocumentRecord);
};

// --- Product catalog --------------------------------------------------------
// `PUT /api/products/:id` replaces the whole tree and deletes any child absent
// from the payload — versions carry sales history, so RA's `update` is routed
// to `PUT /api/products/:id/line`, which touches only the line's own fields.
// Everything below the line is edited node by node through the methods below.
const PRODUCT_LINE_FIELDS = [
  "productTypeId",
  "name",
  "garmentGenderId",
  "sizeScaleId",
  "isActive",
] as const;

const pickProductLine = (data: Record<string, unknown>): UpdateProductLine =>
  Object.fromEntries(
    PRODUCT_LINE_FIELDS.map((field) => [field, data[field] ?? null]),
  ) as UpdateProductLine;

const sendJson = async <T>(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> => {
  const { json } = await httpClient(`${API_URL}${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return json as T;
};

const catalog = {
  createProductVersion: (productId: Identifier, body: CreateProductVersion) =>
    sendJson<CreatedId>("POST", `/products/${productId}/versions`, body),
  updateProductVersion: (versionId: Identifier, body: UpdateProductVersion) =>
    sendJson<void>("PUT", `/products/versions/${versionId}`, body),
  deleteProductVersion: (versionId: Identifier) =>
    sendJson<void>("DELETE", `/products/versions/${versionId}`),
  cloneProductVersion: (versionId: Identifier, body: CloneProductVersion) =>
    sendJson<CreatedId>("POST", `/products/versions/${versionId}/clone`, body),
  addProductVariants: (versionId: Identifier, body: AddProductVariants) =>
    sendJson<CatalogWriteResult>(
      "POST",
      `/products/versions/${versionId}/variants`,
      body,
    ),
  setVersionPriceList: (versionId: Identifier, body: SetVersionPriceList) =>
    sendJson<CatalogWriteResult>(
      "PUT",
      `/products/versions/${versionId}/price-list`,
      body,
    ),
  rollForwardOfferings: (versionId: Identifier, body: RollForwardOfferings) =>
    sendJson<CatalogWriteResult>(
      "POST",
      `/products/versions/${versionId}/roll-forward`,
      body,
    ),
  /** Omitting both bounds asks for the whole ledger. */
  getKardex: async (
    offeringId: Identifier,
    range: { from?: string; to?: string } = {},
  ): Promise<Kardex> => {
    const q = new URLSearchParams();
    if (range.from) q.set("from", range.from);
    if (range.to) q.set("to", range.to);
    const suffix = q.toString() ? `?${q}` : "";
    const { json } = await httpClient(
      `${API_URL}/products/offerings/${offeringId}/kardex${suffix}`,
    );
    return json as Kardex;
  },
};

// --- Enrollment payments ----------------------------------------------------
// Two RPCs React Admin's verbs don't model: the preview writes nothing and
// returns a single-use token; the confirmation redeems it and moves the money.
// The deprecated `POST /api/payment-preview` and `POST /api/payments` are never
// called.
const enrollmentPayments = {
  previewEnrollmentPayment: (body: PaymentPreviewRequest) =>
    sendJson<PaymentPreviewResponse>(
      "POST",
      "/enrollment-payments/preview",
      body,
    ),
  confirmEnrollmentPayment: (previewToken: string) =>
    sendJson<ConfirmPaymentResponse>("POST", "/enrollment-payments", {
      previewToken,
    }),
};

// --- Enrollments ------------------------------------------------------------
// What an enrollment, a change of price or a withdrawal would do. All three
// write nothing.
const enrollments = {
  previewEnrollment: (body: PreviewEnrollment) =>
    sendJson<EnrollmentPreview>("POST", "/enrollments/preview", body),
  previewEnrollmentChange: (
    enrollmentId: Identifier,
    body: EnrollmentChangePreviewRequest,
  ) =>
    sendJson<EnrollmentChangePreview>(
      "POST",
      `/enrollments/${enrollmentId}/change-preview`,
      body,
    ),
  previewEnrollmentWithdrawal: (
    enrollmentId: Identifier,
    withdrawalDate: string,
  ) =>
    sendJson<EnrollmentWithdrawalPreview>(
      "POST",
      `/enrollments/${enrollmentId}/withdrawal-preview`,
      { withdrawalDate },
    ),
};

export type AppDataProvider = DataProvider & {
  exportReport: typeof exportReport;
} & typeof catalog &
  typeof enrollmentPayments &
  typeof enrollments;

// --- App extensions decorator -----------------------------------------------
// Wraps a base DataProvider with the app's cross-cutting behaviour: report
// read endpoints and binary report exports. Each concern intercepts only the
// resources it owns and delegates everything else straight to the base provider.
const withAppExtensions = (base: DataProvider): AppDataProvider => ({
  ...base,
  exportReport,
  ...catalog,
  ...enrollmentPayments,
  ...enrollments,
  update: async (resource, params) => {
    if (resource === "products") {
      const { json } = await httpClient(
        `${API_URL}/products/${params.id}/line`,
        { method: "PUT", body: JSON.stringify(pickProductLine(params.data)) },
      );
      return { data: json } as UpdateResult;
    }
    return base.update(resource, params);
  },
  getOne: async (resource, params) => {
    if (resource === "payment-documents") {
      const { json } = await httpClient(`${API_URL}/${resource}/${params.id}`);
      return { data: flattenPaymentDocument(json) } as GetOneResult;
    }
    return base.getOne(resource, params);
  },
  getList: async (resource, params) => {
    const reportBuilder = REPORT_ENDPOINTS[resource];
    if (reportBuilder) {
      const filter: Record<string, string> = {};
      Object.entries(params.filter ?? {}).forEach(([k, v]) => {
        if (v !== undefined && v !== "") filter[k] = String(v);
      });
      const url = reportBuilder(filter);
      const { json } = await httpClient(url);
      const data = Array.isArray(json) ? json : (json.data ?? []);
      return { data, total: data.length };
    }
    return base.getList(resource, params);
  },
});

const dataProvider = withAppExtensions(baseProvider);

export { dataProvider, httpClient };
