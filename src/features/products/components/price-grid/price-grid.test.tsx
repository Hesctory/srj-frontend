import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdmin } from "@/test/render-with-admin";
import type { GridColumn } from "@/features/products/utils/grid-columns";
import PriceGrid from "./price-grid";
import type { GridWrite } from "./price-grid-types";

const columns: GridColumn[] = ["2", "4", "6", "8"].map((label) => ({
  key: `s${label}`,
  label,
  group: null,
  groupStart: false,
}));

/** Owns the values the way the editor does, and applies every write. */
const Harness = ({
  initial,
  onWrite = () => {},
}: {
  initial: (number | null)[][];
  onWrite?: (writes: GridWrite[], summary: string) => void;
}) => {
  const [rows, setRows] = useState(initial);
  const ids = ["sale", "cost"];
  return (
    <PriceGrid
      columns={columns}
      sections={[
        {
          id: "v",
          rows: rows.map((values, r) => ({
            id: ids[r],
            label: ids[r],
            kind: "price",
            cells: values.map((value, col) => ({
              value,
              ariaLabel: `${ids[r]} ${columns[col].label}`,
            })),
          })),
        },
      ]}
      onWrite={(writes, summary) => {
        onWrite(writes, summary);
        setRows((prev) => {
          const next = prev.map((row) => [...row]);
          for (const w of writes) next[ids.indexOf(w.rowId)][w.col] = w.value;
          return next;
        });
      }}
      onUndo={() => {}}
    />
  );
};

/** A cell by its label; its name ends with the price it shows, if any. */
const cell = (label: string) =>
  screen.getByRole("button", { name: new RegExp(`^${label}(: .*)?$`) });

describe("PriceGrid", () => {
  it("types a price, and Enter/Tab move forward while Shift goes back", async () => {
    const user = userEvent.setup();
    renderWithAdmin(
      <Harness
        initial={[
          [null, null, null, null],
          [null, null, null, null],
        ]}
      />,
    );

    await user.click(cell("sale 2"));
    await user.keyboard("45{Enter}50{Tab}");
    expect(cell("sale 2")).toHaveTextContent("45");
    expect(cell("sale 4")).toHaveTextContent("50");
    await waitFor(() => expect(cell("sale 6")).toHaveFocus());

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    await waitFor(() => expect(cell("sale 4")).toHaveFocus());

    // Past the last size, Enter continues on the next row.
    await user.click(cell("sale 8"));
    await user.keyboard("60{Enter}");
    await waitFor(() => expect(cell("cost 2")).toHaveFocus());
  });

  it("Tab from a selected cell skips the sizes a version lacks", async () => {
    const user = userEvent.setup();
    const Gapped = () => (
      <PriceGrid
        columns={columns}
        sections={[
          {
            id: "v",
            rows: [
              {
                id: "sale",
                label: "sale",
                kind: "price",
                cells: [45, null, 50, 55].map((value, col) =>
                  col === 1
                    ? null
                    : { value, ariaLabel: `sale ${columns[col].label}` },
                ),
              },
            ],
          },
        ]}
        onWrite={() => {}}
        onUndo={() => {}}
      />
    );
    renderWithAdmin(<Gapped />);

    await user.click(cell("sale 2"));
    await user.keyboard("{Tab}");
    await waitFor(() => expect(cell("sale 6")).toHaveFocus());
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await waitFor(() => expect(cell("sale 2")).toHaveFocus());
  });

  it("does not accept text that is not a price", async () => {
    const user = userEvent.setup();
    const onWrite = vi.fn();
    renderWithAdmin(<Harness initial={[[45, 45, 45, 45]]} onWrite={onWrite} />);

    await user.click(cell("sale 2"));
    await user.keyboard("{Enter}{Control>}a{/Control}abc{Enter}");
    expect(screen.getByRole("textbox", { name: "sale 2" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(onWrite).not.toHaveBeenCalled();
  });

  it("pastes rows copied from Excel into the rows below", async () => {
    const user = userEvent.setup();
    const onWrite = vi.fn();
    renderWithAdmin(
      <Harness
        initial={[
          [null, null, null, null],
          [null, null, null, null],
        ]}
        onWrite={onWrite}
      />,
    );

    await user.click(cell("sale 4"));
    await user.paste("45\t50\t55\n30\t33\t38");
    expect(cell("sale 4")).toHaveTextContent("45");
    expect(cell("sale 8")).toHaveTextContent("55");
    expect(cell("cost 6")).toHaveTextContent("33");
    expect(onWrite).toHaveBeenCalledWith(
      expect.any(Array),
      "6 precios pegados.",
    );
  });

  it("copies a price over its neighbours by dragging its corner, no click first", () => {
    const onWrite = vi.fn();
    renderWithAdmin(
      <Harness initial={[[45, null, null, 60]]} onWrite={onWrite} />,
    );

    // Every priced cell has the corner (shown on hover): selecting the cell
    // first is not a step.
    expect(screen.getAllByTitle("Arrastrar para copiar")).toHaveLength(2);
    fireEvent.mouseDown(
      within(cell("sale 2")).getByTitle("Arrastrar para copiar"),
    );
    fireEvent.mouseEnter(cell("sale 6"));
    fireEvent.mouseUp(window);

    expect(cell("sale 4")).toHaveTextContent("45");
    expect(cell("sale 6")).toHaveTextContent("45");
    expect(cell("sale 8")).toHaveTextContent("60");
    expect(onWrite).toHaveBeenCalledWith(
      expect.any(Array),
      "45 copiado a 2 celdas.",
    );
  });

  it("moves a misplaced price by dragging its edge", async () => {
    const user = userEvent.setup();
    renderWithAdmin(<Harness initial={[[null, 50, null, null]]} />);

    await user.click(cell("sale 4"));
    fireEvent.mouseDown(screen.getAllByTitle("Arrastrar para mover")[0]);
    fireEvent.mouseEnter(cell("sale 8"));
    fireEvent.mouseUp(window);

    expect(cell("sale 4")).toHaveTextContent("");
    expect(cell("sale 8")).toHaveTextContent("50");
  });

  it("turns on its side when too narrow, and the arrows follow what is seen", async () => {
    // Narrower than four sizes need (84 + 4 × 35 px): sizes stack down.
    class NarrowObserver {
      constructor(private callback: ResizeObserverCallback) {}
      observe() {
        this.callback(
          [{ contentRect: { width: 200 } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal("ResizeObserver", NarrowObserver);
    try {
      const user = userEvent.setup();
      renderWithAdmin(
        <Harness
          initial={[
            [45, 45, 50, 50],
            [30, 30, 33, 33],
          ]}
        />,
      );

      await user.click(cell("sale 2"));
      await user.keyboard("{ArrowDown}");
      await waitFor(() => expect(cell("sale 4")).toHaveFocus());
      await user.keyboard("{ArrowRight}");
      await waitFor(() => expect(cell("cost 4")).toHaveFocus());
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
