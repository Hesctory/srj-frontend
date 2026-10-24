import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GetListParams } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import { CatalogWorkspaceContext } from "@/features/products/components/catalog-workspace/workspace-context";
import { ProductsList } from "./products-list";

const currentYear = String(new Date().getFullYear());

const rows: Record<string, { id: number; [key: string]: unknown }[]> = {
  products: [
    {
      id: 1,
      name: "Polo buzo",
      productTypeId: 1,
      garmentGenderId: 1,
      sizeScaleId: 1,
      isActive: true,
      versionCount: 2,
      variantsOnOffer: null,
    },
    {
      id: 2,
      name: "Libro de inglés",
      productTypeId: 2,
      garmentGenderId: null,
      sizeScaleId: null,
      isActive: true,
      versionCount: 1,
      variantsOnOffer: null,
    },
  ],
  "school-years": [
    { id: 8, year: currentYear },
    { id: 7, year: String(Number(currentYear) - 1) },
  ],
  "product-types": [
    { id: 1, name: "Uniforme" },
    { id: 2, name: "Libro" },
  ],
  "garment-genders": [{ id: 1, name: "Unisex" }],
};

const makeDataProvider = () => ({
  getList: vi.fn(async (resource: string, params: GetListParams) => {
    let data = rows[resource] ?? [];
    // Like the backend: a year keeps only the lines priced in it, and says
    // how many variants are on offer.
    if (resource === "products" && params.filter?.schoolYearId) {
      data = data
        .filter((row) => row.id === 1)
        .map((row) => ({ ...row, variantsOnOffer: 21 }));
    }
    if (resource === "products" && params.filter?.q) {
      data = data.filter((row) =>
        String(row.name).toLowerCase().includes(params.filter.q),
      );
    }
    return { data, total: data.length };
  }),
  getMany: vi.fn(async (resource: string, { ids }: { ids: unknown[] }) => ({
    data: (rows[resource] ?? []).filter((row) => ids.includes(row.id)),
  })),
});

const productCalls = (dataProvider: ReturnType<typeof makeDataProvider>) =>
  dataProvider.getList.mock.calls.filter(
    ([resource]) => resource === "products",
  );

describe("ProductsList", { timeout: 15_000 }, () => {
  it("lists every active product, flagging the ones with no price this year", async () => {
    const dataProvider = makeDataProvider();
    renderWithAdmin(<ProductsList />, { dataProvider, resource: "products" });

    expect(await screen.findByText("Polo buzo")).toBeInTheDocument();
    expect(screen.getByText("Libro de inglés")).toBeInTheDocument();
    // As a page, what the line is and its versions get columns of their own.
    expect(await screen.findByText("Uniforme · Unisex")).toBeInTheDocument();
    expect(screen.getByText("2 versiones")).toBeInTheDocument();
    expect(await screen.findByText("21 tallas")).toBeInTheDocument();
    expect(screen.getByText("Sin precio")).toBeInTheDocument();

    // The list itself is not narrowed by year — that would hide the book —
    // and hides inactive products until asked.
    const [, listParams] = productCalls(dataProvider)[0];
    expect(listParams.filter).toEqual({ isActive: true });
    await waitFor(() =>
      expect(
        productCalls(dataProvider).some(
          ([, params]) =>
            params.filter.schoolYearId === 8 &&
            String(params.filter.id) === "1,2",
        ),
      ).toBe(true),
    );
  });

  it("folds those columns into a caption as the pane beside a product", async () => {
    renderWithAdmin(<ProductsList layout="pane" />, {
      dataProvider: makeDataProvider(),
      resource: "products",
    });

    expect(
      await screen.findByText("Uniforme · Unisex · 2 versiones"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Tipo" }),
    ).not.toBeInTheDocument();
  });

  it("searches by name and says when nothing matches", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderWithAdmin(<ProductsList />, { dataProvider, resource: "products" });

    await screen.findByText("Polo buzo");
    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "zzz");

    expect(
      await screen.findByText(
        "Ningún producto coincide con la búsqueda.",
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
  });

  it("shows inactive products on request", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderWithAdmin(<ProductsList />, { dataProvider, resource: "products" });

    await screen.findByText("Polo buzo");
    await user.click(screen.getByRole("switch", { name: "Ver inactivos" }));

    await waitFor(() => {
      const calls = productCalls(dataProvider);
      expect(calls[calls.length - 1][1].filter).not.toHaveProperty("isActive");
    });
  });

  it("asks before opening another product over unsaved changes", async () => {
    const user = userEvent.setup();
    const confirmLeave = vi.fn(() => false);
    renderWithAdmin(
      <CatalogWorkspaceContext.Provider
        value={{
          narrow: false,
          setEditorWidth: () => {},
          setDirty: () => {},
          confirmLeave,
        }}
      >
        <ProductsList />
      </CatalogWorkspaceContext.Provider>,
      { dataProvider: makeDataProvider(), resource: "products" },
    );

    await user.click(await screen.findByText("Polo buzo"));
    expect(confirmLeave).toHaveBeenCalled();
  });
});
