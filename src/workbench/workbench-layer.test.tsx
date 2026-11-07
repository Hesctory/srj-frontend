import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, DialogContent, TextField } from "@mui/material";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { panelStore } from "./panel-store";
import WorkbenchConsole from "./workbench-console";

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
      await screen.findByRole("button", { name: "Abrir el Workbench" }),
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
      await screen.findByRole("button", { name: "Abrir el Workbench" }),
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
      await screen.findByRole("button", { name: "Abrir el Workbench" }),
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
});
