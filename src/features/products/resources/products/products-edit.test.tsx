import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import type { GetListParams } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import type { ProductDetail } from "@/types/product";
import { ProductsEdit } from "./products-edit";

const currentYear = new Date().getFullYear();

const offering = (id: number, salePrice: number, currentStock: number) => ({
  id,
  schoolYearId: 8,
  salePrice,
  purchasePrice: null,
  currentStock,
  openingStock: currentStock,
});

// Sizes 6, 8 and 10 on the scale; the 2023 cut has no size 6.
const product: ProductDetail = {
  id: 4,
  name: "Polo buzo",
  productTypeId: 1,
  garmentGenderId: 1,
  sizeScaleId: 1,
  isActive: true,
  versions: [
    {
      id: 9,
      label: "2023",
      publisherId: null,
      notes: null,
      variants: [
        {
          id: 90,
          sizeId: 2,
          gradeId: null,
          offerings: [offering(900, 45, 3)],
        },
        {
          id: 91,
          sizeId: 3,
          gradeId: null,
          offerings: [offering(901, 45, 12)],
        },
      ],
    },
  ],
};

const rows: Record<string, { id: number; [key: string]: unknown }[]> = {
  "school-years": [
    { id: 8, year: String(currentYear) },
    { id: 7, year: String(currentYear - 1) },
  ],
  "product-types": [
    { id: 1, name: "Uniforme" },
    { id: 2, name: "Libro" },
  ],
  "garment-genders": [{ id: 1, name: "Unisex" }],
  "sizes/scales": [{ id: 1, name: "Prendas" }],
  sizes: [
    { id: 1, sizeScaleId: 1, code: "6", name: "6", sortOrder: 3 },
    { id: 2, sizeScaleId: 1, code: "8", name: "8", sortOrder: 4 },
    { id: 3, sizeScaleId: 1, code: "10", name: "10", sortOrder: 5 },
  ],
};

const makeDataProvider = (detail: ProductDetail = product) => ({
  getOne: vi.fn(async () => ({ data: detail })),
  getList: vi.fn(async (resource: string, _params: GetListParams) => {
    const data = rows[resource] ?? [];
    return { data, total: data.length };
  }),
  getMany: vi.fn(async (resource: string, { ids }: { ids: unknown[] }) => ({
    data: (rows[resource] ?? []).filter((row) => ids.includes(row.id)),
  })),
  update: vi.fn(async (_resource: string, { data }: { data: object }) => ({
    data: { ...detail, ...data },
  })),
  setVersionPriceList: vi.fn(async () => ({ id: 9, affected: 2 })),
  updateProductVersion: vi.fn(async () => undefined),
});

const renderEditor = (dataProvider: ReturnType<typeof makeDataProvider>) =>
  renderWithAdmin(
    <Routes>
      <Route path="/products/:id" element={<ProductsEdit />} />
    </Routes>,
    { dataProvider, resource: "products" },
  );

// The grid waits for the size ladder, which can take past the default 1s
// under the full parallel suite.
const priceCell = (size: string) =>
  screen.findByRole(
    "button",
    { name: new RegExp(`^Venta S/ 2023 talla ${size}(: .*)?$`) },
    { timeout: 5000 },
  );

beforeEach(() => {
  window.location.hash = "#/products/4";
});

// Typing and MUI menus under the full parallel suite can pass the 5s default.
describe("ProductsEdit", { timeout: 20_000 }, () => {
  it("lays the version's prices and stock over the size ladder", async () => {
    renderEditor(makeDataProvider());

    expect(await priceCell("8")).toHaveTextContent("45");
    expect(await priceCell("10")).toHaveTextContent("45");
    // Size 6 is on the scale but not in this version: no cell to edit.
    expect(
      screen.queryByRole("button", { name: /talla 6(: .*)?$/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Stock 2023 talla 8: 3/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 tallas · 1 precio · stock 15/)).toBeVisible();
  });

  it("saves typed prices as the version's price list for the year", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderEditor(dataProvider);

    await user.click(await priceCell("10"));
    await user.keyboard("50{Enter}");
    expect(screen.getByText("1 precio sin guardar")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(dataProvider.setVersionPriceList).toHaveBeenCalledWith(9, {
        schoolYearId: 8,
        replace: true,
        rows: [
          { productVariantId: 90, salePrice: 45, purchasePrice: null },
          { productVariantId: 91, salePrice: 50, purchasePrice: null },
        ],
      }),
    );
    // Only prices changed: the line is not rewritten.
    expect(dataProvider.update).not.toHaveBeenCalled();
  });

  it("keeps unsaved prices when the product reloads after a version action", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderEditor(dataProvider);

    await user.click(await priceCell("10"));
    await user.keyboard("50{Enter}");

    await user.click(
      screen.getByRole("button", { name: "Acciones de la versión 2023" }),
    );
    await user.click(await screen.findByText("Editar nombre y notas"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(dataProvider.updateProductVersion).toHaveBeenCalled(),
    );
    await waitFor(() => expect(dataProvider.getOne).toHaveBeenCalledTimes(2));
    expect(await priceCell("10")).toHaveTextContent("50");
    expect(screen.getByText("1 precio sin guardar")).toBeInTheDocument();
  });

  it("saves the product's own fields through the dataProvider's update", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderEditor(dataProvider);

    await user.click(
      await screen.findByRole("button", { name: "Editar datos del producto" }),
    );
    const name = await screen.findByLabelText(/Nombre/);
    await user.clear(name);
    await user.type(name, "Polo buzo nuevo");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalled());
    const [resource, params] = dataProvider.update.mock.calls[0];
    expect(resource).toBe("products");
    expect(params).toMatchObject({
      id: 4,
      data: { name: "Polo buzo nuevo", productTypeId: 1, isActive: true },
    });
    expect(dataProvider.setVersionPriceList).not.toHaveBeenCalled();
  });

  it("puts the current version first, and keeps it first when an old one is opened", async () => {
    const user = userEvent.setup();
    // The backend sends versions oldest first; 2019 sold only last year.
    const old = {
      id: 5,
      label: "2019",
      publisherId: null,
      notes: null,
      variants: [
        {
          id: 50,
          sizeId: 2,
          gradeId: null,
          offerings: [{ ...offering(500, 35, 4), schoolYearId: 7 }],
        },
      ],
    };
    renderEditor(
      makeDataProvider({ ...product, versions: [old, ...product.versions] }),
    );

    await priceCell("8");
    const headings = () =>
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings()).toEqual(["2023"]);

    await user.click(
      screen.getByRole("button", { name: /2019 sin precios en/ }),
    );
    expect(headings()).toEqual(["2023", "2019"]);
  });
});
