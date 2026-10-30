import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form, HttpError, Notification, TextInput } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import type {
  EnrollmentPreview,
  EnrollmentPreviewCharge,
} from "@/types/enrollment";
import { formatMoney } from "@/utils/money";
import { EnrollDialog } from "./enroll-dialog";
import { ConfirmCreateStudentButton } from "@/features/students/resources/students/student-create";
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
  eligibility: { condition: "SIBLING", met: false, matches: [] },
  enrollmentDate: "2026-10-21",
  enrollmentMonthChoice: 10,
};

// The API decides the first-month question: year 5 is running, year 6 is not.
const previewFor = ({ schoolYearId }: { schoolYearId: number }) => ({
  ...preview,
  enrollmentMonthChoice: schoolYearId === 5 ? 10 : null,
});

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
  previewEnrollment: vi.fn(async (body: { schoolYearId: number }) =>
    previewFor(body),
  ),
  create: vi.fn(async () => ({ data: { id: 40 } })),
});

type Provider = ReturnType<typeof makeDataProvider>;

const renderDialog = (dataProvider: Provider) =>
  renderWithAdmin(
    <>
      <EnrollDialog
        open
        onClose={() => undefined}
        studentData={null}
        studentId={24}
      />
      <Notification />
    </>,
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

const confirmDialog = () =>
  screen.findByRole("dialog", { name: "Confirmar matrícula" });

/** Clicks enroll, then goes on from the confirmation. */
const enroll = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Matricular" }));
  const dialog = await confirmDialog();
  await user.click(
    await within(dialog).findByRole("button", { name: /^Matricular/ }),
  );
};

describe(
  "EnrollDialog — first month, grace and charges",
  { timeout: 60_000 },
  () => {
    it("asks the first-month question the API names, and lists charges once answered", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user);

      expect(
        await screen.findByText("¿Se cobra la pensión de octubre?"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Indica si se cobra la pensión de octubre para ver los cobros.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("list", { name: "Cobros de la matrícula" }),
      ).not.toBeInTheDocument();

      await user.click(screen.getByLabelText("No, desde noviembre"));

      expect(
        await screen.findByRole("list", { name: "Cobros de la matrícula" }),
      ).toBeInTheDocument();
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

    it("follows the API's month, not the browser's date", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      dataProvider.previewEnrollment.mockImplementation(async () => ({
        ...preview,
        enrollmentDate: "2026-04-15",
        enrollmentMonthChoice: 4,
      }));
      renderDialog(dataProvider);

      await choosePlacement(user);

      expect(
        await screen.findByText("¿Se cobra la pensión de abril?"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("No, desde mayo")).toBeInTheDocument();
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

    it("drops the first-month answer when the school year changes", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user);
      await user.click(await screen.findByLabelText("No, desde noviembre"));
      await waitFor(() =>
        expect(lastPreview(dataProvider)).toMatchObject({
          billEnrollmentMonth: false,
        }),
      );

      // A new year clears the cascade below it; fill it again for 2027.
      await choosePlacement(user, "2027");

      await waitFor(() =>
        expect(lastPreview(dataProvider)).toMatchObject({
          schoolYearId: 6,
          billEnrollmentMonth: true,
        }),
      );
    });

    it("enrolls despite the warnings, with the grace days and the first-month choice", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user);
      await user.click(await screen.findByLabelText("No, desde noviembre"));
      await user.click(screen.getByLabelText("1 día"));
      await screen.findByText("No hay un hermano matriculado en 2026.");
      await enroll(user);

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
      await enroll(user);

      expect(
        await screen.findByText("Los días de gracia deben estar entre 0 y 2."),
      ).toBeInTheDocument();
    });

    it("tells about a 422 on a field the form does not show", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      dataProvider.create.mockRejectedValueOnce(
        new HttpError("Unprocessable Entity", 422, {
          errors: { studentId: "El estudiante no existe." },
        }),
      );
      renderDialog(dataProvider);

      await choosePlacement(user, "2027");
      await enroll(user);

      expect(
        await screen.findByText("El estudiante no existe."),
      ).toBeInTheDocument();
    });

    it("sends the create the same first-month value the preview used", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user, "2027");
      await enroll(user);

      await waitFor(() => expect(dataProvider.create).toHaveBeenCalled());
      const [, { data }] = dataProvider.create.mock.calls[0] as unknown as [
        string,
        { data: Record<string, unknown> },
      ];
      expect(data.billEnrollmentMonth).toBe(
        lastPreview(dataProvider).billEnrollmentMonth,
      );
      expect(data.billEnrollmentMonth).toBe(true);
    });

    it("locks Matricular and Cancelar while the enrollment is saved", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      dataProvider.create.mockReturnValueOnce(new Promise(() => undefined));
      renderDialog(dataProvider);

      await choosePlacement(user, "2027");
      await enroll(user);

      expect(
        await screen.findByRole("button", { name: "Matriculando…" }),
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    });

    it("names the sibling found when enroll is clicked", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      dataProvider.previewEnrollment.mockImplementation(async () => ({
        ...preview,
        enrollmentMonthChoice: null,
        warnings: [],
        eligibility: {
          condition: "SIBLING" as const,
          met: true,
          matches: [{ personId: 9, fullName: "Ana Prueba" }],
        },
      }));
      renderDialog(dataProvider);

      await choosePlacement(user, "2027");
      await user.click(screen.getByRole("button", { name: "Matricular" }));

      const dialog = within(await confirmDialog());
      expect(
        await dialog.findByText("Hermano matriculado encontrado"),
      ).toBeInTheDocument();
      expect(dialog.getByText("Ana Prueba")).toBeInTheDocument();
      expect(dataProvider.create).not.toHaveBeenCalled();

      await user.click(dialog.getByRole("button", { name: "Matricular" }));
      await waitFor(() => expect(dataProvider.create).toHaveBeenCalled());
    });

    it("names the staff member found", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      dataProvider.previewEnrollment.mockImplementation(async () => ({
        ...preview,
        enrollmentMonthChoice: null,
        warnings: [],
        eligibility: {
          condition: "STAFF_CHILD" as const,
          met: true,
          matches: [{ personId: 3, fullName: "Luis Prueba" }],
        },
      }));
      renderDialog(dataProvider);

      await choosePlacement(user, "2027");
      await user.click(screen.getByRole("button", { name: "Matricular" }));

      const dialog = within(await confirmDialog());
      expect(
        await dialog.findByText("Familiar trabajador encontrado"),
      ).toBeInTheDocument();
      expect(dialog.getByText("Luis Prueba")).toBeInTheDocument();
    });

    it("shows every warning at the confirmation, late enrollment included, and lets them go on", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      dataProvider.previewEnrollment.mockImplementation(async () => ({
        ...preview,
        enrollmentMonthChoice: null,
        warnings: [
          ...preview.warnings,
          { code: "LATE_ENROLLMENT" as const, message: "Matrícula tardía." },
        ],
      }));
      renderDialog(dataProvider);

      await choosePlacement(user, "2027");
      await user.click(screen.getByRole("button", { name: "Matricular" }));

      const dialog = within(await confirmDialog());
      expect(
        await dialog.findByText("No hay un hermano matriculado en 2026."),
      ).toBeInTheDocument();
      expect(dialog.getByText("Matrícula tardía.")).toBeInTheDocument();

      await user.click(
        dialog.getByRole("button", { name: "Matricular de todos modos" }),
      );
      await waitFor(() => expect(dataProvider.create).toHaveBeenCalled());
    });

    it("confirms plainly for a concept with no condition", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      dataProvider.previewEnrollment.mockImplementation(async () => ({
        ...preview,
        enrollmentMonthChoice: null,
        warnings: [],
        eligibility: null,
      }));
      renderDialog(dataProvider);

      await choosePlacement(user, "2027", "Normal");
      await user.click(screen.getByRole("button", { name: "Matricular" }));

      const dialog = within(await confirmDialog());
      expect(
        await dialog.findByText("¿Confirmar la matrícula del estudiante?"),
      ).toBeInTheDocument();
      expect(dialog.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("stays on the form when the confirmation is cancelled", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user, "2027");
      await user.click(screen.getByRole("button", { name: "Matricular" }));
      const dialog = within(await confirmDialog());
      await user.click(await dialog.findByRole("button", { name: "Cancelar" }));

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Matricular" }),
        ).toBeEnabled(),
      );
      expect(dataProvider.create).not.toHaveBeenCalled();
    });

    it("still lets them enroll when the check itself fails", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user, "2027");
      await screen.findByRole("list", { name: "Cobros de la matrícula" });
      dataProvider.previewEnrollment.mockRejectedValueOnce(
        new HttpError("Servicio no disponible", 500, {}),
      );
      await user.click(screen.getByRole("button", { name: "Matricular" }));

      const dialog = within(await confirmDialog());
      expect(
        await dialog.findByText("No se pudo verificar"),
      ).toBeInTheDocument();
      await user.click(
        dialog.getByRole("button", { name: "Matricular de todos modos" }),
      );
      await waitFor(() => expect(dataProvider.create).toHaveBeenCalled());
    });

    it("does not enroll if the first-month question was still loading at the click", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      // The live preview hangs; the check at the click answers.
      dataProvider.previewEnrollment.mockImplementationOnce(
        () => new Promise(() => undefined),
      );
      renderDialog(dataProvider);

      await choosePlacement(user);
      await user.click(screen.getByRole("button", { name: "Matricular" }));

      await waitFor(() =>
        expect(
          screen.queryByRole("dialog", { name: "Confirmar matrícula" }),
        ).not.toBeInTheDocument(),
      );
      expect(dataProvider.previewEnrollment.mock.calls.length).toBe(2);
      expect(dataProvider.create).not.toHaveBeenCalled();
    });

    it("cancelling during the check ends it: a late answer opens nothing, and the next click works", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user, "2027", "Normal");
      await screen.findByRole("list", { name: "Cobros de la matrícula" });

      let answerFirstCheck = (_: EnrollmentPreview) => {};
      dataProvider.previewEnrollment.mockImplementationOnce(
        () =>
          new Promise<EnrollmentPreview>((resolve) => {
            answerFirstCheck = resolve;
          }),
      );
      await user.click(screen.getByRole("button", { name: "Matricular" }));
      const first = within(await confirmDialog());
      await user.click(first.getByRole("button", { name: "Cancelar" }));
      await waitFor(() =>
        expect(
          screen.queryByRole("dialog", { name: "Confirmar matrícula" }),
        ).not.toBeInTheDocument(),
      );

      answerFirstCheck({ ...preview, enrollmentMonthChoice: null });
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(
        screen.queryByRole("dialog", { name: "Confirmar matrícula" }),
      ).not.toBeInTheDocument();

      await enroll(user);
      await waitFor(() => expect(dataProvider.create).toHaveBeenCalledTimes(1));
    });

    it("ignores an old first-month answer when the check says no question applies", async () => {
      const user = userEvent.setup();
      const dataProvider = makeDataProvider();
      renderDialog(dataProvider);

      await choosePlacement(user);
      await user.click(await screen.findByLabelText("No, desde noviembre"));
      await screen.findByRole("list", { name: "Cobros de la matrícula" });
      dataProvider.previewEnrollment.mockImplementationOnce(async () => ({
        ...preview,
        enrollmentMonthChoice: null,
      }));

      await enroll(user);

      await waitFor(() => expect(dataProvider.create).toHaveBeenCalled());
      const [, { data }] = dataProvider.create.mock.calls[0] as unknown as [
        string,
        { data: Record<string, unknown> },
      ];
      expect(data.billEnrollmentMonth).toBe(true);
    });
  },
);

describe("New-student form — enrollment part", { timeout: 60_000 }, () => {
  const documented = [
    { documentTypeId: 1, idDocumentNumber: "90000001", isGuardian: true },
    { documentTypeId: 1, idDocumentNumber: "  " },
    { idDocumentNumber: "90000002" },
  ];

  it("previews with no student and the familiars' usable documents", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    const message =
      "Registre los documentos de los familiares para verificar si corresponde «Dscto hermano 1».";
    dataProvider.previewEnrollment.mockResolvedValue({
      ...preview,
      enrollmentMonthChoice: null,
      warnings: [{ code: "DISCOUNT_UNVERIFIED", message }],
      eligibility: { condition: "SIBLING", met: null, matches: [] },
    });
    renderWithAdmin(
      <Form defaultValues={{ familiars: documented }}>
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
      familiarDocuments: [{ documentTypeId: 1, idDocumentNumber: "90000001" }],
    });
  });

  it("waits for the typing to stop before asking about a typed document", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    renderWithAdmin(
      <Form defaultValues={{ familiars: [{ documentTypeId: 1 }] }}>
        <EnrollmentFormInputs sourcePrefix="enrollment" />
        <TextInput source="familiars.0.idDocumentNumber" label="Documento" />
      </Form>,
      { dataProvider },
    );

    await choosePlacement(user, "2027");
    await screen.findByRole("list", { name: "Cobros de la matrícula" });
    const before = dataProvider.previewEnrollment.mock.calls.length;

    await user.type(screen.getByLabelText("Documento"), "90000001");

    await waitFor(
      () =>
        expect(lastPreview(dataProvider)).toMatchObject({
          familiarDocuments: [
            { documentTypeId: 1, idDocumentNumber: "90000001" },
          ],
        }),
      { timeout: 3_000 },
    );
    expect(dataProvider.previewEnrollment.mock.calls.length).toBe(before + 1);
  });

  it("checks with the documents on clicking enroll, names who was found, then creates", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollment.mockResolvedValue({
      ...preview,
      enrollmentMonthChoice: null,
      warnings: [],
      eligibility: {
        condition: "SIBLING",
        met: true,
        matches: [{ personId: 9, fullName: "Ana Prueba" }],
      },
    });
    renderWithAdmin(
      <Form
        defaultValues={{
          familiars: documented,
          enrollment: {
            schoolYearId: 6,
            levelId: 1,
            gradeId: 1,
            shiftId: 1,
            sectionId: 1,
            schoolFeeConceptId: 2,
          },
        }}
      >
        <ConfirmCreateStudentButton />
      </Form>,
      { dataProvider },
    );

    await user.click(await screen.findByRole("button", { name: "Matricular" }));

    const dialog = within(await confirmDialog());
    expect(await dialog.findByText("Ana Prueba")).toBeInTheDocument();
    expect(lastPreview(dataProvider)).toMatchObject({
      studentId: null,
      familiarDocuments: [{ documentTypeId: 1, idDocumentNumber: "90000001" }],
    });
    expect(dataProvider.create).not.toHaveBeenCalled();

    await user.click(dialog.getByRole("button", { name: "Matricular" }));

    await waitFor(() => expect(dataProvider.create).toHaveBeenCalled());
    const [resource, { data }] = dataProvider.create.mock
      .calls[0] as unknown as [
      string,
      { data: { enrollment: Record<string, unknown> } },
    ];
    expect(resource).toBe("students");
    expect(data.enrollment.billEnrollmentMonth).toBe(true);
  });
});
