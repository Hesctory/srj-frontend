import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form, Notification } from "react-admin";
import { renderWithAdmin } from "@/test/render-with-admin";
import { ConfirmCreateStudentButton } from "@/features/students/resources/students/student-create";
import MultipleFamiliarsForm, {
  familiarsProblem,
} from "./multiple-familiars-form";

const dataProvider = () => ({
  getList: vi.fn(async () => ({ data: [], total: 0 })),
  getMany: vi.fn(async () => ({ data: [] })),
});

const ONE_ONLY = "El estudiante solo puede tener un tutor.";
const NONE = "Marca a un apoderado como «Es Tutor».";

describe("familiarsProblem", () => {
  it("accepts exactly one tutor", () => {
    expect(
      familiarsProblem([{ isGuardian: true }, { isGuardian: false }, {}]),
    ).toBeNull();
  });

  it("refuses none and more than one, and an empty list", () => {
    expect(familiarsProblem([{ isGuardian: false }, {}])).toBe(NONE);
    expect(familiarsProblem([{ isGuardian: true }, { isGuardian: true }])).toBe(
      ONE_ONLY,
    );
    expect(familiarsProblem([])).toBe("Debe agregar al menos un apoderado.");
    expect(familiarsProblem(undefined)).toBe(
      "Debe agregar al menos un apoderado.",
    );
  });
});

describe("MultipleFamiliarsForm", { timeout: 60_000 }, () => {
  const renderForm = (familiars: object[], onSubmit = vi.fn()) => {
    renderWithAdmin(
      <>
        <Form defaultValues={{ familiars }} onSubmit={onSubmit}>
          <MultipleFamiliarsForm />
          <button type="submit">Guardar</button>
        </Form>
        <Notification />
      </>,
      { dataProvider: dataProvider() },
    );
    return onSubmit;
  };

  it("says so while two familiars are marked, and clears when one is left", async () => {
    const user = userEvent.setup();
    renderForm([{ isGuardian: true }, { isGuardian: true }]);

    expect(await screen.findByRole("alert")).toHaveTextContent(ONE_ONLY);

    // Only the last familiar starts expanded, so its switch is the one in reach.
    await user.click(await screen.findByRole("switch", { name: "Es Tutor" }));

    await waitFor(() =>
      expect(screen.queryByText(ONE_ONLY)).not.toBeInTheDocument(),
    );
  });

  it("refuses to save with two tutors and names why", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm([{ isGuardian: true }, { isGuardian: true }]);

    await user.click(await screen.findByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(screen.getAllByText(ONE_ONLY).length).toBeGreaterThan(1),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("names the problem when the new-student enroll button is clicked", async () => {
    const user = userEvent.setup();
    const provider = { ...dataProvider(), previewEnrollment: vi.fn() };
    renderWithAdmin(
      <>
        <Form defaultValues={{ familiars: [{ isGuardian: false }] }}>
          <MultipleFamiliarsForm />
          <ConfirmCreateStudentButton />
        </Form>
        <Notification />
      </>,
      { dataProvider: provider },
    );

    await user.click(await screen.findByRole("button", { name: "Matricular" }));

    await waitFor(() =>
      expect(screen.getAllByText(NONE).length).toBeGreaterThan(1),
    );
    expect(provider.previewEnrollment).not.toHaveBeenCalled();
  });
});
