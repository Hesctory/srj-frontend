import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import type { GetListParams } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import { ProductsCreate } from "./products-create";

const currentYear = new Date().getFullYear();

const rows: Record<string, { id: number; [key: string]: unknown }[]> = {
  "school-years": [{ id: 8, year: String(currentYear) }],
  "product-types": [
    { id: 1, name: "Uniforme" },
    { id: 2, name: "Libro" },
  ],
  "garment-genders": [{ id: 1, name: "Unisex" }],
  "sizes/scales": [{ id: 1, name: "Prendas" }],
  sizes: [
    { id: 2, sizeScaleId: 1, code: "8", name: "8", sortOrder: 4 },
    { id: 3, sizeScaleId: 1, code: "10", name: "10", sortOrder: 5 },
    { id: 4, sizeScaleId: 1, code: "12", name: "12", sortOrder: 6 },
  ],
};

const makeDataProvider = () => ({
  getList: vi.fn(async (resource: string, _params: GetListParams) => {
    const data = rows[resource] ?? [];
    return { data, total: data.length };
  }),
  getMany: vi.fn(async (resource: string, { ids }: { ids: unknown[] }) => ({
    data: (rows[resource] ?? []).filter((row) => ids.includes(row.id)),
  })),
  create: vi.fn(async () => ({ data: { id: 5 } })),
});

const pick = async (
  user: ReturnType<typeof userEvent.setup>,
  field: RegExp,
  option: string,
) => {
  await user.click(await screen.findByRole("combobox", { name: field }));
  await user.click(
    within(await screen.findByRole("listbox")).getByText(option),
  );
};

beforeEach(() => {
  window.location.hash = "#/products/create";
});

describe("ProductsCreate", { timeout: 30_000 }, () => {
  it("creates the line, its first version and the prices typed in the grid", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderWithAdmin(
      <Routes>
        <Route path="/products/create" element={<ProductsCreate />} />
      </Routes>,
      { dataProvider, resource: "products" },
    );

    await user.type(await screen.findByLabelText(/Nombre/), "Casaca buzo");
    await pick(user, /Tipo/, "Uniforme");
    await pick(user, /Escala de tallas/, "Prendas");

    // The whole ladder starts chosen; size 12 is taken off.
    await user.click(await screen.findByRole("button", { name: "12" }));
    await user.click(
      await screen.findByRole("button", { name: /^Venta S\/ talla 8(: .*)?$/ }),
    );
    await user.keyboard("70{Enter}75{Enter}");

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(dataProvider.create).toHaveBeenCalled());
    const [resource, { data }] = dataProvider.create.mock
      .calls[0] as unknown as [string, { data: Record<string, unknown> }];
    expect(resource).toBe("products");
    expect(data).toMatchObject({
      name: "Casaca buzo",
      productTypeId: 1,
      sizeScaleId: 1,
      versions: [
        {
          variants: [
            {
              sizeId: 2,
              offerings: [{ schoolYearId: 8, salePrice: 70 }],
            },
            {
              sizeId: 3,
              offerings: [{ schoolYearId: 8, salePrice: 75 }],
            },
          ],
        },
      ],
    });
  });
});
