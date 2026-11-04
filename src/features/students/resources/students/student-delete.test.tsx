import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { HttpError, Notification } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import type { StudentDeletionPreview } from "@/types/student";
import { DeletedStudentSiblings } from "@/features/students/components/deleted-student-siblings";
import { StudentEdit } from "./student-edit";

const placement = {
  levelId: 1,
  gradeId: 2,
  shiftId: 1,
  sectionId: 3,
  schoolFeeConceptId: 5,
  previousSchool: null,
  documents: [],
};

const deletable: StudentDeletionPreview = {
  outcome: "DELETE",
  reason: null,
  message: "El estudiante se puede eliminar.",
  enrollmentId: 25,
  warnings: [],
  siblings: [],
};

const withWarnings: StudentDeletionPreview = {
  ...deletable,
  warnings: [
    {
      code: "CLASSES_STARTED",
      message:
        "Ya empezaron las clases. Confirme que el estudiante no asistió.",
      amount: null,
    },
    {
      code: "OVERDUE_DEBT",
      message: "Se eliminará una deuda vencida de S/ 1000.00.",
      amount: 1000,
    },
    {
      code: "VOIDED_PAYMENT",
      message: "El estudiante tuvo pagos que luego se anularon.",
      amount: null,
    },
    {
      code: "SIBLING_DISCOUNT",
      message: "Hay hermanos con descuento por hermano; revise su precio.",
      amount: null,
    },
  ],
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

const instead = (
  outcome: StudentDeletionPreview["outcome"],
  message: string,
  enrollmentId: number | null = 25,
): StudentDeletionPreview => ({
  outcome,
  reason: "STUDIED_BEFORE",
  message,
  enrollmentId,
  warnings: [],
  siblings: [],
});

const makeDataProvider = (preview: StudentDeletionPreview = deletable) => ({
  getOne: vi.fn(async (resource: string) =>
    resource === "enrollments"
      ? { data: { id: 25, studentId: 4, ...placement } }
      : {
          data: {
            id: 4,
            names: "Ana",
            familiars: [{ id: 1, isGuardian: true }],
          },
        },
  ),
  getList: vi.fn(async (resource: string) =>
    resource === "enrollments"
      ? {
          data: [
            {
              id: 25,
              year: 2027,
              level: "Primaria",
              grade: "1ro",
              shift: "Mañana",
              section: "A",
              state: "Activa",
            },
          ],
          total: 1,
        }
      : { data: [], total: 0 },
  ),
  getMany: vi.fn(async () => ({ data: [] })),
  update: vi.fn(async () => ({ data: { id: 25 } })),
  delete: vi.fn(async () => ({ data: { id: 4 } })),
  previewStudentDeletion: vi.fn(async () => preview),
  // Without a date the API answers for its today.
  previewEnrollmentWithdrawal: vi.fn(async (_id: unknown, date: unknown) => ({
    withdrawalDate: (date as string | null) ?? "2027-04-20",
    minDate: "2027-04-05",
    maxDate: "2027-05-05",
    totalExcess: 0,
    voided: [{ month: 6, description: "Pensión Junio - 2027", net: 500 }],
    reversed: [],
    siblings: [],
  })),
});

type FakeDataProvider = ReturnType<typeof makeDataProvider>;

/** From now on, the student's enrollment 25 reads back in `state`. */
const enrollmentReadsBackAs = (
  dataProvider: FakeDataProvider,
  state: string,
) => {
  const original = dataProvider.getList.getMockImplementation()!;
  dataProvider.getList.mockImplementation(async (resource: string) => {
    const result = await original(resource);
    return resource === "enrollments"
      ? { ...result, data: result.data.map((row) => ({ ...row, state })) }
      : result;
  });
};

const renderEdit = (dataProvider: FakeDataProvider) =>
  renderWithAdmin(
    <>
      <Routes>
        <Route path="/students/:id/*" element={<StudentEdit />} />
        <Route
          path="/students"
          element={
            <>
              <p>Listado</p>
              <DeletedStudentSiblings />
            </>
          }
        />
      </Routes>
      <Notification />
    </>,
    { dataProvider, resource: "students" },
  );

const openDeletion = async (dataProvider: FakeDataProvider) => {
  const user = userEvent.setup();
  renderEdit(dataProvider);
  await user.click(
    await screen.findByRole("button", { name: "Eliminar" }, { timeout: 5_000 }),
  );
  const dialog = await screen.findByRole("dialog");
  return { user, dialog };
};

const deleteButton = (dialog: HTMLElement) =>
  within(dialog).getByRole("button", { name: "Eliminar estudiante" });

describe("Deleting a student", { timeout: 60_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/students/4";
  });

  it("asks once and deletes a student the preview allows, back to the list", async () => {
    const dataProvider = makeDataProvider();
    const { user, dialog } = await openDeletion(dataProvider);

    await user.click(
      await within(dialog).findByRole("button", {
        name: "Eliminar estudiante",
      }),
    );

    await waitFor(() => expect(dataProvider.delete).toHaveBeenCalledTimes(1));
    expect(dataProvider.delete).toHaveBeenCalledWith(
      "students",
      expect.objectContaining({ id: 4, meta: { confirmWarnings: false } }),
    );
    expect(dataProvider.previewStudentDeletion).toHaveBeenCalledWith(4);
    expect(await screen.findByText("Listado")).toBeInTheDocument();
    expect(await screen.findByText("Estudiante eliminado")).toBeInTheDocument();
  });

  it("needs every warning ticked, then deletes confirming them", async () => {
    const dataProvider = makeDataProvider(withWarnings);
    const { user, dialog } = await openDeletion(dataProvider);

    const boxes = await within(dialog).findAllByRole("checkbox");
    expect(boxes).toHaveLength(4);
    expect(
      within(dialog).getByText("Se eliminará una deuda vencida de S/ 1000.00."),
    ).toBeVisible();
    expect(within(dialog).getByText(/Hermana Prueba/)).toBeVisible();
    expect(
      within(dialog).getByText(/revisar su precio desde junio/),
    ).toBeVisible();

    await user.click(boxes[0]);
    await user.click(boxes[1]);
    await user.click(boxes[2]);
    expect(deleteButton(dialog)).toBeDisabled();
    await user.click(boxes[3]);
    expect(deleteButton(dialog)).toBeEnabled();

    await user.click(deleteButton(dialog));

    await waitFor(() =>
      expect(dataProvider.delete).toHaveBeenCalledWith(
        "students",
        expect.objectContaining({ meta: { confirmWarnings: true } }),
      ),
    );
    // The siblings' price is staff's to fix: the list opens them, since the
    // deleted student's page would 404.
    expect(await screen.findByText("Listado")).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Hermana Prueba" }),
    ).toHaveAttribute("href", expect.stringContaining("/students/9"));
    await user.click(screen.getByRole("button", { name: "Listo" }));
    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Hermana Prueba" })).toBeNull(),
    );
  });

  it("shows the API's 409 as it comes and stays on the student", async () => {
    const dataProvider = makeDataProvider();
    const message =
      "La matrícula tiene pagos o comprobantes; registre el retiro.";
    dataProvider.delete.mockRejectedValueOnce(
      new HttpError(message, 409, { message }),
    );
    const { user, dialog } = await openDeletion(dataProvider);

    const button = await within(dialog).findByRole("button", {
      name: "Eliminar estudiante",
    });
    // Meanwhile a payment landed: the preview now says to withdraw.
    dataProvider.previewStudentDeletion.mockResolvedValue(
      instead("WITHDRAW", "Nuevo motivo del API."),
    );
    await user.click(button);

    expect(await within(dialog).findByText(message)).toBeVisible();
    expect(screen.queryByText("Listado")).not.toBeInTheDocument();
    expect(
      await within(dialog).findByText("Nuevo motivo del API."),
    ).toBeVisible();
    expect(
      await within(dialog).findByRole("button", { name: "Registrar retiro" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Eliminar estudiante" }),
    ).not.toBeInTheDocument();
  });

  it("offers annulling the enrollment instead, through the enrollment's PUT", async () => {
    const message =
      "El estudiante tiene matrículas de otros años o finalizadas; no se elimina.";
    const dataProvider = makeDataProvider(
      instead("CANCEL_ENROLLMENT", message),
    );
    const { user, dialog } = await openDeletion(dataProvider);

    expect(await within(dialog).findByText(message)).toBeVisible();
    expect(
      within(dialog).queryByRole("button", { name: "Eliminar estudiante" }),
    ).not.toBeInTheDocument();

    enrollmentReadsBackAs(dataProvider, "Cancelada");
    await user.click(
      await within(dialog).findByRole("button", { name: "Anular matrícula" }),
    );

    expect(await screen.findByText(/Matrícula anulada/)).toBeVisible();
    expect(dataProvider.update).toHaveBeenCalledTimes(1);
    expect(dataProvider.update).toHaveBeenCalledWith(
      "enrollments",
      expect.objectContaining({
        id: 25,
        data: { ...placement, stateName: "Cancelada" },
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(dataProvider.delete).not.toHaveBeenCalled();
  });

  it("says when annulling left the enrollment Retirada instead", async () => {
    const dataProvider = makeDataProvider(
      instead("CANCEL_ENROLLMENT", "Motivo del API."),
    );
    const { user, dialog } = await openDeletion(dataProvider);

    enrollmentReadsBackAs(dataProvider, "Retirada");
    await user.click(
      await within(dialog).findByRole("button", { name: "Anular matrícula" }),
    );

    expect(await screen.findByText(/queda como Retirada/)).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("shows a refused annulment and stays open", async () => {
    const dataProvider = makeDataProvider(
      instead("CANCEL_ENROLLMENT", "Motivo del API."),
    );
    const refusal = "La matrícula ya no se puede anular.";
    dataProvider.update.mockRejectedValueOnce(
      new HttpError(refusal, 409, { message: refusal }),
    );
    const { user, dialog } = await openDeletion(dataProvider);

    await user.click(
      await within(dialog).findByRole("button", { name: "Anular matrícula" }),
    );

    expect(await within(dialog).findByText(refusal)).toBeVisible();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("says when the enrollment to act on cannot be loaded", async () => {
    const dataProvider = makeDataProvider(
      instead("CANCEL_ENROLLMENT", "Motivo del API."),
    );
    const original = dataProvider.getOne.getMockImplementation()!;
    dataProvider.getOne.mockImplementation(async (resource: string) => {
      if (resource === "enrollments") throw new HttpError("Falla", 500);
      return original(resource);
    });
    const { dialog } = await openDeletion(dataProvider);

    expect(
      await within(dialog).findByText(/No se pudo cargar la matrícula/),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("button", { name: "Anular matrícula" }),
    ).toBeDisabled();
  });

  it("offers the withdrawal instead, with its own preview and date", async () => {
    const message =
      "La matrícula tiene pagos o comprobantes; registre el retiro.";
    const dataProvider = makeDataProvider(instead("WITHDRAW", message));
    const { user, dialog } = await openDeletion(dataProvider);

    expect(await within(dialog).findByText(message)).toBeVisible();
    await user.click(
      within(dialog).getByRole("button", { name: "Registrar retiro" }),
    );

    const field = await screen.findByLabelText(/Fecha de retiro/);
    await waitFor(() => expect(field).toHaveValue("2027-04-20"));
    await user.clear(field);
    await user.type(field, "2027-05-01");
    // The preview waits for the typing to settle.
    expect(
      await screen.findByText("Pensión Junio - 2027", undefined, {
        timeout: 5_000,
      }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Confirmar retiro" }));

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(dataProvider.update).toHaveBeenCalledWith(
      "enrollments",
      expect.objectContaining({
        id: 25,
        data: {
          ...placement,
          stateName: "Retirada",
          withdrawalDate: "2027-05-01",
        },
      }),
    );
    expect(dataProvider.previewEnrollmentWithdrawal).toHaveBeenCalledWith(
      25,
      "2027-05-01",
    );
    expect(await screen.findByText("Estudiante retirado")).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("only explains a student that must be kept", async () => {
    const message =
      "El estudiante tiene matrículas de otros años o finalizadas; no se elimina.";
    const dataProvider = makeDataProvider(instead("KEEP", message, null));
    const { dialog } = await openDeletion(dataProvider);

    expect(await within(dialog).findByText(message)).toBeVisible();
    for (const name of [
      "Eliminar estudiante",
      "Anular matrícula",
      "Registrar retiro",
    ]) {
      expect(
        within(dialog).queryByRole("button", { name }),
      ).not.toBeInTheDocument();
    }
  });

  it("asks to try later while something is in process, and checks again", async () => {
    const message =
      "Hay un comprobante o una corrección de pago en proceso. Intente cuando termine.";
    const dataProvider = makeDataProvider(instead("WAIT", message, null));
    const { user, dialog } = await openDeletion(dataProvider);

    expect(await within(dialog).findByText(message)).toBeVisible();
    dataProvider.previewStudentDeletion.mockResolvedValueOnce(deletable);
    await user.click(
      within(dialog).getByRole("button", { name: "Consultar de nuevo" }),
    );

    expect(
      await within(dialog).findByRole("button", {
        name: "Eliminar estudiante",
      }),
    ).toBeEnabled();
  });

  it("says when the preview cannot be read, and lets it be tried again", async () => {
    const dataProvider = makeDataProvider();
    dataProvider.previewStudentDeletion.mockRejectedValueOnce(
      new Error("network"),
    );
    const { user, dialog } = await openDeletion(dataProvider);

    expect(
      await within(dialog).findByText(/No se pudo consultar/),
    ).toBeVisible();
    await user.click(
      within(dialog).getByRole("button", { name: "Consultar de nuevo" }),
    );

    expect(
      await within(dialog).findByRole("button", {
        name: "Eliminar estudiante",
      }),
    ).toBeEnabled();
  });
});
