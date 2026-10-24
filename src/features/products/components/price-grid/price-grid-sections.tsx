import { Fragment, type ReactNode } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import type { GridColumn } from "@/features/products/utils/grid-columns";
import { CELL_HEIGHT, MissingCell } from "./price-grid-cell";
import type { ColumnToggles } from "./price-grid-header";
import type { CellLook } from "./cell-look";
import type { GridRowSpec, GridSectionSpec } from "./price-grid-types";

export type RenderCell = (
  row: GridRowSpec,
  col: number,
  look: CellLook,
) => ReactNode;

interface SectionProps {
  section: GridSectionSpec;
  columns: GridColumn[];
  looks: Map<string, (CellLook | null)[]>;
  renderCell: RenderCell;
}

const ROW_LABEL_SX: SxProps<Theme> = {
  fontSize: 12,
  color: "text.secondary",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const cellsOf = (
  row: GridRowSpec,
  col: number,
  { columns, looks, renderCell }: Omit<SectionProps, "section">,
  stacked: boolean,
) => {
  const look = looks.get(row.id)?.[col];
  return row.cells[col] && look ? (
    renderCell(row, col, look)
  ) : (
    <MissingCell
      groupStart={columns[col]?.groupStart ?? false}
      stacked={stacked}
    />
  );
};

/** One version with its sizes across, one line per row (Venta, Costo, Stock). */
export const WideSection = ({
  section,
  template,
  fitContent,
  ...rest
}: SectionProps & { template: string; fitContent: boolean }) => (
  <Box sx={{ mt: 1.5 }}>
    {section.header}
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        width: fitContent ? "fit-content" : undefined,
      }}
    >
      {section.rows.map((row) => (
        <Box
          key={row.id}
          sx={{ display: "grid", gridTemplateColumns: template }}
        >
          <Box sx={{ ...ROW_LABEL_SX, alignSelf: "center", pr: 1 }}>
            {row.label}
          </Box>
          {row.cells.map((_, col) => (
            <Fragment key={col}>{cellsOf(row, col, rest, false)}</Fragment>
          ))}
        </Box>
      ))}
    </Box>
    {section.footer}
  </Box>
);

const STACK_LABEL_WIDTH = 64;

const TOGGLE_SX: SxProps<Theme> = {
  m: 0,
  p: 0,
  border: 0,
  bgcolor: "transparent",
  font: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 0.5,
};

/**
 * One version turned on its side for a narrow screen: sizes down, rows
 * across. The same cells, keys and drags; only the axes swap.
 */
export const StackedSection = ({
  section,
  axisLabel,
  toggles,
  ...rest
}: SectionProps & { axisLabel: string; toggles?: ColumnToggles }) => {
  const { columns } = rest;
  const rows = section.rows;
  // A size no row of this version has is noise down a narrow column —
  // unless the header chooses sizes, when every one must be there to pick.
  const shown = columns
    .map((_, col) => col)
    .filter((col) => toggles || rows.some((row) => row.cells[col] != null));
  const groupSpan = (col: number) => {
    const next = columns.findIndex((c, i) => i > col && c.groupStart);
    return Array.from(
      { length: (next === -1 ? columns.length : next) - col },
      (_, i) => col + i,
    );
  };

  return (
    <Box sx={{ mt: 1.5 }}>
      {section.header}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `${STACK_LABEL_WIDTH}px repeat(${rows.length}, minmax(0, 1fr))`,
          columnGap: 0.5,
          alignItems: "stretch",
        }}
      >
        <Box sx={{ ...ROW_LABEL_SX, alignSelf: "end" }}>{axisLabel}</Box>
        {rows.map((row) => (
          <Box
            key={row.id}
            sx={{ ...ROW_LABEL_SX, alignSelf: "end", textAlign: "center" }}
          >
            {row.label}
          </Box>
        ))}
        {shown.map((col) => {
          const column = columns[col];
          const opensGroup = column.group && (col === 0 || column.groupStart);
          return (
            <Fragment key={column.key}>
              {opensGroup && (
                <Box
                  component={toggles ? "button" : "div"}
                  type={toggles ? "button" : undefined}
                  onClick={
                    toggles ? () => toggles.onToggle(groupSpan(col)) : undefined
                  }
                  sx={{
                    ...(toggles ? TOGGLE_SX : {}),
                    gridColumn: "1 / -1",
                    mt: 1,
                    pb: 0.25,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "text.secondary",
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  {column.group}
                </Box>
              )}
              {toggles ? (
                <Box
                  component="button"
                  type="button"
                  aria-pressed={toggles.selected[col]}
                  onClick={() => toggles.onToggle([col])}
                  sx={{
                    ...TOGGLE_SX,
                    minHeight: CELL_HEIGHT,
                    fontSize: 12,
                    fontWeight: 600,
                    color: toggles.selected[col]
                      ? "text.primary"
                      : "text.disabled",
                  }}
                >
                  {toggles.selected[col] ? (
                    <CheckBoxIcon sx={{ fontSize: 16 }} color="primary" />
                  ) : (
                    <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />
                  )}
                  {column.label}
                </Box>
              ) : (
                <Box
                  sx={{
                    ...ROW_LABEL_SX,
                    display: "flex",
                    alignItems: "center",
                    minHeight: CELL_HEIGHT,
                    fontWeight: 600,
                  }}
                >
                  {column.label}
                </Box>
              )}
              {rows.map((row) => (
                <Fragment key={row.id}>
                  {cellsOf(row, col, rest, true)}
                </Fragment>
              ))}
            </Fragment>
          );
        })}
      </Box>
      {section.footer}
    </Box>
  );
};
