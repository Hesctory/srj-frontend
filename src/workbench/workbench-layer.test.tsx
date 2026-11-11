import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, DialogContent, TextField } from "@mui/material";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { panelStore } from "./panel-store";
import WorkbenchConsole from "./workbench-console";

type User = ReturnType<typeof userEvent.setup>;

const status = {
  businessDate: "2026-03-02",
  followingToday: false,
  mode: "off",
  history: "none",
  counts: {
    students: 0,
    relatives: 0,
    enrollments: 0,
    payments: 0,
    documents: 0,
  },
  snapshotCount: 0,
  snapshotCap: 100,
  snapshotBytes: 0,
  backendRunning: true,
  realAvailable: false,
  realAccount: null,
  busy: false,
  workspaceExists: true,
  frontendUrl: "http://localhost:5173",
  backendUrl: "http://localhost:4000",
  realSendsEver: false,
  realHighWater: {},
  realUnavailableReason: "No test account in .env.",
};

const fakeFetch = vi.fn(async (url: string) => {
  const body = url.endsWith("/status")
    ? status
    : url.includes("/options")
      ? {
          schoolYears: [],
          grades: [],
          shifts: [],
          feeConcepts: [],
          paymentMethods: [],
          enrollments: null,
          charges: null,
        }
      : [];
  return new Response(JSON.stringify(body), { status: 200 });
});

beforeEach(() => vi.stubGlobal("fetch", fakeFetch));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  panelStore.reset();
});

describe("workbench layer", () => {
  it("opens and takes typing while an app dialog is open, leaving the dialog open", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Dialog open onClose={() => undefined}>
          <DialogContent>
            <TextField label="Campo del diálogo" />
          </DialogContent>
        </Dialog>
        <WorkbenchConsole />
      </>,
    );

    await user.click(
      await screen.findByRole("button", { name: /Abrir el Workbench/ }),
    );
    const consoleEl = await screen.findByLabelText(
      "Workbench (solo desarrollo)",
    );
    await within(consoleEl).findByText("2026-03-02");

    const host = consoleEl.closest(".wb-host") as HTMLElement;
    expect(host.parentElement).toBe(document.body);
    expect(container.contains(host)).toBe(false);
    expect(host).not.toHaveAttribute("aria-hidden");

    // MUI hides body siblings while a modal is open; the console undoes it.
    host.setAttribute("aria-hidden", "true");
    await vi.waitFor(() => expect(host).not.toHaveAttribute("aria-hidden"));

    const input = within(consoleEl).getAllByRole("spinbutton")[0];
    await user.click(input);
    const before = (input as HTMLInputElement).value;
    await user.keyboard("5");
    expect((input as HTMLInputElement).value).not.toBe(before);
    expect(input).toHaveFocus();
    expect(consoleEl.contains(document.activeElement)).toBe(true);
    expect(screen.getByRole("dialog")).toBeVisible();

    await user.click(screen.getByLabelText("Campo del diálogo"));
    await user.keyboard("x");
    expect(screen.getByLabelText("Campo del diálogo")).toHaveValue("x");
  });

  it("hides on Escape and leaves an open dialog alone", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Dialog open onClose={() => undefined}>
          <DialogContent>
            <TextField label="Campo del diálogo" />
          </DialogContent>
        </Dialog>
        <WorkbenchConsole />
      </>,
    );
    await user.click(
      await screen.findByRole("button", { name: /Abrir el Workbench/ }),
    );
    const consoleEl = await screen.findByLabelText(
      "Workbench (solo desarrollo)",
    );
    await within(consoleEl).findByText("2026-03-02");
    await user.click(within(consoleEl).getAllByRole("spinbutton")[0]);
    await user.keyboard("{Escape}");
    expect(
      screen.queryByLabelText("Workbench (solo desarrollo)"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps focus in the console when a focused control gets disabled, instead of letting an open dialog take it", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Dialog open onClose={() => undefined}>
          <DialogContent>
            <TextField label="Campo del diálogo" />
          </DialogContent>
        </Dialog>
        <WorkbenchConsole />
      </>,
    );
    await user.click(
      await screen.findByRole("button", { name: /Abrir el Workbench/ }),
    );
    const consoleEl = await screen.findByLabelText(
      "Workbench (solo desarrollo)",
    );
    await within(consoleEl).findByText("2026-03-02");
    const host = consoleEl.closest(".wb-host") as HTMLElement;
    const input = within(consoleEl).getAllByRole("spinbutton")[0];
    // The dialog's trap is active once focus has been inside it.
    await user.click(screen.getByLabelText("Campo del diálogo"));
    await user.click(input);
    expect(input).toHaveFocus();

    // MUI's trap only acts while the document has focus (jsdom: never).
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    // What a real browser does when the fieldset locks: focus drops to body.
    act(() => {
      input.blur();
      host.querySelector("fieldset")!.disabled = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(host.contains(document.activeElement)).toBe(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("removes its layer on unmount", () => {
    const { unmount } = render(<WorkbenchConsole />);
    expect(document.querySelector(".wb-host")).not.toBeNull();
    unmount();
    expect(document.querySelector(".wb-host")).toBeNull();
  });

  describe("Ctrl+Shift+E", () => {
    const press = (user: ReturnType<typeof userEvent.setup>) =>
      user.keyboard("{Control>}{Shift>}e{/Shift}{/Control}");

    it("opens from hidden with focus in the drawer, and hides on a second press", async () => {
      const user = userEvent.setup();
      render(<WorkbenchConsole />);
      await screen.findByRole("button", { name: /Abrir el Workbench/ });
      await press(user);
      const drawer = await screen.findByLabelText(
        "Workbench (solo desarrollo)",
      );
      await vi.waitFor(() => expect(drawer).toHaveFocus());
      await press(user);
      expect(
        screen.queryByLabelText("Workbench (solo desarrollo)"),
      ).not.toBeInTheDocument();
    });

    it("works with focus in an open dialog's input, leaving the dialog open", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Dialog open onClose={() => undefined}>
            <DialogContent>
              <TextField label="Campo del diálogo" />
            </DialogContent>
          </Dialog>
          <WorkbenchConsole />
        </>,
      );
      await screen.findByRole("button", { name: /Abrir el Workbench/ });
      await user.click(screen.getByLabelText("Campo del diálogo"));
      await press(user);
      expect(
        await screen.findByLabelText("Workbench (solo desarrollo)"),
      ).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText("Campo del diálogo")).toHaveValue("");
    });

    const withDialog = () =>
      render(
        <>
          <Dialog open onClose={() => undefined}>
            <DialogContent>
              <TextField label="Campo del diálogo" />
            </DialogContent>
          </Dialog>
          <WorkbenchConsole />
        </>,
      );

    it.each([
      ["Ctrl+Shift+E", (user: User) => press(user)],
      ["Escape", (user: User) => user.keyboard("{Escape}")],
    ])(
      "gives focus back to the dialog input when hidden with %s",
      async (_name, close) => {
        const user = userEvent.setup();
        withDialog();
        await screen.findByRole("button", { name: /Abrir el Workbench/ });
        const input = screen.getByLabelText("Campo del diálogo");
        await user.click(input);
        await press(user);
        const drawer = await screen.findByLabelText(
          "Workbench (solo desarrollo)",
        );
        await vi.waitFor(() => expect(drawer).toHaveFocus());
        await close(user);
        expect(
          screen.queryByLabelText("Workbench (solo desarrollo)"),
        ).not.toBeInTheDocument();
        await vi.waitFor(() => expect(input).toHaveFocus());
        await user.keyboard("abc");
        expect(input).toHaveValue("abc");
      },
    );

    it("gives focus back to an app input without a dialog", async () => {
      const user = userEvent.setup();
      render(
        <>
          <TextField label="Campo" />
          <WorkbenchConsole />
        </>,
      );
      await screen.findByRole("button", { name: /Abrir el Workbench/ });
      const input = screen.getByLabelText("Campo");
      await user.click(input);
      await press(user);
      const drawer = await screen.findByLabelText(
        "Workbench (solo desarrollo)",
      );
      await vi.waitFor(() => expect(drawer).toHaveFocus());
      await press(user);
      await vi.waitFor(() => expect(input).toHaveFocus());
    });

    it("ignores Shift+E and Ctrl+E typed into an input", async () => {
      const user = userEvent.setup();
      render(
        <>
          <TextField label="Campo" />
          <WorkbenchConsole />
        </>,
      );
      await screen.findByRole("button", { name: /Abrir el Workbench/ });
      await user.click(screen.getByLabelText("Campo"));
      await user.keyboard("{Shift>}e{/Shift}");
      await user.keyboard("{Control>}e{/Control}");
      expect(screen.getByLabelText("Campo")).toHaveValue("e");
      expect(
        screen.queryByLabelText("Workbench (solo desarrollo)"),
      ).not.toBeInTheDocument();
    });
  });
});
