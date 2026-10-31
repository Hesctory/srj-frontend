import { Box, Typography, type BoxProps, type SxProps } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

/**
 * Responsive column grid for react-admin form fields.
 *
 * Every RA input renders as a `fullWidth` MuiFormControl (class `ra-input`), so
 * dropping inputs straight into a CSS grid makes each one fill exactly one
 * column — no per-input width props and no `<Box display="flex">` rows, which
 * is what the student forms used before: those rows never wrapped (fields got
 * crushed below ~1000px) and every field outside one stretched across the whole
 * card, turning each tab into a multi-screen scroll on a 1366x768 laptop.
 *
 * Column count follows the viewport, tuned for the desktop targets:
 * 1366 -> 3 columns, 1920/2560 -> 4. Narrow widths fall back to 2 then 1, so
 * phones work without being the thing the layout is optimized for.
 */

/**
 * Two columns instead of one: for fields that need more room than a name but
 * shouldn't become a 2000px-wide box on a 2560 monitor (addresses). Falls back
 * to the full row on `xs`, where there is only one column to take.
 */
export const wideField: SxProps<Theme> = {
  gridColumn: { xs: "1 / -1", sm: "span 2" },
};

/**
 * The whole row, at every width: multiline text (comments, notes) and anything
 * that is not a field but lives in the grid (an info alert, a hint line).
 */
export const fullRowField: SxProps<Theme> = { gridColumn: "1 / -1" };

export interface FormGridProps extends Omit<BoxProps, "display"> {
  /**
   * Switch from viewport breakpoints to a container-driven track size:
   * `repeat(auto-fit, minmax(min(<minColumnWidth>px, 100%), 1fr))`. Use it for grids nested
   * inside a panel that is itself only part of the row (the enrollment panel),
   * where the viewport says "xl" but the available width is half of that.
   */
  minColumnWidth?: number;
}

export const FormGrid = ({ minColumnWidth, sx, ...rest }: FormGridProps) => (
  <Box
    {...rest}
    sx={[
      {
        display: "grid",
        width: "100%",
        alignItems: "start",
        columnGap: 2,
        // Small: RA already reserves a helper-text line under every input for
        // validation messages, which is most of the visual row spacing.
        rowGap: 0.5,
        // `min(…, 100%)`: a container narrower than one track (a phone) gets
        // one full-width column instead of a track that sticks out of it.
        gridTemplateColumns: minColumnWidth
          ? `repeat(auto-fit, minmax(min(${minColumnWidth}px, 100%), 1fr))`
          : {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
              xl: "repeat(4, 1fr)",
            },
        // RA inputs carry their own dense vertical margin, which fights the grid
        // gap and misaligns rows of mixed input types. The gap owns spacing here.
        "& > .ra-input": { width: "100%", m: 0 },
        // Grid items default to `min-width: auto`, which lets a long select value
        // push the track wider than its share and overflow the card.
        "& > *": { minWidth: 0 },
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  />
);

export interface InlineFieldsProps extends BoxProps {
  /** Columns to occupy from `sm` up. Full row on `xs`. */
  span?: number;
}

/**
 * One grid cell holding several small controls side by side. Switch clusters
 * ("Vive" / "Vive con el NNA" / "Es Tutor") are the case: each is a `ra-input`
 * and would otherwise claim a whole column, so three toggles ate a full row and
 * spilled onto the next.
 */
export const InlineFields = ({ span = 2, sx, ...rest }: InlineFieldsProps) => (
  <Box
    {...rest}
    sx={[
      {
        gridColumn: { xs: "1 / -1", sm: `span ${span}` },
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: 2,
        rowGap: 1,
        minWidth: 0,
        "& > .ra-input": { m: 0, width: "auto" },
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  />
);

// `title` is redefined as a caption, so the HTML `title` attribute is dropped.
export interface FormSectionProps extends Omit<FormGridProps, "title"> {
  /** Small caption above the fields. Omit for an unlabeled group. */
  title?: ReactNode;
}

/**
 * A titled {@link FormGrid}. Multi-column forms need the grouping back: at four
 * columns a flat list of fifteen inputs reads as a wall, and related fields
 * (document type + number) no longer sit next to each other by accident.
 */
export const FormSection = ({ title, sx, ...rest }: FormSectionProps) => (
  <Box sx={{ width: "100%", "&:not(:first-of-type)": { mt: 3 } }}>
    {title && (
      <Typography
        variant="overline"
        component="h3"
        color="text.secondary"
        sx={{
          display: "block",
          mb: 1,
          pb: 0.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </Typography>
    )}
    <FormGrid {...rest} sx={sx} />
  </Box>
);

export default FormGrid;
