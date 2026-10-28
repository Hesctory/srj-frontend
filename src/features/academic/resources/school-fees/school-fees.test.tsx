import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { HttpError, Notification, type GetListParams } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import type { SchoolFee } from "@/types/school-fee";
import { formatMoney } from "@/utils/money";
import { SchoolFeesList } from "./school-fees-list";
import { SchoolFeesCreate } from "./school-fees-create";
import { SchoolFeesEdit } from "./school-fees-edit";

const currentYear = new Date().getFullYear();

const fee: SchoolFee = {
  id: 4,
  schoolYearId: 8,
  schoolYear: currentYear,
  levelId: 2,
  levelName: "Primaria",
  shiftId: 1,
  shiftName: "Mañana",
  schoolFeeConceptId: 1,
  schoolFeeConceptName: "Normal",
  enrollmentPrice: 350,
  tuitionCost: 350,
  registrationFee: 200,
  description: null,
};

const rows: Record<string, { id: number; [key: string]: unknown }[]> = {
  "school-fees": [
    { ...fee },
    {
      ...fee,
      id: 5,
      levelId: 3,
      levelName: "Secundaria",
      enrollmentPrice: 380,
      tuitionCost: 420.5,
    },
  ],
  "school-years": [
    { id: 8, year: String(currentYear) },
    { id: 7, year: String(currentYear - 1) },
  ],
  levels: [
    { id: 2, name: "Primaria", orderIndex: 2 },
    { id: 3, name: "Secundaria", orderIndex: 3 },
  ],
  shifts: [{ id: 1, name: "Mañana" }],
  "school-fee-concepts": [{ id: 1, name: "Normal" }],
};

const makeDataProvider = () => ({
  getList: vi.fn(async (resource: string, _params: GetListParams) => {
    const data = rows[resource] ?? [];
    return { data, total: data.length };
  }),
  getMany: vi.fn(async (resource: string, { ids }: { ids: unknown[] }) => ({
    data: (rows[resource] ?? []).filter((row) => ids.includes(row.id)),
  })),
  getOne: vi.fn(async () => ({ data: fee })),
  create: vi.fn(async () => ({ data: { id: 9 } })),
  update: vi.fn(async (_resource: string, { data }: { data: object }) => ({
    data: { ...fee, ...data },
  })),
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

const fillCreateForm = async (
  user: ReturnType<typeof userEvent.setup>,
  amounts: { enrollment: string; tuition: string; registration: string },
) => {
  await pick(user, /Año escolar/, String(currentYear));
  await pick(user, /Nivel/, "Primaria");
  await pick(user, /Turno/, "Mañana");
  await pick(user, /Concepto/, "Normal");
  await user.type(screen.getByLabelText(/Matrícula/), amounts.enrollment);
  await user.type(screen.getByLabelText(/Pensión/), amounts.tuition);
  await user.type(
    screen.getByLabelText(/Cuota de ingreso/),
    amounts.registration,
  );
};

const renderCreate = (dataProvider: ReturnType<typeof makeDataProvider>) =>
  renderWithAdmin(
    <>
      <Routes>
        <Route path="/school-fees/create" element={<SchoolFeesCreate />} />
        <Route path="/school-fees" element={<p>Listado</p>} />
      </Routes>
      <Notification />
    </>,
    { dataProvider, resource: "school-fees" },
  );

const renderEdit = (dataProvider: ReturnType<typeof makeDataProvider>) =>
  renderWithAdmin(
    <Routes>
      <Route path="/school-fees/:id" element={<SchoolFeesEdit />} />
      <Route path="/school-fees" element={<p>Listado</p>} />
    </Routes>,
    { dataProvider, resource: "school-fees" },
  );

describe("SchoolFeesList", { timeout: 30_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/school-fees";
  });

  it("shows every fee row and filters by the running school year", async () => {
    const dataProvider = makeDataProvider();
    renderWithAdmin(<SchoolFeesList />, {
      dataProvider,
      resource: "school-fees",
    });

    expect(await screen.findByText("Secundaria")).toBeInTheDocument();
    expect(screen.getAllByText("Mañana").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Normal").length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatMoney(350)).length).toBeGreaterThan(0);
    expect(screen.getByText(formatMoney(420.5))).toBeInTheDocument();
    expect(screen.getAllByText(formatMoney(200)).length).toBe(2);

    await waitFor(() =>
      expect(dataProvider.getList).toHaveBeenCalledWith(
        "school-fees",
        expect.objectContaining({
          filter: expect.objectContaining({ schoolYearId: 8 }),
        }),
      ),
    );
  });
});

describe("SchoolFeesCreate", { timeout: 30_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/school-fees/create";
  });

  it("creates a fee row with the contract's field names", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderCreate(dataProvider);

    await fillCreateForm(user, {
      enrollment: "350",
      tuition: "350",
      registration: "200",
    });
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(dataProvider.create).toHaveBeenCalled());
    const [resource, { data }] = dataProvider.create.mock
      .calls[0] as unknown as [string, { data: Record<string, unknown> }];
    expect(resource).toBe("school-fees");
    expect(data).toMatchObject({
      schoolYearId: 8,
      levelId: 2,
      shiftId: 1,
      schoolFeeConceptId: 1,
      enrollmentPrice: 350,
      tuitionCost: 350,
      registrationFee: 200,
    });
  });

  it("refuses a matrícula above the pensión on the Matrícula field", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderCreate(dataProvider);

    await fillCreateForm(user, {
      enrollment: "350.01",
      tuition: "350",
      registration: "200",
    });
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText(/La matrícula no puede superar la pensión/),
    ).toBeInTheDocument();
    expect(dataProvider.create).not.toHaveBeenCalled();
  });

  it("refuses an amount above S/ 999.99", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderCreate(dataProvider);

    await fillCreateForm(user, {
      enrollment: "350",
      tuition: "1000",
      registration: "200",
    });
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText(/entre 0 y 999.99/)).toBeInTheDocument();
    expect(dataProvider.create).not.toHaveBeenCalled();
  });

  it("shows the server's 422 on the field it names", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    dataProvider.create.mockRejectedValueOnce(
      new HttpError("Unprocessable Entity", 422, {
        errors: {
          enrollmentPrice:
            "La matrícula no puede superar la pensión (S/ 300.00).",
        },
      }),
    );
    renderCreate(dataProvider);

    await fillCreateForm(user, {
      enrollment: "300",
      tuition: "300",
      registration: "200",
    });
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText(
        "La matrícula no puede superar la pensión (S/ 300.00).",
      ),
    ).toBeInTheDocument();
  });

  it("shows the server's message when the row already exists (409)", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    const message = `Ya existe una tarifa para ${currentYear}, Primaria, Mañana, Normal.`;
    dataProvider.create.mockRejectedValueOnce(
      new HttpError(message, 409, { message }),
    );
    renderCreate(dataProvider);

    await fillCreateForm(user, {
      enrollment: "350",
      tuition: "350",
      registration: "200",
    });
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});

describe("SchoolFeesEdit", { timeout: 30_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/school-fees/4";
  });

  it("saves the edited row and offers no delete", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderEdit(dataProvider);

    const tuition = await screen.findByLabelText(/Pensión/);
    await waitFor(() => expect(tuition).toHaveValue(350));
    expect(
      screen.queryByRole("button", { name: /Eliminar|Borrar/ }),
    ).not.toBeInTheDocument();

    await user.clear(tuition);
    await user.type(tuition, "380");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalled());
    const [, { data }] = dataProvider.update.mock.calls[0] as unknown as [
      string,
      { data: Record<string, unknown> },
    ];
    expect(data).toMatchObject({ tuitionCost: 380, enrollmentPrice: 350 });
  });

  it("refuses lowering the pensión below the stored matrícula", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderEdit(dataProvider);

    const tuition = await screen.findByLabelText(/Pensión/);
    await waitFor(() => expect(tuition).toHaveValue(350));
    await user.clear(tuition);
    await user.type(tuition, "300");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText(/La matrícula no puede superar la pensión/),
    ).toBeInTheDocument();
    expect(dataProvider.update).not.toHaveBeenCalled();
  });
});
