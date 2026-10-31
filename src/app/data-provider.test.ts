import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_URL, dataProvider } from "@/app/data-provider";

/**
 * The dataProvider is the only code that knows URLs, so it is where a contract
 * change shows up first. These tests pin the request each call makes and the
 * shape each response is turned into. When a contract changes, update the
 * test together with the mapping.
 */

const fetchMock = vi.fn();

const jsonResponse = (body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...headers },
  });

const lastRequest = () => {
  const calls = fetchMock.mock.calls;
  const [url, init] = calls[calls.length - 1] as [string, RequestInit];
  return {
    url: new URL(url),
    headers: new Headers(init?.headers),
    method: init?.method ?? "GET",
    body: init?.body ? JSON.parse(init.body as string) : undefined,
  };
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("dataProvider", () => {
  it("sends the stored JWT as a bearer token", async () => {
    localStorage.setItem("token", "abc123");
    fetchMock.mockResolvedValueOnce(
      jsonResponse([{ id: 1 }], { "Content-Range": "levels 0-0/1" }),
    );

    await dataProvider.getList("levels", {
      pagination: { page: 1, perPage: 10 },
      sort: { field: "id", order: "ASC" },
      filter: {},
    });

    expect(lastRequest().headers.get("Authorization")).toBe("Bearer abc123");
  });

  it("maps plain resources to simple-rest URLs with the range, sort and filter", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([{ id: 1 }, { id: 2 }], {
        "Content-Range": "products 0-1/70",
      }),
    );

    const result = await dataProvider.getList("products", {
      pagination: { page: 1, perPage: 25 },
      sort: { field: "name", order: "ASC" },
      filter: { schoolYearId: 3 },
    });

    const { url } = lastRequest();
    expect(`${url.origin}${url.pathname}`).toBe(`${API_URL}/products`);
    expect(JSON.parse(url.searchParams.get("range")!)).toEqual([0, 24]);
    expect(JSON.parse(url.searchParams.get("sort")!)).toEqual(["name", "ASC"]);
    expect(JSON.parse(url.searchParams.get("filter")!)).toEqual({
      schoolYearId: 3,
    });
    // The list total comes from Content-Range, not from the page length.
    expect(result.total).toBe(70);
  });

  it("routes report resources to their endpoint and drops empty filters", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: 1 }, { id: 2 }]));

    const result = await dataProvider.getList("students-birthdays-report", {
      pagination: { page: 1, perPage: 10 },
      sort: { field: "id", order: "ASC" },
      filter: { month: 5, levelId: "", gradeId: undefined },
    });

    const { url } = lastRequest();
    expect(`${url.origin}${url.pathname}`).toBe(
      `${API_URL}/students/birthdays`,
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({ month: "5" });
    expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }], total: 2 });
  });

  it("lifts a payment document out of its { document, lines } envelope", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        document: { id: 7, series: "B001" },
        lines: [{ id: 1 }],
      }),
    );

    const { data } = await dataProvider.getOne("payment-documents", { id: 7 });

    expect(lastRequest().url.pathname).toMatch(/\/payment-documents\/7$/);
    expect(data).toEqual({ id: 7, series: "B001", lines: [{ id: 1 }] });
  });

  it("returns no file when a report export has no rows (204)", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await dataProvider.exportReport({
      report: "birthdays",
      format: "pdf",
      filter: { month: 5, levelId: "" },
    });

    const { url, headers } = lastRequest();
    expect(url.pathname).toMatch(/\/students\/birthdays\/export$/);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      format: "pdf",
      month: "5",
    });
    expect(headers.get("Accept")).toBe("application/pdf");
    expect(result).toEqual({ data: null });
  });

  it("updates a product through /line with only the line's own fields", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 4, versions: [] }));

    await dataProvider.update("products", {
      id: 4,
      data: {
        id: 4,
        name: "Polo buzo",
        productTypeId: 1,
        garmentGenderId: 2,
        sizeScaleId: 1,
        isActive: false,
        versionCount: 2,
        versions: [{ id: 9, variants: [] }],
      },
      previousData: { id: 4 },
    });

    const { url, method, body } = lastRequest();
    expect(method).toBe("PUT");
    expect(url.pathname).toMatch(/\/products\/4\/line$/);
    // Never the tree: PUT /products/:id deletes children absent from it.
    expect(body).toEqual({
      name: "Polo buzo",
      productTypeId: 1,
      garmentGenderId: 2,
      sizeScaleId: 1,
      isActive: false,
    });
  });

  it.each([
    [
      "createProductVersion",
      () =>
        dataProvider.createProductVersion(4, {
          label: "2026",
          publisherId: null,
          notes: null,
        }),
      "POST",
      "/products/4/versions",
    ],
    [
      "updateProductVersion",
      () =>
        dataProvider.updateProductVersion(9, {
          label: "2026",
          publisherId: null,
          notes: null,
        }),
      "PUT",
      "/products/versions/9",
    ],
    [
      "deleteProductVersion",
      () => dataProvider.deleteProductVersion(9),
      "DELETE",
      "/products/versions/9",
    ],
    [
      "cloneProductVersion",
      () =>
        dataProvider.cloneProductVersion(9, {
          label: "2027",
          publisherId: null,
          notes: null,
          schoolYearId: 3,
          salePrice: null,
          copyPrices: true,
        }),
      "POST",
      "/products/versions/9/clone",
    ],
    [
      "addProductVariants",
      () => dataProvider.addProductVariants(9, { sizeIds: [1, 2] }),
      "POST",
      "/products/versions/9/variants",
    ],
    [
      "setVersionPriceList",
      () =>
        dataProvider.setVersionPriceList(9, {
          schoolYearId: 3,
          rows: [{ productVariantId: 5, salePrice: 45, purchasePrice: null }],
          replace: false,
        }),
      "PUT",
      "/products/versions/9/price-list",
    ],
    [
      "rollForwardOfferings",
      () =>
        dataProvider.rollForwardOfferings(9, {
          fromSchoolYearId: 3,
          toSchoolYearId: 4,
          increasePercent: 5,
          increaseAmount: null,
          overwrite: false,
        }),
      "POST",
      "/products/versions/9/roll-forward",
    ],
  ])("%s calls %s %s", async (_name, call, method, path) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1, affected: 1 }));

    await call();

    const request = lastRequest();
    expect(request.method).toBe(method);
    expect(request.url.pathname).toBe(new URL(`${API_URL}${path}`).pathname);
  });

  it("reads an offering's kardex, passing the period only when given", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ movements: [] }));

    await dataProvider.getKardex(12);
    expect(lastRequest().url.pathname).toMatch(
      /\/products\/offerings\/12\/kardex$/,
    );
    expect(lastRequest().url.search).toBe("");

    await dataProvider.getKardex(12, { from: "2026-03-01" });
    expect(Object.fromEntries(lastRequest().url.searchParams)).toEqual({
      from: "2026-03-01",
    });
  });

  it("previews an enrollment payment with each line's typed commission", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ previewToken: "t" }));

    await dataProvider.previewEnrollmentPayment({
      obligationIds: [7],
      date: "2026-10-28",
      lines: [
        { paymentMethodId: 2, amount: 350, reference: null, commission: 11.5 },
        { paymentMethodId: 1, amount: 50, reference: null, commission: null },
      ],
    });

    const request = lastRequest();
    expect(request.method).toBe("POST");
    expect(request.url.href).toBe(`${API_URL}/enrollment-payments/preview`);
    expect(request.body.lines).toEqual([
      { paymentMethodId: 2, amount: 350, reference: null, commission: 11.5 },
      { paymentMethodId: 1, amount: 50, reference: null, commission: null },
    ]);
  });

  it("confirms an enrollment payment by sending the preview token alone", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 3 }));

    await dataProvider.confirmEnrollmentPayment("t");

    const request = lastRequest();
    expect(request.method).toBe("POST");
    expect(request.url.href).toBe(`${API_URL}/enrollment-payments`);
    expect(request.body).toEqual({ previewToken: "t" });
  });

  it("maps school fees to plain /school-fees CRUD", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([], { "Content-Range": "school-fees 0-0/0" }),
    );

    await dataProvider.getList("school-fees", {
      pagination: { page: 1, perPage: 25 },
      sort: { field: "id", order: "ASC" },
      filter: { schoolYearId: 3 },
    });

    const { url } = lastRequest();
    expect(url.pathname).toBe(new URL(`${API_URL}/school-fees`).pathname);
    expect(JSON.parse(url.searchParams.get("filter") ?? "")).toEqual({
      schoolYearId: 3,
    });
  });

  it("previews an enrollment's charges with the grace days and the first-month choice", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ charges: [], warnings: [] }),
    );
    const body = {
      studentId: null,
      schoolYearId: 5,
      levelId: 1,
      gradeId: 1,
      shiftId: 1,
      schoolFeeConceptId: 2,
      graceDays: 2,
      billEnrollmentMonth: false,
      familiarDocuments: [{ documentTypeId: 1, idDocumentNumber: "90000001" }],
    };

    await dataProvider.previewEnrollment(body);

    const request = lastRequest();
    expect(request.method).toBe("POST");
    expect(request.url.href).toBe(`${API_URL}/enrollments/preview`);
    expect(request.body).toEqual(body);
  });

  it("maps fee concepts to plain /school-fee-concepts CRUD", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 2 }));

    await dataProvider.update("school-fee-concepts", {
      id: 2,
      data: {
        name: "Dscto hermano 1",
        enrollmentDiscount: 20,
        tuitionDiscount: 20,
        discountCondition: "SIBLING",
      },
      previousData: { id: 2 },
    });

    const request = lastRequest();
    expect(request.method).toBe("PUT");
    expect(request.url.href).toBe(`${API_URL}/school-fee-concepts/2`);
    expect(request.body).toMatchObject({
      enrollmentDiscount: 20,
      tuitionDiscount: 20,
      discountCondition: "SIBLING",
    });
  });
});
