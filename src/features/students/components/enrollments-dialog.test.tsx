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
  "payment-methods": [
    { id: 1, name: "Efectivo" },
    { id: 2, name: "Yape" },
  ],
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
  paid: 0,
  excess: 0,
  creditNote: false,
  outcome,
  ...patch,
});

const withdrawal: EnrollmentWithdrawalPreview = {
  withdrawalDate: "2027-04-20",
  minDate: "2027-04-05",
  maxDate: "2027-05-05",
  totalExcess: 0,
  creditable: 0,
  creditRefusal: null as string | null,
  voided: [{ month: 6, description: "Pensión Junio - 2027", net: 500 }],
  reversed: [],
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
    previewEnrollmentChange: vi.fn(async () => ({
      fromMonth: 4 as number | null,
      totalExcess: 0,
      creditable: 0,
      creditRefusal: null as string | null,
      lines: [
        line(3, "IN_FORCE"),
        line(4, "REPRICED"),
        line(5, "UNCHANGED", { newNet: 500 }),
      ],
    })),
    // Without a date the API answers for its today.
    previewEnrollmentWithdrawal: vi.fn(
      async (_id: unknown, date: string | null) => ({
        ...withdrawal,
        withdrawalDate: date ?? withdrawal.withdrawalDate,
      }),
    ),
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

  it("saves a change of section with no preview", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await pick(user, /Sección/, "B");
    await save(user);

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({ ...placement, sectionId: 2 });
    expect(dataProvider.previewEnrollmentChange).not.toHaveBeenCalled();
  });

  const repriceDialog = () =>
    screen.findByRole("dialog", { name: "Cambiar el precio de la matrícula" });
  const confirmIn = (dialog: HTMLElement) =>
    within(dialog).getByRole("button", { name: "Guardar cambios" });

  it("shows the new prices from the API's month and saves with no settlement", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);

    const dialog = await repriceDialog();
    expect(await within(dialog).findByText(/rige desde abril/)).toBeVisible();
    expect(dataProvider.previewEnrollmentChange).toHaveBeenLastCalledWith(25, {
      levelId: 1,
      shiftId: 1,
      schoolFeeConceptId: 2,
    });
    expect(
      within(dialog).getByText(/1 pensión cambia de precio/),
    ).toBeVisible();
    expect(within(dialog).getByText("En curso, se mantiene")).toBeVisible();
    expect(within(dialog).getByText("Sin cambio")).toBeVisible();
    expect(
      within(dialog).getByText(`${money(500)} → ${money(480)}`),
    ).toBeVisible();
    // Nothing paid is given back, so nothing about the money is asked.
    expect(within(dialog).queryByText(/Saldo a favor/)).toBeNull();

    await user.click(confirmIn(dialog));

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      schoolFeeConceptId: 2,
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", {
          name: "Cambiar el precio de la matrícula",
        }),
      ).toBeNull(),
    );
  });

  it("asks before saving a change of shift", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await pick(user, /Turno/, "Tarde");
    await pick(user, /Sección/, "A");
    await save(user);

    expect(await repriceDialog()).toBeVisible();
  });

  it("does not save when staff go back", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    const dialog = await repriceDialog();
    await user.click(within(dialog).getByRole("button", { name: "Volver" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", {
          name: "Cambiar el precio de la matrícula",
        }),
      ).toBeNull(),
    );
    expect(dataProvider.update).not.toHaveBeenCalled();
  });

  it("saves the change when no pensión is left to price", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentChange.mockResolvedValue({
      fromMonth: null,
      totalExcess: 0,
      creditable: 0,
      creditRefusal: null as string | null,
      lines: [],
    });
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);

    expect(
      await screen.findByText(/no tiene pensiones vigentes/),
    ).toBeVisible();
    await user.click(confirmIn(await repriceDialog()));

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      schoolFeeConceptId: 2,
    });
  });

  it("says when every month has started", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentChange.mockResolvedValue({
      fromMonth: null,
      totalExcess: 0,
      creditable: 0,
      creditRefusal: null as string | null,
      lines: [line(12, "IN_FORCE")],
    });
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);

    expect(
      await screen.findByText(/Todos los meses ya empezaron/),
    ).toBeVisible();
  });

  it("asks how a paid month's excess goes back, and sends it", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentChange.mockResolvedValue({
      fromMonth: 4,
      totalExcess: 20,
      creditable: 20,
      creditRefusal: null as string | null,
      lines: [line(4, "REPRICED", { paid: 500, excess: 20, creditNote: true })],
    });
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    const dialog = await repriceDialog();

    expect(
      await within(dialog).findByText(
        new RegExp(`se devuelven ${money(20)} con nota de crédito`),
      ),
    ).toBeVisible();
    expect(
      within(dialog).getByText(new RegExp(`Saldo a favor.*${money(20)}`)),
    ).toBeVisible();
    expect(confirmIn(dialog)).toBeDisabled();

    await user.click(within(dialog).getByRole("radio", { name: /Devolverlo/ }));
    // A refund goes out by some method.
    expect(confirmIn(dialog)).toBeDisabled();
    await pick(user, /Medio de devolución/, "Yape");
    await user.click(confirmIn(dialog));

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      schoolFeeConceptId: 2,
      excessTreatment: "REFUND",
      refundPaymentMethodId: 2,
    });
  });

  it("offers no credit the API would refuse, and says why", async () => {
    const dataProvider = makeDataProvider();
    const reason =
      "La pensión no tiene comprobante. Registre la devolución en lugar del crédito.";
    dataProvider.previewEnrollmentChange.mockResolvedValue({
      fromMonth: 4,
      totalExcess: 20,
      creditable: 0,
      creditRefusal: reason,
      lines: [line(4, "REPRICED", { paid: 500, excess: 20 })],
    });
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    const dialog = await repriceDialog();

    expect(
      await within(dialog).findByRole("radio", { name: /Descontarlo/ }),
    ).toBeDisabled();
    expect(within(dialog).getByText(reason)).toBeVisible();
  });

  it("asks the method up front when a credit covers only part of it", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentChange.mockResolvedValue({
      fromMonth: 4,
      totalExcess: 20,
      creditable: 15,
      creditRefusal: null,
      lines: [line(4, "REPRICED", { paid: 500, excess: 20 })],
    });
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    const dialog = await repriceDialog();
    await user.click(
      await within(dialog).findByRole("radio", {
        name: /Descontar S\/\s15\.00 .*devolver el resto/,
      }),
    );

    expect(
      within(dialog).getByText(`${money(5)} se devuelven por este medio.`),
    ).toBeVisible();
    expect(confirmIn(dialog)).toBeDisabled();
    await pick(user, /Medio de devolución/, "Efectivo");
    await user.click(confirmIn(dialog));

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toMatchObject({
      excessTreatment: "CREDIT",
      refundPaymentMethodId: 1,
    });
  });

  it("keeps the dialog open on a refused settlement, for the method to be added", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentChange.mockResolvedValue({
      fromMonth: 4,
      totalExcess: 20,
      creditable: 20,
      creditRefusal: null as string | null,
      lines: [line(4, "REPRICED", { paid: 500, excess: 20 })],
    });
    const message = "Indique el medio por el que se devuelve el dinero.";
    dataProvider.update.mockRejectedValueOnce(
      invalid({ refundPaymentMethodId: message }),
    );
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    const dialog = await repriceDialog();
    await user.click(
      await within(dialog).findByRole("radio", { name: /Descontarlo/ }),
    );
    // A credit may find debt for all of it: no method is needed up front.
    await user.click(confirmIn(dialog));

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toMatchObject({
      excessTreatment: "CREDIT",
      refundPaymentMethodId: null,
    });
    expect(await within(dialog).findByText(message)).toBeVisible();

    await pick(user, /Medio de devolución/, "Efectivo");
    await user.click(confirmIn(dialog));

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(2));
    expect(lastBody(dataProvider)).toMatchObject({
      excessTreatment: "CREDIT",
      refundPaymentMethodId: 1,
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", {
          name: "Cambiar el precio de la matrícula",
        }),
      ).toBeNull(),
    );
  });

  it("says when the change issued comprobantes still to send", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.update.mockResolvedValue({
      data: { ...detail, issuedDocumentIds: [7, 8] },
    } as never);
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    const dialog = await repriceDialog();
    await within(dialog).findByText(/rige desde abril/);
    await user.click(confirmIn(dialog));

    expect(
      await screen.findByText(/Se emitieron 2 comprobantes/),
    ).toBeVisible();
  });

  it("says when a credit was refunded instead, with the comprobantes to send", async () => {
    const dataProvider = makeDataProvider();
    const notice =
      "No hay cargos pendientes para acreditar: S/ 20.00 se devolvieron en lugar del crédito.";
    dataProvider.previewEnrollmentChange.mockResolvedValue({
      fromMonth: 12,
      totalExcess: 20,
      creditable: 20,
      creditRefusal: null as string | null,
      lines: [line(12, "REPRICED", { paid: 500, excess: 20 })],
    });
    dataProvider.update.mockResolvedValue({
      data: {
        ...detail,
        issuedDocumentIds: [7],
        refundedInsteadOfCredit: 20,
        notice,
      },
    } as never);
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    const dialog = await repriceDialog();
    await user.click(
      await within(dialog).findByRole("radio", { name: /Descontarlo/ }),
    );
    await pick(user, /Medio de devolución/, "Efectivo");
    await user.click(confirmIn(dialog));

    expect(
      await screen.findByText(
        `Matrícula actualizada. ${notice} Se emitió 1 comprobante: envíalo a SUNAT desde Comprobantes.`,
      ),
    ).toBeVisible();
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
    expect(confirmIn(await repriceDialog())).toBeDisabled();
  });

  it("stays open on a refused save, and asks nothing after a saved one", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.update.mockRejectedValueOnce(
      conflict("Un cargo de la matrícula cambió mientras se procesaba."),
    );
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    const dialog = await repriceDialog();
    await within(dialog).findByText(/rige desde abril/);
    await user.click(confirmIn(dialog));

    // Refused: the dialog stays, the change is priced again, and it can retry.
    expect(
      await within(dialog).findByText(/cambió mientras se procesaba/),
    ).toBeVisible();
    await waitFor(() =>
      expect(dataProvider.previewEnrollmentChange).toHaveBeenCalledTimes(2),
    );
    await user.click(confirmIn(dialog));
    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(2));

    // Saved: another save of the same values moves no price and asks nothing.
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", {
          name: "Cambiar el precio de la matrícula",
        }),
      ).toBeNull(),
    );
    await save(user);
    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(3));
    expect(dataProvider.previewEnrollmentChange).toHaveBeenCalledTimes(2);
  });

  it("keeps a refused credit open, for staff to refund instead", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentChange.mockResolvedValue({
      fromMonth: 4,
      totalExcess: 20,
      creditable: 20,
      creditRefusal: null as string | null,
      lines: [line(4, "REPRICED", { paid: 500, excess: 20 })],
    });
    const message =
      "La pensión no tiene comprobante. Registre la devolución en lugar del crédito.";
    dataProvider.update.mockRejectedValueOnce(conflict(message));
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    const dialog = await repriceDialog();
    await user.click(
      await within(dialog).findByRole("radio", { name: /Descontarlo/ }),
    );
    await user.click(confirmIn(dialog));

    expect(await within(dialog).findByText(message)).toBeVisible();

    // Changing the settlement retires the refusal.
    await user.click(within(dialog).getByRole("radio", { name: /Devolverlo/ }));
    expect(within(dialog).queryByText(message)).toBeNull();
    await pick(user, /Medio de devolución/, "Efectivo");
    await user.click(confirmIn(dialog));

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(2));
    expect(lastBody(dataProvider)).toMatchObject({
      excessTreatment: "REFUND",
      refundPaymentMethodId: 1,
    });
  });

  it("says a settlement refusal even when the preview showed nothing to give back", async () => {
    const dataProvider = makeDataProvider();
    const message =
      "Indique si el saldo a favor se devuelve o se usa como crédito.";
    dataProvider.update.mockRejectedValueOnce(
      invalid({ excessTreatment: message }),
    );
    const user = await renderDialog(dataProvider);

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await save(user);
    const dialog = await repriceDialog();
    await within(dialog).findByText(/rige desde abril/);
    await user.click(confirmIn(dialog));

    expect(await within(dialog).findByText(message)).toBeVisible();
    await waitFor(() =>
      expect(dataProvider.previewEnrollmentChange).toHaveBeenCalledTimes(2),
    );
  });

  it("notifies a settlement 422 when no price changed", async () => {
    const dataProvider = makeDataProvider();
    const message = "Indique el medio por el que se devuelve el dinero.";
    dataProvider.update.mockRejectedValueOnce(
      invalid({ refundPaymentMethodId: message }),
    );
    const user = await renderDialog(dataProvider);

    await pick(user, /Sección/, "B");
    await save(user);

    expect(await screen.findByText(message)).toBeVisible();
  });

  it("warns about an unsaved edit, and locks annul and withdraw during a save", async () => {
    const dataProvider = makeDataProvider();
    let finishSave: (value: { data: typeof detail }) => void = () => undefined;
    dataProvider.update.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
    const user = await renderDialog(dataProvider);

    await screen.findByRole("button", { name: "Anular" });
    const hint = /cambios sin guardar/;
    expect(screen.queryByText(hint)).toBeNull();

    await pick(user, /Sección/, "B");
    expect(await screen.findByText(hint)).toBeVisible();

    await save(user);
    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Anular" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Retirar" })).toBeDisabled();

    finishSave({ data: detail });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Anular" })).toBeEnabled(),
    );
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

  it("drops an unsaved edit once the state changes, and sends the saved values", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);
    dataProvider.getList.mockImplementation(async (resource: string) =>
      resource === "enrollments"
        ? { data: [summaryIn("Retirada")], total: 1 }
        : { data: lookups[resource] ?? [], total: 0 },
    );

    await pick(user, /Concepto de Cobro/, "Dscto hermano");
    await annul(user);

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toMatchObject({ schoolFeeConceptId: 1 });
    await screen.findByText(/queda como Retirada/);
    await user.click(screen.getByRole("button", { name: /2027/ }));
    expect(
      await screen.findByRole("combobox", { name: /Concepto de Cobro/ }),
    ).toHaveTextContent("Normal");
  });

  it("does not leave the question open when the row closes", async () => {
    const user = await renderDialog(makeDataProvider());

    await user.click(await screen.findByRole("button", { name: "Anular" }));
    await user.click(screen.getByRole("button", { name: /2027/ }));
    await user.click(screen.getByRole("button", { name: /2027/ }));

    expect(await screen.findByRole("button", { name: "Anular" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Sí" })).toBeNull();
  });

  it("does not claim an outcome when the list cannot be read again", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);
    dataProvider.getList.mockImplementation(async (resource: string) => {
      if (resource === "enrollments") throw new Error("offline");
      return { data: lookups[resource] ?? [], total: 0 };
    });

    await annul(user);

    expect(
      await screen.findByText(/no se pudo leer su nuevo estado/, undefined, {
        timeout: 15_000,
      }),
    ).toBeVisible();
    expect(screen.queryByText(/Matrícula anulada/)).toBeNull();
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

  it("proposes the API's today, within the dates it takes", async () => {
    const dataProvider = makeDataProvider();
    const user = await renderDialog(dataProvider);

    await user.click(await screen.findByRole("button", { name: "Retirar" }));

    const field = await screen.findByLabelText(/Fecha de retiro/);
    await waitFor(() => expect(field).toHaveValue("2027-04-20"));
    expect(dataProvider.previewEnrollmentWithdrawal).toHaveBeenCalledWith(
      25,
      null,
    );
    expect(field).toHaveAttribute("min", "2027-04-05");
    expect(field).toHaveAttribute("max", "2027-05-05");
    expect(await screen.findByText("Pensión Junio - 2027")).toBeVisible();

    await user.click(confirmButton());
    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      stateName: "Retirada",
      withdrawalDate: "2027-04-20",
    });
  });

  it("needs a date when staff clear it", async () => {
    const user = await renderDialog(makeDataProvider());

    await user.click(await screen.findByRole("button", { name: "Retirar" }));
    const field = await screen.findByLabelText(/Fecha de retiro/);
    await waitFor(() => expect(field).toHaveValue("2027-04-20"));
    await user.clear(field);

    expect(await screen.findByText(/Indica la fecha/)).toBeVisible();
    expect(confirmButton()).toBeDisabled();
  });

  it("gives back what paid months after the date hold, as staff choose", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentWithdrawal.mockImplementation(
      async (_id: unknown, date: string | null) => ({
        ...withdrawal,
        withdrawalDate: date ?? withdrawal.withdrawalDate,
        totalExcess: 480,
        creditable: 480,
        creditRefusal: null as string | null,
        reversed: [
          {
            month: 7,
            description: "Pensión Julio - 2027",
            net: 480,
            paid: 480,
            excess: 480,
            creditNote: true,
          },
        ],
        siblings: [],
      }),
    );
    const user = await renderDialog(dataProvider);

    await openWithDate(user);

    expect(await screen.findByText("Pensión Julio - 2027")).toBeVisible();
    expect(screen.getByText("Con nota de crédito")).toBeVisible();
    expect(
      screen.getByText(new RegExp(`Saldo a favor.*${money(480)}`)),
    ).toBeVisible();
    expect(confirmButton()).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /Descontarlo/ }));
    await user.click(confirmButton());

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(lastBody(dataProvider)).toEqual({
      ...placement,
      stateName: "Retirada",
      withdrawalDate: "2027-05-01",
      excessTreatment: "CREDIT",
      refundPaymentMethodId: null,
    });
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
    // In its own tab: the list stays for the next sibling.
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("says when a sibling has no month left to change", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentWithdrawal.mockResolvedValue({
      ...withdrawal,
      voided: [],
      siblings: [{ ...withdrawal.siblings[0], repriceFromMonth: null }],
    });
    const user = await renderDialog(dataProvider);

    await openWithDate(user, "2027-12-15");

    expect(await screen.findByText("Ninguna pensión se anula.")).toBeVisible();
    expect(screen.getByText(/ya no quedan meses/)).toBeVisible();
  });

  it("shows a refused settlement on its field, and lets it be fixed", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewEnrollmentWithdrawal.mockImplementation(
      async (_id: unknown, date: string | null) => ({
        ...withdrawal,
        withdrawalDate: date ?? withdrawal.withdrawalDate,
        totalExcess: 480,
        creditable: 480,
        creditRefusal: null as string | null,
        reversed: [
          {
            month: 7,
            description: "Pensión Julio - 2027",
            net: 480,
            paid: 480,
            excess: 480,
            creditNote: false,
          },
        ],
        siblings: [],
      }),
    );
    const message = "Indique el medio por el que se devuelve el dinero.";
    dataProvider.update.mockRejectedValueOnce(
      invalid({ refundPaymentMethodId: message }),
    );
    const user = await renderDialog(dataProvider);

    await openWithDate(user);
    await screen.findByText("Pensión Julio - 2027");
    await user.click(screen.getByRole("radio", { name: /Descontarlo/ }));
    await user.click(confirmButton());

    expect(await screen.findByText(message)).toBeVisible();
    expect(confirmButton()).toBeDisabled();

    await pick(user, /Medio de devolución/, "Yape");
    expect(screen.queryByText(message)).toBeNull();
    expect(confirmButton()).toBeEnabled();
    await user.click(confirmButton());

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(2));
    expect(lastBody(dataProvider)).toMatchObject({
      excessTreatment: "CREDIT",
      refundPaymentMethodId: 2,
    });
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

  it("can try again after a failure that is not the API's refusal", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.update.mockRejectedValueOnce(new Error("Failed to fetch"));
    const user = await renderDialog(dataProvider);

    await openWithDate(user);
    await screen.findByText("Pensión Junio - 2027");
    await user.click(confirmButton());

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText(
        "No se pudo registrar el retiro. Inténtalo de nuevo.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Pensión Junio - 2027")).toBeVisible();
    expect(confirmButton()).toBeEnabled();

    await user.click(confirmButton());
    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(2));
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
    expect(confirmButton()).toBeDisabled();
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

    await open(user, "Reactivar");
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
