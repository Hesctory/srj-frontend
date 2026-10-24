import type {
  ClipboardEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  Ref,
} from "react";
import { Box } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";
import { LOW_STOCK_THRESHOLD } from "@/features/products/resources/products/product-constants";
import type { CellLook } from "./cell-look";

/**
 * Fill strength per tint level: cheaper prices are lighter. Dark mode needs a
 * stronger range, capped where light text over it stays at 4.5:1.
 */
const TINT_ALPHA = {
  light: [0.08, 0.13, 0.19, 0.25, 0.32],
  dark: [0.1, 0.16, 0.22, 0.28, 0.34],
};

export const CELL_HEIGHT = 34;
const RADIUS = 6;
/** Between two price segments, and wider between size groups. */
const RUN_GAP = 3;
const GROUP_GAP = 10;

/** Class of the fill handle: shown on the active cell and on hover. */
const FILL_HANDLE = "price-grid-fill-handle";

/**
 * Where a cell sits in its segment, as padding before it and rounding. The
 * grid lays sizes across (`stacked` false) or, when narrow, down.
 */
const segmentSx = (look: CellLook, stacked: boolean) => {
  const gap = look.runStart ? (look.groupStart ? GROUP_GAP : RUN_GAP) : 0;
  const [before, after] = stacked ? ["Top", "Bottom"] : ["Left", "Right"];
  const corners = (side: string, round: boolean) =>
    stacked
      ? {
          [`border${side}LeftRadius`]: round ? RADIUS : 0,
          [`border${side}RightRadius`]: round ? RADIUS : 0,
        }
      : {
          [`borderTop${side}Radius`]: round ? RADIUS : 0,
          [`borderBottom${side}Radius`]: round ? RADIUS : 0,
        };
  return {
    gap,
    outer: { [`padding${before}`]: `${gap}px` },
    inner: {
      ...corners(before, look.runStart),
      ...corners(after, look.runEnd),
    },
  };
};

/** A size the version does not have: a quiet dot, not focusable. */
export const MissingCell = ({
  groupStart,
  stacked = false,
}: {
  groupStart: boolean;
  stacked?: boolean;
}) => (
  <Box
    aria-hidden
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: CELL_HEIGHT,
      [stacked ? "pt" : "pl"]: groupStart ? `${GROUP_GAP}px` : 0,
      color: "text.disabled",
      fontSize: 13,
      userSelect: "none",
    }}
  >
    ·
  </Box>
);

interface CellButtonProps {
  kind: "price" | "stock";
  look: CellLook;
  stacked: boolean;
  active: boolean;
  /** Edges to move the price: the selected cell only. */
  showGrips: boolean;
  /** Corner to copy the price over its neighbours, on hover too. */
  canFill: boolean;
  ariaLabel: string;
  stockValue?: number | null;
  buttonRef: Ref<HTMLButtonElement>;
  onFocus: () => void;
  onClick?: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onDoubleClick: () => void;
  onPaste: (event: ClipboardEvent) => void;
  onMouseEnter: () => void;
  onGripDown: (event: MouseEvent) => void;
  onHandleDown: (event: MouseEvent) => void;
  editor?: ReactNode;
}

const stockTone = (theme: Theme, value: number | null | undefined) =>
  value == null
    ? theme.palette.text.secondary
    : value <= 0
      ? theme.palette.error.main
      : value < LOW_STOCK_THRESHOLD
        ? // Each theme's shade that keeps 13px text at 4.5:1 on its paper.
          theme.palette.mode === "dark"
          ? theme.palette.warning.main
          : theme.palette.warning.dark
        : theme.palette.text.primary;

const grip = (sx: SystemStyleObject<Theme>): SystemStyleObject<Theme> => ({
  position: "absolute",
  cursor: "move",
  ...sx,
});

const background = (theme: Theme, kind: "price" | "stock", look: CellLook) =>
  kind === "stock"
    ? "transparent"
    : look.tint == null
      ? theme.palette.action.hover
      : alpha(
          theme.palette.primary.main,
          TINT_ALPHA[theme.palette.mode][look.tint],
        );

export const PriceGridCell = ({
  kind,
  look,
  stacked,
  active,
  showGrips,
  canFill,
  ariaLabel,
  stockValue,
  buttonRef,
  onFocus,
  onClick,
  onKeyDown,
  onDoubleClick,
  onPaste,
  onMouseEnter,
  onGripDown,
  onHandleDown,
  editor,
}: CellButtonProps) => {
  const lowStock =
    kind === "stock" && stockValue != null && stockValue < LOW_STOCK_THRESHOLD;
  const segment = segmentSx(look, stacked);

  return (
    <Box
      onMouseEnter={onMouseEnter}
      sx={{
        position: "relative",
        minWidth: 0,
        ...segment.outer,
        [`&:hover .${FILL_HANDLE}`]: { opacity: 1 },
      }}
    >
      {editor ?? (
        <Box
          component="button"
          type="button"
          ref={buttonRef}
          // The visible price is part of the name (WCAG 2.5.3, label in name).
          aria-label={
            kind === "price" && look.text
              ? `${ariaLabel}: ${look.text}`
              : ariaLabel
          }
          onFocus={onFocus}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onDoubleClick={onDoubleClick}
          onPaste={onPaste}
          tabIndex={kind === "stock" ? -1 : 0}
          sx={(theme) => ({
            position: "relative",
            display: "block",
            width: "100%",
            // Stacked, a row is as tall as its tallest cell (one with a gap
            // above it): filling it keeps a segment's cells touching.
            height: stacked ? "100%" : CELL_HEIGHT,
            minHeight: CELL_HEIGHT,
            m: 0,
            p: 0,
            border: 0,
            ...segment.inner,
            ...(active ? { borderRadius: `${RADIUS}px` } : {}),
            font: "inherit",
            fontSize: 13,
            fontVariantNumeric: "tabular-nums",
            cursor: kind === "stock" ? "pointer" : "cell",
            opacity: look.faded ? 0.4 : look.preview ? 0.65 : 1,
            fontWeight: kind === "stock" ? (lowStock ? 700 : 400) : 500,
            color:
              kind === "stock"
                ? stockTone(theme, stockValue)
                : theme.palette.text.primary,
            backgroundColor: background(theme, kind, look),
            boxShadow: active
              ? `0 0 0 2px ${theme.palette.primary.main}`
              : "none",
            zIndex: active ? 1 : "auto",
            transition: "background-color 120ms, box-shadow 120ms",
            "&:focus": { outline: "none" },
            "&:hover": {
              backgroundColor:
                kind === "stock"
                  ? theme.palette.action.hover
                  : background(theme, kind, look),
              textDecoration: kind === "stock" ? "underline" : "none",
            },
          })}
        >
          {look.text}
          {look.changed && (
            <Box
              component="span"
              aria-hidden
              sx={{
                position: "absolute",
                top: 3,
                right: 3,
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "warning.main",
              }}
            />
          )}
          {showGrips && (
            <>
              <Box
                component="span"
                title="Arrastrar para mover"
                onMouseDown={onGripDown}
                sx={grip({ inset: "0 0 auto 0", height: 5 })}
              />
              <Box
                component="span"
                title="Arrastrar para mover"
                onMouseDown={onGripDown}
                sx={grip({ inset: "auto 0 0 0", height: 5 })}
              />
              <Box
                component="span"
                title="Arrastrar para mover"
                onMouseDown={onGripDown}
                sx={grip({ inset: "0 auto 0 0", width: 5 })}
              />
              <Box
                component="span"
                title="Arrastrar para mover"
                onMouseDown={onGripDown}
                sx={grip({ inset: "0 0 0 auto", width: 5 })}
              />
            </>
          )}
          {canFill && (
            <Box
              component="span"
              className={FILL_HANDLE}
              title="Arrastrar para copiar"
              onMouseDown={onHandleDown}
              sx={(theme) => ({
                position: "absolute",
                right: -4,
                bottom: -4,
                width: 10,
                height: 10,
                zIndex: 3,
                borderRadius: "50%",
                cursor: "crosshair",
                opacity: active ? 1 : 0,
                transition: "opacity 120ms",
                bgcolor: "primary.main",
                border: `2px solid ${theme.palette.background.paper}`,
              })}
            />
          )}
        </Box>
      )}
      {look.dashed && (
        <Box
          aria-hidden
          sx={(theme) => {
            const line = `2px dashed ${theme.palette.primary.main}`;
            const { start, end } = look.dashed!;
            const [before, after, side1, side2] = stacked
              ? ["Top", "Bottom", "Left", "Right"]
              : ["Left", "Right", "Top", "Bottom"];
            return {
              position: "absolute",
              inset: stacked
                ? `${segment.gap}px 0 0 0`
                : `0 0 0 ${segment.gap}px`,
              pointerEvents: "none",
              zIndex: 2,
              [`border${side1}`]: line,
              [`border${side2}`]: line,
              [`border${before}`]: start ? line : 0,
              [`border${after}`]: end ? line : 0,
              ...segmentSx({ ...look, runStart: start, runEnd: end }, stacked)
                .inner,
            };
          }}
        />
      )}
    </Box>
  );
};

interface CellEditorProps {
  value: string;
  invalid: boolean;
  ariaLabel: string;
  inputRef: (element: HTMLInputElement | null) => void;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onBlur: () => void;
  onPaste: (event: ClipboardEvent) => void;
}

export const CellEditor = ({
  value,
  invalid,
  ariaLabel,
  inputRef,
  onChange,
  onKeyDown,
  onBlur,
  onPaste,
}: CellEditorProps) => (
  <Box
    component="input"
    ref={inputRef}
    value={value}
    inputMode="decimal"
    aria-label={ariaLabel}
    aria-invalid={invalid}
    title={invalid ? "No es un precio" : undefined}
    onChange={(event: { target: { value: string } }) =>
      onChange(event.target.value)
    }
    onKeyDown={onKeyDown}
    onBlur={onBlur}
    onPaste={onPaste}
    sx={(theme) => ({
      position: "relative",
      zIndex: 1,
      display: "block",
      width: "100%",
      height: CELL_HEIGHT,
      boxSizing: "border-box",
      m: 0,
      px: 0.5,
      border: 0,
      borderRadius: `${RADIUS}px`,
      outline: "none",
      font: "inherit",
      fontSize: 13,
      fontWeight: 500,
      textAlign: "center",
      fontVariantNumeric: "tabular-nums",
      color: "text.primary",
      bgcolor: "background.paper",
      boxShadow: `0 0 0 2px ${
        invalid ? theme.palette.error.main : theme.palette.primary.main
      }`,
    })}
  />
);
