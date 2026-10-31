import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpError, Notification } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import type {
  EnrollmentChangeLine,
  EnrollmentChangeOutcome,
  EnrollmentWithdrawalPreview,
} from "@/types/enrollment";
import { formatMoney } from "@/utils/money";
import { EnrollmentsDialog } from "./enrollments-dialog";

// Testing Library collapses the no-break space Intl puts after "S/".
const money = (value: number) => formatMoney(value).replace(/\s+/g, " ");

const lookups: Record<string, { id: number; [key: string]: unknown }[]> = {
  "school-years": [{ id: 5, year: 2027 }],
  levels: [
    { id: 1, name: "Primaria" },
    { id: 2, name: "Secundaria" },
  ],
  grades: [{ id: 1, name: "1ro" }],
  shifts: [
    { id: 1, name: "Mañana" },
    { id: 2, name: "Tarde" },
  ],
  sections: [
    { id: 1, section: "A" },
    { id: 2, section: "B" },
  ],
  "school-fee-concepts": [
    { id: 1, name: "Normal" },
    { id: 2, name: "Dscto hermano" },
  ],
  "required-documents": [],
};

const detail = {
  id: 25,
  code: "M-1",
  codeNumber: 1,
  studentId: 4,
  schoolYearId: 5,
  levelId: 1,
  gradeId: 1,
  shiftId: 1,
  sectionId: 1,
  schoolFeeConceptId: 1,
  previousSchool: null,
  documents: [],
};

const placement = {
  levelId: 1,
  gradeId: 1,
  shiftId: 1,
  sectionId: 1,
  schoolFeeConceptId: 1,
  previousSchool: null,
  documents: [],
};

const line = (
  month: number,
  outcome: EnrollmentChangeOutcome,
  patch: Partial<EnrollmentChangeLine> = {},
): EnrollmentChangeLine => ({
  month,
  description: `Pensión mes ${month}`,
  currentNet: 500,
  newGross: 500,
  newDiscount: 20,
  newNet: 480,
  outcome,
  ...patch,
});

const withdrawal: EnrollmentWithdrawalPreview = {
  voided: [{ month: 6, description: "Pensión Junio - 2027", net: 500 }],
  keptPaid: [{ month: 7, description: "Pensión Julio - 2027", net: 500 }],
  siblings: [
    {
      enrollmentId: 30,
      studentId: 9,
      fullName: "Hermana Prueba",
      conceptName: "Dscto hermano",
      repriceFromMonth: 6,
    },
  ],
};

const summaryIn = (state: string) => ({
  id: 25,
  year: 2027,
  level: "Primaria",
  grade: "1ro",
  shift: "Mañana",
  section: "A",
  state,
});

const makeDataProvider = (state = "Activa") => {
  return {
    getList: vi.fn(async (resource: string) => {
      const data =
        resource === "enrollments"
          ? [summaryIn(state)]
          : (lookups[resource] ?? []);
      return { data, total: data.length };
    }),
    getMany: vi.fn(async (resource: string, { ids }: { ids: unknown[] }) => ({
      data: (lookups[resource] ?? []).filter((row) => ids.includes(row.id)),
    })),
    getOne: vi.fn(async () => ({ data: detail })),
    update: vi.fn(async () => ({ data: detail })),
    previewEnrollment: vi.fn(async () => ({
      charges: [],
      warnings: [],
      eligibility: null,
      enrollmentDate: "2027-04-20",
      enrollmentMonthChoice: 4,
    })),
    previewEnrollmentChange: vi.fn(
      async (_id: unknown, body: { repriceFromMonth: number }) => ({
        lines: [
          line(3, "PAID"),
          ...(body.repriceFromMonth > 4
            ? [line(4, "BEFORE_FROM_MONTH")]
            : [line(4, "REPRICED")]),
          line(5, "REPRICED"),
        ],
      }),
    ),
    previewEnrollmentWithdrawal: vi.fn(async () => withdrawal),
  };
};

type Provider = ReturnType<typeof makeDataProvider>;

const renderDialog = async (dataProvider: Provider) => {
  renderWithAdmin(
    <>
      <EnrollmentsDialog open onClose={() => undefined} studentId={4} />
      <Notification />
    </>,
    { dataProvider },
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: /2027/ }));
  return user;
};

const pick = async (
  user: ReturnType<typeof userEvent.setup>,
  field: RegExp,
  option: string,
) => {
  await user.click(
    await screen.findByRole("combobox", { name: field }, { timeout: 5_000 }),
  );
  await user.click(
    within(await screen.findByRole("listbox")).getByText(option),
  );
};

const save = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(await screen.findByRole("button", { name: "Guardar cambios" }));

const lastBody = (dataProvider: Provider) =>
  (
    dataProvider.update.mock.lastCall as unknown as [string, { data: unknown }]
  )[1].data;

const conflict = (message: string) => new HttpError(message, 409, { message });
const invalid = (errors: Record<string, string>) =>
  new HttpError("Inválido", 422, { errors });

describe("EnrollmentsDialog — editing", { timeout: 30_000 }, () => {
  it("shows neither the charges nor the questions of a new enrollment", async () => {
    const dataProvider = makeDataProvider();
    await renderDialog(dataProvider);

    await screen.findByRole("button", { name: "Guardar cambios" });
    expect(screen.queryByText("Cobros que se generarán")).toBeNull();
    expect(screen.queryByText(/Días de gracia/)).toBeNull();
    expect(dataProvider.previewEnrollment).not.toHaveBeenCalled();
  });

  it("does not let the school year change", async () => {
    const user = await renderDialog(makeDataProvider());
    await user.click(
      await screen.findByRole("combobox", { name: /Año Escolar/ }),
    );

    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("sends the placement on every save, the year's lock losing nothing", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await pick(user, /Sección/, "B");
    await save(user);
    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    await pick(user, /Sección/, "A");
    await save(user);

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(2));
    expect(lastBody(dataProvider)).toEqual(placement);
    expect(screen.getByRole("combobox", { name: /Nivel/ })).toHaveTextContent(
      "Primaria",
    );
  });

  it("saves a change of section with no month and no preview", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await pick(user, /Sección/, "B");
    await save(user);

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({ ...placement, sectionId: 2 });
    expect(dataProvider.previewEnrollmentChange).not.toHaveBeenCalled();
  });

  it("asks the month on a change of concept and sends it on the PUT", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);

    const dialog = await screen.findByRole("dialog", {
      name: "Cambiar el precio de la matrícula",
    });
    const confirm = within(dialog).getByRole("button", {
      name: "Guardar cambios",
    });
    expect(confirm).toBeDisabled();

    await pick(user, /se aplica desde/, "mayo");

    expect(
      await screen.findByText("1 pensión cambia de precio."),
    ).toBeVisible();
    await waitFor(() =>
      expect(dataProvider.previewEnrollmentChange).toHaveBeenLastCalledWith(
        25,
        {
          levelId: 1,
          shiftId: 1,
          schoolFeeConceptId: 2,
          repriceFromMonth: 5,
        },
      ),
    );
    expect(within(dialog).getByText("Con pago, se mantiene")).toBeVisible();
    expect(within(dialog).getByText("Antes del mes elegido")).toBeVisible();
    expect(
      within(dialog).getByText(`${money(500)} → ${money(480)}`),
    ).toBeVisible();

    await user.click(confirm);

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      schoolFeeConceptId: 2,
      repriceFromMonth: 5,
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", {
          name: "Cambiar el precio de la matrícula",
        }),
      ).toBeNull(),
    );
  });

  it("asks the month on a change of shift", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await pick(user, /Turno/, "Tarde");
    await pick(user, /Sección/, "A");
    await save(user);

    expect(
      await screen.findByRole("dialog", {
        name: "Cambiar el precio de la matrícula",
      }),
    ).toBeVisible();
  });

  it("does not save when staff go back from the month", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    const dialog = await screen.findByRole("dialog", {
      name: "Cambiar el precio de la matrícula",
    });
    await user.click(within(dialog).getByRole("button", { name: "Volver" }));

    await waitFor(() =>
      expect(screen.queryByText("El nuevo precio se aplica desde")).toBeNull(),
    );
    expect(dataProvider.update).not.toHaveBeenCalled();
  });

  it("sends no month when no pensión is left to price", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentChange.mockResolvedValue({ lines: [] });
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);

    expect(
      await screen.findByText(/no tiene pensiones vigentes/),
    ).toBeVisible();
    const dialog = screen.getByRole("dialog", {
      name: "Cambiar el precio de la matrícula",
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Guardar cambios" }),
    );

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      schoolFeeConceptId: 2,
    });
  });

  it("shows why the change cannot be priced, and keeps it from saving", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentChange.mockRejectedValue(
      new HttpError("No hay tarifas configuradas.", 404, {}),
    );
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);

    expect(
      await screen.findByText("No hay tarifas configuradas."),
    ).toBeVisible();
    const dialog = screen.getByRole("dialog", {
      name: "Cambiar el precio de la matrícula",
    });
    expect(
      within(dialog).getByRole("button", { name: "Guardar cambios" }),
    ).toBeDisabled();
  });

  it("asks again after a refused save, and not after a saved one", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.update.mockRejectedValueOnce(
      conflict("Un cargo de la matrícula cambió mientras se procesaba."),
    );
    const user = await renderDialog(dataProvider);
    const confirmMonth = async () => {
      await pick(user, /se aplica desde/, "mayo");
      await screen.findByText("1 pensión cambia de precio.");
      await user.click(
        within(
          screen.getByRole("dialog", {
            name: "Cambiar el precio de la matrícula",
          }),
        ).getByRole("button", { name: "Guardar cambios" }),
      );
    };

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    await confirmMonth();
    expect(
      await screen.findByText(/cambió mientras se procesaba/),
    ).toBeVisible();

    // Refused: the price still has not changed, so the month is asked again.
    await save(user);
    await confirmMonth();
    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(2));

    // Saved: another save of the same values moves no price and sends no month.
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", {
          name: "Cambiar el precio de la matrícula",
        }),
      ).toBeNull(),
    );
    await save(user);
    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(3));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      schoolFeeConceptId: 2,
    });
  });

  it("shows a 422 on levelId on the field", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.update.mockRejectedValue(
      invalid({ levelId: "El grado no pertenece al nivel indicado." }),
    );
    const user = await renderDialog(dataProvider);

    await pick(user, /Sección/, "B");
    await save(user);

    expect(
      await screen.findByText("El grado no pertenece al nivel indicado."),
    ).toBeVisible();
  });
});

describe("EnrollmentsDialog — annulling", { timeout: 30_000 }, () => {
  const annul = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole("button", { name: "Anular" }));
    await user.click(screen.getByRole("button", { name: "Sí" }));
  };

  it("sends Cancelada and says the charges left Caja", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);
    dataProvider.getList.mockImplementation(async (resource: string) =>
      resource === "enrollments"
        ? { data: [summaryIn("Cancelada")], total: 1 }
        : { data: lookups[resource] ?? [], total: 0 },
    );

    await annul(user);

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      stateName: "Cancelada",
    });
    expect(await screen.findByText(/Matrícula anulada/)).toBeVisible();
  });

  it("says so when a returning student's enrollment comes back Retirada", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);
    dataProvider.getList.mockImplementation(async (resource: string) =>
      resource === "enrollments"
        ? { data: [summaryIn("Retirada")], total: 1 }
        : { data: lookups[resource] ?? [], total: 0 },
    );

    await annul(user);

    expect(await screen.findByText(/queda como Retirada/)).toBeVisible();
  });

  it("shows the API's 409 when something is paid", async () => {
    const dataProvider = makeDataProvider();
    const message =
      "No se puede anular una matrícula con pagos o comprobantes. Registre el retiro.";
    dataProvider.update.mockRejectedValue(conflict(message));
    const user = await renderDialog(dataProvider);

    await annul(user);

    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getByRole("button", { name: "Anular" })).toBeVisible();
  });
});

describe("EnrollmentsDialog — withdrawing", { timeout: 30_000 }, () => {
  const openWithDate = async (
    user: ReturnType<typeof userEvent.setup>,
    date = "2027-05-01",
  ) => {
    await user.click(await screen.findByRole("button", { name: "Retirar" }));
    const field = await screen.findByLabelText(/Fecha de retiro/);
    await user.clear(field);
    await user.type(field, date);
  };
  const confirmButton = () =>
    screen.getByRole("button", { name: "Confirmar retiro" });

  it("needs a date before it can be confirmed", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await user.click(await screen.findByRole("button", { name: "Retirar" }));

    expect(confirmButton()).toBeDisabled();
    expect(dataProvider.previewEnrollmentWithdrawal).not.toHaveBeenCalled();
  });

  it("shows what stays and what goes, then sends the date", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await openWithDate(user);

    expect(await screen.findByText("Pensión Junio - 2027")).toBeVisible();
    expect(dataProvider.previewEnrollmentWithdrawal).toHaveBeenCalledWith(
      25,
      "2027-05-01",
    );
    expect(screen.getByText(/Las pensiones hasta mayo/)).toBeVisible();
    expect(screen.getByText("Pensión Julio - 2027")).toBeVisible();
    expect(screen.getByText(/revisar su precio desde junio/)).toBeVisible();

    await user.click(confirmButton());

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      stateName: "Retirada",
      withdrawalDate: "2027-05-01",
    });
  });

  it("offers the listed sibling once withdrawn", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await openWithDate(user);
    await screen.findByText("Pensión Junio - 2027");
    expect(screen.queryByRole("link", { name: "Hermana Prueba" })).toBeNull();
    await user.click(confirmButton());

    const link = await screen.findByRole("link", { name: "Hermana Prueba" });
    expect(link.getAttribute("href")).toContain("/students/9");
  });

  it("says when a sibling has no month left to change", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentWithdrawal.mockResolvedValue({
      voided: [],
      keptPaid: [],
      siblings: [{ ...withdrawal.siblings[0], repriceFromMonth: null }],
    });
    const user = await renderDialog(dataProvider);

    await openWithDate(user, "2027-12-15");

    expect(await screen.findByText("Ninguna pensión se anula.")).toBeVisible();
    expect(screen.getByText(/ya no quedan meses/)).toBeVisible();
  });

  it("shows a date out of range on the field and keeps it from confirming", async () => {
    const dataProvider = makeDataProvider();
    const message =
      "La fecha de retiro debe estar entre la fecha de matrícula y hoy.";
    dataProvider.previewEnrollmentWithdrawal.mockRejectedValue(
      invalid({ withdrawalDate: message }),
    );
    const user = await renderDialog(dataProvider);

    await openWithDate(user, "2030-01-01");

    expect(await screen.findByText(message)).toBeVisible();
    expect(confirmButton()).toBeDisabled();
    expect(dataProvider.update).not.toHaveBeenCalled();
  });

  it("stays open and shows the API's refusal at the confirm", async () => {
    const dataProvider = makeDataProvider();
    const message = "Solo se puede retirar una matrícula activa.";
    dataProvider.update.mockRejectedValue(conflict(message));
    const user = await renderDialog(dataProvider);

    await openWithDate(user);
    await screen.findByText("Pensión Junio - 2027");
    await user.click(confirmButton());

    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getByLabelText(/Fecha de retiro/)).toBeVisible();
  });
});

describe("EnrollmentsDialog — reactivating", { timeout: 30_000 }, () => {
  const open = async (
    user: ReturnType<typeof userEvent.setup>,
    label: string,
  ) => user.click(await screen.findByRole("button", { name: label }));
  const dialog = () =>
    screen.getByRole("dialog", { name: "Reactivar matrícula" });
  const reactivate = () =>
    within(dialog()).getByRole("button", { name: "Reactivar" });

  it("asks grace and the first month, and sends both", async () => {
    const dataProvider = makeDataProvider("Cancelada");
    const user = await renderDialog(dataProvider);

    await open(user, "Reactivar");

    await user.click(await screen.findByRole("radio", { name: "1 día" }));
    await user.click(
      await screen.findByRole("radio", { name: "No, desde mayo" }),
    );
    await user.click(reactivate());

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      stateName: "Activa",
      graceDays: 1,
      billEnrollmentMonth: false,
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Reactivar matrícula" }),
      ).toBeNull(),
    );
  });

  it("does not reactivate until the first month is answered", async () => {
    const dataProvider = makeDataProvider("Retirada");
    const user = await renderDialog(dataProvider);

    await open(user, "Restaurar");
    await screen.findByRole("radio", { name: "No, desde mayo" });
    await waitFor(() => expect(reactivate()).toBeEnabled());
    await user.click(reactivate());

    expect(
      await screen.findByText("Indica si se cobra la pensión de este mes."),
    ).toBeVisible();
    expect(dataProvider.update).not.toHaveBeenCalled();
  });

  it("asks only the grace when the API poses no question", async () => {
    const dataProvider = makeDataProvider("Cancelada");
    dataProvider.previewEnrollment.mockResolvedValue({
      charges: [],
      warnings: [],
      eligibility: null,
      enrollmentDate: "2027-01-10",
      enrollmentMonthChoice: null as unknown as number,
    });
    const user = await renderDialog(dataProvider);

    await open(user, "Reactivar");
    await waitFor(() => expect(reactivate()).toBeEnabled());
    await user.click(reactivate());

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      stateName: "Activa",
      graceDays: 0,
      billEnrollmentMonth: true,
    });
  });

  it("does not list the charges of a new enrollment", async () => {
    await renderDialog(makeDataProvider("Cancelada")).then((user) =>
      open(user, "Reactivar"),
    );

    await screen.findByRole("radio", { name: "1 día" });
    expect(screen.queryByText("Cobros que se generarán")).toBeNull();
  });

  it("stays open and shows the API's refusal", async () => {
    const dataProvider = makeDataProvider("Cancelada");
    dataProvider.update.mockRejectedValue(
      new HttpError("El año escolar no está activo.", 400, {}),
    );
    const user = await renderDialog(dataProvider);

    await open(user, "Reactivar");
    await user.click(
      await screen.findByRole("radio", { name: "Sí, desde abril" }),
    );
    await user.click(reactivate());

    expect(
      await screen.findByText("El año escolar no está activo."),
    ).toBeVisible();
    expect(dialog()).toBeVisible();
  });
});
