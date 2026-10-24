import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import type { GridColumn } from "@/features/products/utils/grid-columns";

/** Which columns are chosen, when the header lets you choose (creating). */
export interface ColumnToggles {
  selected: boolean[];
  /** A group header toggles every column of its level. */
  onToggle: (cols: number[]) => void;
}

/** How many columns from `start` belong to the same group. */
const groupSpan = (columns: GridColumn[], start: number) => {
  const next = columns.findIndex((c, i) => i > start && c.groupStart);
  return (next === -1 ? columns.length : next) - start;
};

const LABEL_SX: SxProps<Theme> = {
  fontSize: 12,
  fontWeight: 600,
  color: "text.secondary",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const BUTTON_RESET = {
  m: 0,
  border: 0,
  bgcolor: "transparent",
  font: "inherit",
  cursor: "pointer",
} as const;

/** Level names over grade columns (when present) and the size/grade labels. */
export const PriceGridHeader = ({
  columns,
  template,
  toggles,
}: {
  columns: GridColumn[];
  template: string;
  toggles?: ColumnToggles;
}) => {
  const hasGroups = columns.some((column) => column.group);
  const range = (start: number, span: number) =>
    Array.from({ length: span }, (_, i) => start + i);

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 4,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      {hasGroups && (
        <Box sx={{ display: "grid", gridTemplateColumns: template }}>
          <span />
          {columns.map((column, col) => {
            if (col !== 0 && !column.groupStart) return null;
            const span = groupSpan(columns, col);
            return (
              <Box
                key={column.key}
                component={toggles ? "button" : "div"}
                type={toggles ? "button" : undefined}
                onClick={
                  toggles ? () => toggles.onToggle(range(col, span)) : undefined
                }
                sx={{
                  ...(toggles ? BUTTON_RESET : {}),
                  ...LABEL_SX,
                  gridColumn: `span ${span}`,
                  mx: 0.25,
                  fontSize: 11,
                  borderBottom: 2,
                  borderColor: "divider",
                }}
              >
                {column.group ?? ""}
              </Box>
            );
          })}
        </Box>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: template,
          minHeight: 28,
          alignItems: "center",
        }}
      >
        <Box sx={{ fontSize: 12, color: "text.secondary" }}>
          {hasGroups ? "Grado" : columns.length > 1 ? "Talla" : ""}
        </Box>
        {columns.map((column, col) =>
          toggles ? (
            <Box
              key={column.key}
              component="button"
              type="button"
              aria-pressed={toggles.selected[col]}
              title={column.label}
              onClick={() => toggles.onToggle([col])}
              sx={{
                ...BUTTON_RESET,
                ...LABEL_SX,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 0.25,
                color: toggles.selected[col] ? "text.primary" : "text.disabled",
              }}
            >
              {toggles.selected[col] ? (
                <CheckBoxIcon sx={{ fontSize: 16 }} color="primary" />
              ) : (
                <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />
              )}
              <Box component="span" sx={{ maxWidth: "100%", ...LABEL_SX }}>
                {column.label}
              </Box>
            </Box>
          ) : (
            <Box
              key={column.key}
              title={column.label}
              sx={{
                ...LABEL_SX,
                px: 0.25,
                // Sizes have no group row: the kids → adult break shows here.
                borderLeft: column.groupStart && !hasGroups ? 2 : 0,
                borderColor: "divider",
              }}
            >
              {column.label}
            </Box>
          ),
        )}
      </Box>
    </Box>
  );
};

export default PriceGridHeader;
