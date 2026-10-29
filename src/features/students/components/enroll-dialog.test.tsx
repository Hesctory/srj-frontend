import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form, HttpError } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import type {
  EnrollmentPreview,
  EnrollmentPreviewCharge,
} from "@/types/enrollment";
import { formatMoney } from "@/utils/money";
import { EnrollDialog } from "./enroll-dialog";
import EnrollmentFormInputs from "./enrollment-form-inputs";

// Testing Library collapses the no-break space Intl puts after "S/".
const money = (value: number) => formatMoney(value).replace(/\s+/g, " ");

const rows: Record<string, { id: number; [key: string]: unknown }[]> = {
  "school-years": [
    { id: 5, year: 2026 },
    { id: 6, year: 2027 },
  ],
  levels: [{ id: 1, name: "Inicial" }],
  grades: [{ id: 1, name: "3 años" }],
  shifts: [{ id: 1, name: "Mañana" }],
  sections: [{ id: 1, section: "A" }],
  "school-fee-concepts": [
    { id: 1, name: "Normal" },
    { id: 2, name: "Dscto hermano 1" },
  ],
  "required-documents": [],
};

const charge = (
  patch: Partial<EnrollmentPreviewCharge>,
): EnrollmentPreviewCharge => ({
  chargeTypeId: 3,
  month: 11,
  description: "Pensión Noviembre - 2026",
  amount: 445,
  discountAmount: 20,
  netAmount: 425,
  discountReason: "Por concepto de: Dscto hermano 1",
  dueDate: "2026-11-30",
  ...patch,
});

const preview: EnrollmentPreview = {
  charges: [
    charge({
      chargeTypeId: 2,
      month: null,
      description: "Matrícula 2026",
      amount: 315,
      netAmount: 295,
      dueDate: "2026-10-23",
    }),
    charge({}),
    charge({
      month: 12,
      description: "Pensión Diciembre - 2026",
      dueDate: "2026-12-31",
    }),
  ],
  warnings: [
    {
      code: "SIBLING_NOT_FOUND",
      message: "No hay un hermano matriculado en 2026.",
    },
  ],
};

const makeDataProvider = () => ({
  getList: vi.fn(async (resource: string) => {
    const data = rows[resource] ?? [];
    return { data, total: data.length };
  }),
  getMany: vi.fn(async (resource: string, { ids }: { ids: unknown[] }) => ({
    data: (rows[resource] ?? []).filter((row) => ids.includes(row.id)),
  })),
  getOne: vi.fn(async (resource: string, { id }: { id: unknown }) => ({
    data: (rows[resource] ?? []).find((row) => row.id === Number(id)),
  })),
  previewEnrollment: vi.fn(async () => preview),
  create: vi.fn(async () => ({ data: { id: 40 } })),
});

type Provider = ReturnType<typeof makeDataProvider>;

const renderDialog = (dataProvider: Provider) =>
  renderWithAdmin(
    <EnrollDialog
      open
      onClose={() => undefined}
      studentData={null}
      studentId={24}
    />,
    { dataProvider },
  );

const pick = async (
  user: ReturnType<typeof userEvent.setup>,
  field: RegExp,
  option: string,
) => {
  // The first render of the dialog loads every lookup; under a full parallel
  // run it can take longer than findBy's default second.
  await user.click(
    await screen.findByRole("combobox", { name: field }, { timeout: 5_000 }),
  );
  await user.click(
    within(await screen.findByRole("listbox")).getByText(option),
  );
};

const choosePlacement = async (
  user: ReturnType<typeof userEvent.setup>,
  year = "2026",
  concept = "Dscto hermano 1",
) => {
  await pick(user, /Año Escolar/, year);
  await pick(user, /Nivel/, "Inicial");
  await pick(user, /Grado/, "3 años");
  await pick(user, /Turno/, "Mañana");
  await pick(user, /Sección/, "A");
  await pick(user, /Concepto de Cobro/, concept);
};

const lastPreview = (dataProvider: Provider) => {
  const calls = dataProvider.previewEnrollment.mock.calls as unknown as [
    Record<string, unknown>,
  ][];
  return calls[calls.length - 1][0];
};

beforeEach(() => {
  // Only the clock: user-event still needs real timers.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 21, 10, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe(
  "EnrollDialog — first month, grace and charges",
  { timeout: 60_000 },
  () => {
    it("asks whether the current month is billed before previewing", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user);

      expect(
        await screen.findByText("¿Se cobra la pensión de octubre?"),
      ).toBeInTheDocument();
      expect(dataProvider.previewEnrollment).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          /si se cobra la pensión de este mes para ver los cobros/,
        ),
      ).toBeInTheDocument();

      await user.click(screen.getByLabelText("No, desde noviembre"));

      await waitFor(() =>
        expect(dataProvider.previewEnrollment).toHaveBeenCalled(),
      );
      expect(lastPreview(dataProvider)).toEqual({
        studentId: 24,
        schoolYearId: 5,
        levelId: 1,
        gradeId: 1,
        shiftId: 1,
        schoolFeeConceptId: 2,
        graceDays: 0,
        billEnrollmentMonth: false,
      });
    });

    it("shows each charge's net amount, due date and discount, and the warnings", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user);
      await user.click(await screen.findByLabelText("Sí, desde octubre"));

      const list = await screen.findByRole("list", {
        name: "Cobros de la matrícula",
      });
      expect(within(list).getByText("Matrícula 2026")).toBeInTheDocument();
      expect(within(list).getByText(money(295))).toBeInTheDocument();
      expect(
        within(list).getByText(
          `Vence 23/10/2026 · ${money(315)} − ${money(20)} de descuento`,
        ),
      ).toBeInTheDocument();
      expect(within(list).getAllByText(money(425))).toHaveLength(2);
      expect(screen.getByText(money(295 + 425 + 425))).toBeInTheDocument();
      expect(
        screen.getByText("Por concepto de: Dscto hermano 1"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("No hay un hermano matriculado en 2026."),
      ).toBeInTheDocument();
    });

    it("previews again with the grace days chosen", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user);
      await user.click(await screen.findByLabelText("Sí, desde octubre"));
      await waitFor(() =>
        expect(dataProvider.previewEnrollment).toHaveBeenCalled(),
      );

      await user.click(screen.getByLabelText("2 días"));

      await waitFor(() =>
        expect(lastPreview(dataProvider)).toMatchObject({
          graceDays: 2,
          billEnrollmentMonth: true,
        }),
      );
    });

    it("does not ask about the first month for a year that has not started", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user, "2027");

      await waitFor(() =>
        expect(dataProvider.previewEnrollment).toHaveBeenCalled(),
      );
      expect(lastPreview(dataProvider)).toMatchObject({
        schoolYearId: 6,
        billEnrollmentMonth: true,
      });
      expect(
        screen.queryByText(/¿Se cobra la pensión/),
      ).not.toBeInTheDocument();
    });

    it("enrolls despite the warnings, with the grace days and the first-month choice", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user);
      await user.click(await screen.findByLabelText("No, desde noviembre"));
      await user.click(screen.getByLabelText("1 día"));
      await screen.findByText("No hay un hermano matriculado en 2026.");
      await user.click(screen.getByRole("button", { name: "Matricular" }));

      await waitFor(() => expect(dataProvider.create).toHaveBeenCalled());
      const [resource, { data }] = dataProvider.create.mock
        .calls[0] as unknown as [string, { data: Record<string, unknown> }];
      expect(resource).toBe("enrollments");
      expect(data).toMatchObject({
        studentId: 24,
        schoolFeeConceptId: 2,
        graceDays: 1,
        billEnrollmentMonth: false,
      });
    });

    it("refuses to enroll until the first-month question is answered", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user);
      await user.click(screen.getByRole("button", { name: "Matricular" }));

      expect(
        await screen.findByText("Indica si se cobra la pensión de este mes."),
      ).toBeInTheDocument();
      expect(dataProvider.create).not.toHaveBeenCalled();
    });

    it("shows why the charges cannot be computed (no fees configured)", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      const message =
        "No hay tarifas configuradas para el año escolar, nivel y turno de esta matrícula.";
      dataProvider.previewEnrollment.mockRejectedValue(
        new HttpError(message, 404, { message }),
      );
      renderDialog(dataProvider);

      await choosePlacement(user, "2027");

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(
        screen.getByText("No se pueden calcular los cobros"),
      ).toBeInTheDocument();
    });

    it("puts the server's 422 on the field it names", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      dataProvider.create.mockRejectedValueOnce(
        new HttpError("Unprocessable Entity", 422, {
          errors: { graceDays: "Los días de gracia deben estar entre 0 y 2." },
        }),
      );
      renderDialog(dataProvider);

      await choosePlacement(user, "2027");
      await user.click(screen.getByRole("button", { name: "Matricular" }));

      expect(
        await screen.findByText("Los días de gracia deben estar entre 0 y 2."),
      ).toBeInTheDocument();
    });
  },
);

describe("New-student form — enrollment part", { timeout: 60_000 }, () => {
  it("previews with no student and shows that the discount is unverified", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    const message =
      "No se puede verificar si corresponde «Dscto hermano 1» hasta registrar al estudiante.";
    dataProvider.previewEnrollment.mockResolvedValue({
      charges: preview.charges,
      warnings: [{ code: "DISCOUNT_UNVERIFIED", message }],
    });
    renderWithAdmin(
      <Form>
        <EnrollmentFormInputs sourcePrefix="enrollment" />
      </Form>,
      { dataProvider },
    );

    await choosePlacement(user, "2027");

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(lastPreview(dataProvider)).toMatchObject({
      studentId: null,
      schoolYearId: 6,
      graceDays: 0,
      billEnrollmentMonth: true,
    });
  });
});
