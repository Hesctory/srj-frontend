import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { HttpError, Notification } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import type { SchoolFeeConcept } from "@/types/school-fee-concept";
import { formatMoney } from "@/utils/money";
import { SchoolFeeConceptsList } from "./school-fee-concepts-list";
import { SchoolFeeConceptsCreate } from "./school-fee-concepts-create";
import { SchoolFeeConceptsEdit } from "./school-fee-concepts-edit";

// Testing Library collapses the no-break space Intl puts after "S/".
const money = (value: number) => formatMoney(value).replace(/\s+/g, " ");

const concepts: SchoolFeeConcept[] = [
  {
    id: 1,
    name: "Normal",
    enrollmentDiscount: 0,
    tuitionDiscount: 0,
    discountCondition: null,
  },
  {
    id: 5,
    name: "Dscto hijo de trabajador",
    enrollmentDiscount: 0,
    tuitionDiscount: 50,
    discountCondition: "STAFF_CHILD",
  },
];

const makeDataProvider = () => ({
  getList: vi.fn(async () => ({ data: concepts, total: concepts.length })),
  getOne: vi.fn(async () => ({ data: concepts[1] })),
  create: vi.fn(async () => ({ data: { id: 9 } })),
  update: vi.fn(async (_resource: string, { data }: { data: object }) => ({
    data: { ...concepts[1], ...data },
  })),
  delete: vi.fn(async () => ({ data: concepts[1] })),
});

const renderCreate = (dataProvider: ReturnType<typeof makeDataProvider>) =>
  renderWithAdmin(
    <Routes>
      <Route
        path="/school-fee-concepts/create"
        element={<SchoolFeeConceptsCreate />}
      />
      <Route path="/school-fee-concepts" element={<p>Listado</p>} />
    </Routes>,
    { dataProvider, resource: "school-fee-concepts" },
  );

const renderEdit = (dataProvider: ReturnType<typeof makeDataProvider>) =>
  renderWithAdmin(
    <>
      <Routes>
        <Route
          path="/school-fee-concepts/:id"
          element={<SchoolFeeConceptsEdit />}
        />
        <Route path="/school-fee-concepts" element={<p>Listado</p>} />
      </Routes>
      <Notification />
    </>,
    { dataProvider, resource: "school-fee-concepts" },
  );

describe("SchoolFeeConceptsList", { timeout: 30_000 }, () => {
  it("shows each concept's discounts and condition", async () => {
    renderWithAdmin(<SchoolFeeConceptsList />, {
      dataProvider: makeDataProvider(),
      resource: "school-fee-concepts",
    });

    expect(
      await screen.findByText("Dscto hijo de trabajador"),
    ).toBeInTheDocument();
    expect(screen.getByText(money(50))).toBeInTheDocument();
    expect(screen.getByText("Es hijo de un trabajador")).toBeInTheDocument();
    expect(screen.getByText("Ninguna")).toBeInTheDocument();
  });
});

describe("SchoolFeeConceptsCreate", { timeout: 30_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/school-fee-concepts/create";
  });

  it("creates a concept with its two discounts and its condition", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderCreate(dataProvider);

    await user.type(await screen.findByLabelText(/Nombre/), "Dscto hermano 4");
    await user.click(
      screen.getByRole("combobox", { name: /Condición del descuento/ }),
    );
    await user.click(
      within(await screen.findByRole("listbox")).getByText(
        "Tiene un hermano matriculado",
      ),
    );
    const enrollment = screen.getByLabelText(/Descuento en la matrícula/);
    await user.clear(enrollment);
    await user.type(enrollment, "20");
    const tuition = screen.getByLabelText(/Descuento en cada pensión/);
    await user.clear(tuition);
    await user.type(tuition, "15.5");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(dataProvider.create).toHaveBeenCalled());
    const [resource, { data }] = dataProvider.create.mock
      .calls[0] as unknown as [string, { data: Record<string, unknown> }];
    expect(resource).toBe("school-fee-concepts");
    expect(data).toMatchObject({
      name: "Dscto hermano 4",
      enrollmentDiscount: 20,
      tuitionDiscount: 15.5,
      discountCondition: "SIBLING",
    });
  });

  it("starts with no discount and no condition", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderCreate(dataProvider);

    await user.type(await screen.findByLabelText(/Nombre/), "Beca");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(dataProvider.create).toHaveBeenCalled());
    const [, { data }] = dataProvider.create.mock.calls[0] as unknown as [
      string,
      { data: Record<string, unknown> },
    ];
    expect(data).toMatchObject({
      enrollmentDiscount: 0,
      tuitionDiscount: 0,
      discountCondition: null,
    });
  });

  it("refuses a discount above S/ 999.99", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderCreate(dataProvider);

    await user.type(await screen.findByLabelText(/Nombre/), "Beca");
    const tuition = screen.getByLabelText(/Descuento en cada pensión/);
    await user.clear(tuition);
    await user.type(tuition, "1000");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText(/El descuento debe estar entre 0 y 999.99/),
    ).toBeInTheDocument();
    expect(dataProvider.create).not.toHaveBeenCalled();
  });
});

describe("SchoolFeeConceptsEdit", { timeout: 30_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/school-fee-concepts/5";
  });

  it("saves new discount amounts", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderEdit(dataProvider);

    const tuition = await screen.findByLabelText(/Descuento en cada pensión/);
    await waitFor(() => expect(tuition).toHaveValue(50));
    await user.clear(tuition);
    await user.type(tuition, "60");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalled());
    const [, { data }] = dataProvider.update.mock.calls[0] as unknown as [
      string,
      { data: Record<string, unknown> },
    ];
    expect(data).toMatchObject({
      tuitionDiscount: 60,
      discountCondition: "STAFF_CHILD",
    });
  });

  it("shows the server's 422 on the field it names", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    dataProvider.update.mockRejectedValueOnce(
      new HttpError("Unprocessable Entity", 422, {
        errors: {
          tuitionDiscount:
            "El descuento debe estar entre 0 y 999.99, con hasta dos decimales.",
        },
      }),
    );
    renderEdit(dataProvider);

    const tuition = await screen.findByLabelText(/Descuento en cada pensión/);
    await waitFor(() => expect(tuition).toHaveValue(50));
    await user.clear(tuition);
    await user.type(tuition, "60");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText(
        "El descuento debe estar entre 0 y 999.99, con hasta dos decimales.",
      ),
    ).toBeInTheDocument();
  });

  it("shows why a concept in use cannot be deleted (409)", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    const message =
      "El concepto de pago está en uso por matrículas o tarifas; no se puede eliminar.";
    dataProvider.delete.mockRejectedValueOnce(
      new HttpError(message, 409, { message }),
    );
    renderEdit(dataProvider);

    await user.click(await screen.findByRole("button", { name: "Eliminar" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: /Confirmar|Aceptar|Eliminar/,
      }),
    );

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText("Listado")).not.toBeInTheDocument();
  });
});
