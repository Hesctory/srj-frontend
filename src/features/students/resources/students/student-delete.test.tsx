import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { HttpError, Notification } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import { StudentEdit } from "./student-edit";

const makeDataProvider = () => ({
  getOne: vi.fn(async () => ({
    data: { id: 4, names: "Ana", familiars: [{ id: 1, isGuardian: true }] },
  })),
  getList: vi.fn(async () => ({ data: [], total: 0 })),
  getMany: vi.fn(async () => ({ data: [] })),
  delete: vi.fn(async () => ({ data: { id: 4 } })),
});

const renderEdit = (dataProvider: ReturnType<typeof makeDataProvider>) =>
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

describe("Deleting a student", { timeout: 60_000 }, () => {
  beforeEach(() => {
    window.location.hash = "#/students/4";
  });

  it("shows the API's 409 and stays on the student, delete not treated as done", async () => {
    const user = userEvent.setup();
    const dataProvider = makeDataProvider();
    const message =
      "El estudiante tiene matrículas registradas; no se puede eliminar.";
    dataProvider.delete.mockRejectedValueOnce(
      new HttpError(message, 409, { message }),
    );
    renderEdit(dataProvider);

    await user.click(
      await screen.findByRole(
        "button",
        { name: "Eliminar" },
        { timeout: 5_000 },
      ),
    );
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: /Confirmar|Aceptar|Eliminar/,
      }),
    );

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText("Listado")).not.toBeInTheDocument();
    expect(dataProvider.delete).toHaveBeenCalledTimes(1);
  });
});
