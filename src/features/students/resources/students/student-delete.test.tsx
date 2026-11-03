import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { HttpError, Notification } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import type { StudentDeletionPreview } from "@/types/student";
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
  previewEnrollmentWithdrawal: vi.fn(async () => ({
    voided: [{ month: 6, description: "Pensión Junio - 2027", net: 500 }],
    keptPaid: [],
    siblings: [],
  })),
});

type FakeDataProvider = ReturnType<typeof makeDataProvider>;

const renderEdit = (dataProvider: FakeDataProvider) =>
  renderWithAdmin(
    <>
      <Routes>
        <Route path="/students/:id/*" element={<StudentEdit />} />
        <Route path="/students" element={<p>Listado</p>} />
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
    expect(boxes).toHaveLength(3);
    expect(
      within(dialog).getByText("Se eliminará una deuda vencida de S/ 1000.00."),
    ).toBeVisible();
    expect(within(dialog).getByText(/Hermana Prueba/)).toBeVisible();
    expect(
      within(dialog).getByText(/revisar su precio desde junio/),
    ).toBeVisible();

    await user.click(boxes[0]);
    await user.click(boxes[1]);
    expect(deleteButton(dialog)).toBeDisabled();
    await user.click(boxes[2]);
    expect(deleteButton(dialog)).toBeEnabled();

    await user.click(deleteButton(dialog));

    await waitFor(() =>
      expect(dataProvider.delete).toHaveBeenCalledWith(
        "students",
        expect.objectContaining({ meta: { confirmWarnings: true } }),
      ),
    );
    // The siblings' price is staff's to fix: each opens from here.
    expect(
      await screen.findByRole("link", { name: "Hermana Prueba" }),
    ).toHaveAttribute("href", expect.stringContaining("/students/9"));
    await user.click(screen.getByRole("button", { name: "Listo" }));
    expect(await screen.findByText("Listado")).toBeInTheDocument();
  });

  it("shows the API's 409 as it comes and stays on the student", async () => {
    const dataProvider = makeDataProvider();
    const message =
      "La matrícula tiene pagos o comprobantes; registre el retiro.";
    dataProvider.delete.mockRejectedValueOnce(
      new HttpError(message, 409, { message }),
    );
    const { user, dialog } = await openDeletion(dataProvider);

    await user.click(
      await within(dialog).findByRole("button", {
        name: "Eliminar estudiante",
      }),
    );

    expect(await within(dialog).findByText(message)).toBeVisible();
    expect(screen.queryByText("Listado")).not.toBeInTheDocument();
    // The situation changed: the preview is asked again.
    await waitFor(() =>
      expect(dataProvider.previewStudentDeletion).toHaveBeenCalledTimes(2),
    );
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

    await user.click(
      within(dialog).getByRole("button", { name: "Anular matrícula" }),
    );

    await waitFor(() => expect(dataProvider.update).toHaveBeenCalledTimes(1));
    expect(dataProvider.update).toHaveBeenCalledWith(
      "enrollments",
      expect.objectContaining({
        id: 25,
        data: { ...placement, stateName: "Cancelada" },
      }),
    );
    expect(dataProvider.delete).not.toHaveBeenCalled();
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
    await user.type(field, "2027-05-01");
    expect(await screen.findByText("Pensión Junio - 2027")).toBeVisible();
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
