import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useNotify } from "react-admin";
import { Box } from "@mui/material";
import type { GridColumn } from "@/features/products/utils/grid-columns";
import {
  formatPrice,
  isMultiCellPaste,
  parseClipboard,
  parsePrice,
} from "@/features/products/utils/price-grid";
import {
  planPaste,
  rowEdge,
  stepHorizontal,
  stepLinear,
  stepVertical,
  type GridPos,
  type NavRow,
} from "@/features/products/utils/grid-navigation";
import useElementWidth from "@/features/products/hooks/use-element-width";
import { CellEditor, PriceGridCell } from "./price-grid-cell";
import { PriceGridHeader, type ColumnToggles } from "./price-grid-header";
import { rowLooks, type Drag } from "./cell-look";
import {
  StackedSection,
  WideSection,
  type RenderCell,
} from "./price-grid-sections";
import type {
  GridRowSpec,
  GridSectionSpec,
  GridWrite,
} from "./price-grid-types";

const LABEL_WIDTH = 84;
const MIN_COLUMN = 35;
/** Past this a row of prices is too spread out to read at a glance. */
const MAX_COLUMN = 72;
/** A tie or an agenda has one price: its cell keeps a fixed width. */
const FEW_COLUMNS = 3;
const FIXED_COLUMN = 120;
/** Room for a version's name, summary and actions above its rows. */
const MIN_GRID = 600;
/** Turned on its side, a version needs little: past this it just spreads. */
const STACKED_MAX_WIDTH = 520;
/** The editor's padding and a scrollbar around the grid. */
export const GRID_GUTTERS = 48;

/** How wide the grid gets at most: siblings below it align to this. */
export const priceGridMaxWidth = (columnCount: number) =>
  Math.max(MIN_GRID, LABEL_WIDTH + columnCount * MAX_COLUMN + 2);

interface PriceGridProps {
  columns: GridColumn[];
  sections: GridSectionSpec[];
  /** `summary` describes a bulk change (drag, paste) for the status line. */
  onWrite: (writes: GridWrite[], summary: string) => void;
  onUndo: () => void;
  /** Creating: the header's checkboxes choose which columns exist. */
  columnToggles?: ColumnToggles;
}

const cellId = (pos: GridPos) => `${pos.rowId}|${pos.col}`;

/**
 * The price grid: versions down, sizes (or grades) across, edited like a
 * spreadsheet. On a screen too narrow for every size across, each version is
 * turned on its side instead: sizes down, rows across.
 *
 * Typing on a cell edits it; Enter or Tab saves and moves on, Shift goes back.
 * A selected cell can be dragged by its edge to move its price; any priced
 * cell, by the corner that shows on hover, to copy it over its neighbours.
 * Ctrl+V pastes rows copied from Excel.
 * The grid only reports writes; the owner keeps the values and the history.
 */
export const PriceGrid = ({
  columns,
  sections,
  onWrite,
  onUndo,
  columnToggles,
}: PriceGridProps) => {
  const notify = useNotify();
  const rows = useMemo(() => sections.flatMap((s) => s.rows), [sections]);
  const rowById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const navRows = useMemo<NavRow[]>(
    () =>
      rows.map((row) => ({
        id: row.id,
        editable: row.kind === "price",
        present: row.cells.map((cell) => cell != null),
      })),
    [rows],
  );

  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const width = useElementWidth(frame);
  const few = columns.length <= FEW_COLUMNS;
  const wideMinWidth =
    LABEL_WIDTH + columns.length * (few ? FIXED_COLUMN : MIN_COLUMN);
  // Too narrow for every size across: turn each version on its side.
  const stacked = width != null && width < wideMinWidth;

  const [active, setActive] = useState<GridPos | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [drag, setDrag] = useState<Drag | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);
  // State updates are async; blur fires synchronously after a commit.
  const editingRef = useRef(false);

  useEffect(() => {
    if (!pendingFocus.current || editing) return;
    const target = buttons.current.get(pendingFocus.current);
    pendingFocus.current = null;
    target?.focus();
  });

  const valueAt = (pos: GridPos) =>
    rowById.get(pos.rowId)?.cells[pos.col]?.value ?? null;

  const go = (pos: GridPos | null) => {
    if (!pos) return;
    editingRef.current = false;
    pendingFocus.current = cellId(pos);
    setEditing(false);
    setActive(pos);
  };

  const startEdit = (pos: GridPos, text: string) => {
    editingRef.current = true;
    setActive(pos);
    setDraft(text);
    setEditing(true);
  };

  const commit = (dir: 1 | -1 | 0, fromBlur = false) => {
    if (!editingRef.current || !active) return;
    const parsed = parsePrice(draft);
    if (parsed === undefined) {
      if (fromBlur) {
        editingRef.current = false;
        setEditing(false);
        notify(`«${draft}» no es un precio; se descartó.`, { type: "warning" });
      }
      return;
    }
    editingRef.current = false;
    setEditing(false);
    if (parsed !== valueAt(active)) {
      onWrite([{ rowId: active.rowId, col: active.col, value: parsed }], "");
    }
    if (dir !== 0) go(stepLinear(navRows, active, dir) ?? active);
    else if (!fromBlur) go(active);
  };

  const paste = (pos: GridPos, event: ClipboardEvent) => {
    const text = event.clipboardData.getData("text");
    if (editingRef.current && !isMultiCellPaste(text)) return;
    event.preventDefault();
    const plan = planPaste(navRows, pos, parseClipboard(text));
    let ignored = plan.overflow;
    const writes: GridWrite[] = [];
    for (const { rowId, col, raw } of plan.cells) {
      const value = parsePrice(raw);
      if (value === undefined) ignored++;
      else writes.push({ rowId, col, value });
    }
    if (writes.length > 0) {
      const n = writes.length;
      onWrite(
        writes,
        `${n} ${n === 1 ? "precio pegado" : "precios pegados"}` +
          (ignored ? ` · ${ignored} valores ignorados.` : "."),
      );
    }
    go(pos);
  };

  useEffect(() => {
    if (!drag) return;
    const finish = () => {
      setDrag(null);
      const row = rowById.get(drag.rowId);
      const source = row?.cells[drag.from]?.value;
      if (!row || source == null || drag.to === drag.from) return;
      const label = (col: number) => columns[col]?.label ?? "";
      if (drag.mode === "move") {
        onWrite(
          [
            { rowId: row.id, col: drag.to, value: source },
            { rowId: row.id, col: drag.from, value: null },
          ],
          `${formatPrice(source)} movido de ${label(drag.from)} a ${label(drag.to)}.`,
        );
      } else {
        const [a, b] = [drag.from, drag.to].sort((x, y) => x - y);
        const writes: GridWrite[] = [];
        for (let col = a; col <= b; col++) {
          const target = row.cells[col];
          if (col !== drag.from && target && target.value !== source) {
            writes.push({ rowId: row.id, col, value: source });
          }
        }
        if (writes.length > 0)
          onWrite(
            writes,
            `${formatPrice(source)} copiado a ${writes.length} ${
              writes.length === 1 ? "celda" : "celdas"
            }.`,
          );
      }
      go({ rowId: row.id, col: drag.to });
    };
    window.addEventListener("mouseup", finish);
    return () => window.removeEventListener("mouseup", finish);
  });

  const onCellKeyDown = (
    row: GridRowSpec,
    pos: GridPos,
    event: KeyboardEvent,
  ) => {
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === "z") {
      event.preventDefault();
      onUndo();
      return;
    }
    if (mod || event.altKey) return;
    // Stacked, sizes run down the screen: the arrows follow what is seen.
    const [nextSize, prevSize, nextRow, prevRow] = stacked
      ? ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"]
      : ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];
    const moves: Record<string, () => GridPos | null> = {
      [nextSize]: () => stepHorizontal(navRows, pos, 1),
      [prevSize]: () => stepHorizontal(navRows, pos, -1),
      [nextRow]: () => stepVertical(navRows, pos, 1),
      [prevRow]: () => stepVertical(navRows, pos, -1),
      Home: () => rowEdge(navRows, pos.rowId, "first"),
      End: () => rowEdge(navRows, pos.rowId, "last"),
    };
    // Tab and Shift+Enter walk the price cells the way the editor's Enter
    // does, rather than the DOM's tab order.
    const back = event.key === "Enter" && event.shiftKey;
    if (row.kind === "price" && (event.key === "Tab" || back)) {
      const next = stepLinear(navRows, pos, event.shiftKey ? -1 : 1);
      if (next) {
        event.preventDefault();
        go(next);
      }
      return;
    }
    if (moves[event.key]) {
      event.preventDefault();
      go(moves[event.key]());
      return;
    }
    if (row.kind !== "price") return;
    const value = valueAt(pos);
    if (event.key === "Enter" || event.key === "F2") {
      event.preventDefault();
      startEdit(pos, value == null ? "" : String(value));
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      if (value != null) onWrite([{ ...pos, value: null }], "");
    } else if (/^[0-9.,]$/.test(event.key)) {
      event.preventDefault();
      startEdit(pos, event.key);
    }
  };

  const startDrag = (mode: Drag["mode"], pos: GridPos, event: MouseEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setDrag({ mode, rowId: pos.rowId, from: pos.col, to: pos.col });
  };

  const template = `${LABEL_WIDTH}px repeat(${columns.length}, ${
    few ? `${FIXED_COLUMN}px` : `minmax(${MIN_COLUMN}px, 1fr)`
  })`;
  const looks = new Map(
    rows.map((row) => [row.id, rowLooks(row, columns, drag, stacked)]),
  );
  const axisLabel = columns.some((column) => column.group)
    ? "Grado"
    : columns.length > 1
      ? "Talla"
      : "";

  const renderCell: RenderCell = (row, col, look) => {
    const cell = row.cells[col]!;
    const pos = { rowId: row.id, col };
    const isActive = active?.rowId === row.id && active.col === col;
    const isEditing = isActive && editing;
    const idle =
      !editing && !drag && row.kind === "price" && cell.value != null;
    return (
      <PriceGridCell
        kind={row.kind}
        look={look}
        stacked={stacked}
        active={isActive && !drag}
        showGrips={isActive && idle}
        canFill={idle}
        ariaLabel={cell.ariaLabel}
        stockValue={row.kind === "stock" ? cell.value : null}
        buttonRef={(element) => {
          if (element) buttons.current.set(cellId(pos), element);
          else buttons.current.delete(cellId(pos));
        }}
        onFocus={() => {
          if (!isActive) setActive(pos);
        }}
        onClick={cell.onOpen}
        onKeyDown={(event) => onCellKeyDown(row, pos, event)}
        onDoubleClick={() =>
          row.kind === "price" &&
          startEdit(pos, cell.value == null ? "" : String(cell.value))
        }
        onPaste={(event) => paste(pos, event)}
        onMouseEnter={() => {
          if (drag && drag.rowId === row.id && drag.to !== col)
            setDrag({ ...drag, to: col });
        }}
        onGripDown={(event) => startDrag("move", pos, event)}
        onHandleDown={(event) => startDrag("fill", pos, event)}
        editor={
          isEditing ? (
            <CellEditor
              value={draft}
              invalid={parsePrice(draft) === undefined}
              ariaLabel={cell.ariaLabel}
              inputRef={(element) => {
                if (element && document.activeElement !== element) {
                  element.focus();
                  const end = element.value.length;
                  element.setSelectionRange(end, end);
                }
              }}
              onChange={setDraft}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Tab") {
                  event.preventDefault();
                  commit(event.shiftKey ? -1 : 1);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  go(pos);
                }
              }}
              onBlur={() => commit(0, true)}
              onPaste={(event) => paste(pos, event)}
            />
          ) : undefined
        }
      />
    );
  };

  const shared = { columns, looks, renderCell };

  return (
    // Measured, not the grid: the grid's own min-width would hide the need.
    <Box ref={setFrame}>
      <Box
        sx={
          stacked
            ? { maxWidth: STACKED_MAX_WIDTH }
            : {
                minWidth: wideMinWidth,
                maxWidth: priceGridMaxWidth(columns.length),
              }
        }
        onMouseLeave={() => drag && setDrag(null)}
      >
        {!stacked && (
          <PriceGridHeader
            columns={columns}
            template={template}
            toggles={columnToggles}
          />
        )}
        {sections.map((section) =>
          stacked ? (
            <StackedSection
              key={section.id}
              section={section}
              axisLabel={axisLabel}
              toggles={columnToggles}
              {...shared}
            />
          ) : (
            <WideSection
              key={section.id}
              section={section}
              template={template}
              fitContent={few}
              {...shared}
            />
          ),
        )}
      </Box>
    </Box>
  );
};

export default PriceGrid;
