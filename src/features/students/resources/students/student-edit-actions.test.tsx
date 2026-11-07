import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createTheme, ThemeProvider } from "@mui/material";
import { RecordContextProvider } from "react-admin";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DevWorkbenchConsole } from "@/shared/components/dev-workbench";
import StudentEditActions from "./student-edit-actions";

// The workbench host is not running in tests: every call fails, which the
// console shows as a message. Only the prefill is under test here.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("student edit actions (development)", () => {
  it("opens the workbench with this student's enrollment form filled in", async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <RecordContextProvider value={{ id: 42 }}>
          <StudentEditActions />
          <DevWorkbenchConsole />
        </RecordContextProvider>
      </ThemeProvider>,
    );
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", {
        name: "› WB: preparar matrícula para este alumno",
      }),
    );

    const drawer = await screen.findByLabelText("Workbench (solo desarrollo)");
    const form = within(drawer)
      .getByText("Preparar matrícula")
      .closest("details") as HTMLElement;
    expect(form).toHaveAttribute("open");
    expect(within(form).getByLabelText(/^o id del alumno/)).toHaveValue(42);
  });
});
