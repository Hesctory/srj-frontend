import { defaultTheme, defaultDarkTheme } from "react-admin";
import {
  createTheme,
  type PaletteOptions,
  type Theme,
} from "@mui/material/styles";
import { deepmerge } from "@mui/utils";

/**
 * SRJ design system — "Slate + royal blue".
 *
 * The shell (sidebar) is a dark slate rail; blue (#2456d6) is reserved as the
 * *action / active* color, not a flooded surface. Surfaces are white on a soft
 * slate-tinted background. Everything below is global so resources stay untouched:
 * inputs, buttons, cards, filters and list toolbars all inherit from here.
 *
 * Two themes are built from a single `makeCustomizations(palette)` factory so
 * light and dark stay in lockstep — only the palette differs. Component style
 * overrides that touch surface colors use the theme callback form so they adapt
 * automatically to whichever palette is active. Light is the default; users can
 * flip to dark via the toggle in the app bar.
 */

// Slate sidebar rail. Kept as a constant so the layout can reference the same
// value. Light mode uses this slate; dark mode drops to a deep indigo rail that
// sits between the indigo canvas and the raised cards.
export const SIDEBAR_DARK = "#1b2430";
const SIDEBAR_DARK_MODE = "#12142a";

const BLUE = {
  main: "#2456d6",
  dark: "#1b44ad",
  light: "#5b82e3",
  contrastText: "#ffffff",
};

// Indigo accent for dark surfaces — kept for `info` so informational states stay
// blue and don't read as a yellow warning.
const INDIGO_DARK = {
  main: "#6c00ff",
  dark: "#6366f1",
  light: "#a5b4fc",
  contrastText: "#0c0e1c",
};

// Brand yellow (from the SRJ logo) as the dark-mode primary. Very light, so it
// carries near-black text on contained buttons.
const YELLOW_DARK = {
  main: "#ffda2c",
  dark: "#e0be00",
  light: "#ffe680",
  contrastText: "#1a1500",
};

/**
 * Academic accents.
 *
 * `level` and `shift` are the two categorical dimensions repeated on every
 * student row, so they get a stable tint instead of plain text: an admin scans
 * a filtered list by color/shape rather than reading each cell. They live in
 * the palette (not as one-off `sx` colors) so the same level reads the same in
 * every list and both modes stay in lockstep with the rest of the theme.
 *
 * Levels follow the school progression as a hue ramp — Inicial (emerald) →
 * Primaria (blue) → Secundaria (violet). Shifts follow the time of day —
 * Mañana (amber sunrise), Tarde (indigo dusk), Noche (slate night). `neutral`
 * is the fallback for values the backend adds later, so an unknown level
 * degrades to a readable gray chip instead of an unstyled one.
 */
export interface AcademicTint {
  /** Soft fill for chips and badges. */
  bg: string;
  /** Text/icon color, contrast-checked against `bg`. */
  fg: string;
  /** Hairline border so the chip keeps its shape on hovered/striped rows. */
  border: string;
}

export interface AcademicPalette {
  inicial: AcademicTint;
  primaria: AcademicTint;
  secundaria: AcademicTint;
  morning: AcademicTint;
  afternoon: AcademicTint;
  evening: AcademicTint;
  neutral: AcademicTint;
}

declare module "@mui/material/styles" {
  interface Palette {
    academic: AcademicPalette;
  }
  interface PaletteOptions {
    academic?: AcademicPalette;
  }
}

const lightAcademic: AcademicPalette = {
  inicial: { bg: "#d1fae5", fg: "#047857", border: "rgba(4,120,87,0.22)" },
  primaria: { bg: "#dbeafe", fg: "#1d4ed8", border: "rgba(29,78,216,0.22)" },
  secundaria: { bg: "#ede9fe", fg: "#6d28d9", border: "rgba(109,40,217,0.22)" },
  morning: { bg: "#fef3c7", fg: "#b45309", border: "rgba(180,83,9,0.22)" },
  afternoon: { bg: "#e0e7ff", fg: "#4338ca", border: "rgba(67,56,202,0.22)" },
  evening: { bg: "#e2e8f0", fg: "#334155", border: "rgba(51,65,85,0.2)" },
  neutral: { bg: "#eef2f6", fg: "#5b6675", border: "rgba(91,102,117,0.2)" },
};

const darkAcademic: AcademicPalette = {
  inicial: {
    bg: "rgba(52,211,153,0.16)",
    fg: "#6ee7b7",
    border: "rgba(110,231,183,0.28)",
  },
  primaria: {
    bg: "rgba(96,165,250,0.16)",
    fg: "#93c5fd",
    border: "rgba(147,197,253,0.28)",
  },
  secundaria: {
    bg: "rgba(167,139,250,0.18)",
    fg: "#c4b5fd",
    border: "rgba(196,181,253,0.3)",
  },
  morning: {
    bg: "rgba(251,191,36,0.16)",
    fg: "#fcd34d",
    border: "rgba(252,211,77,0.3)",
  },
  afternoon: {
    bg: "rgba(129,140,248,0.18)",
    fg: "#a5b4fc",
    border: "rgba(165,180,252,0.3)",
  },
  evening: {
    bg: "rgba(148,163,184,0.16)",
    fg: "#cbd5e1",
    border: "rgba(203,213,225,0.26)",
  },
  neutral: {
    bg: "rgba(148,163,184,0.14)",
    fg: "#a5abc9",
    border: "rgba(165,171,201,0.26)",
  },
};

const lightPalette: PaletteOptions = {
  mode: "light",
  primary: BLUE,
  secondary: {
    main: "#475569",
    dark: "#334155",
    light: "#64748b",
    contrastText: "#ffffff",
  },
  info: BLUE,
  success: { main: "#16a34a", contrastText: "#ffffff" },
  warning: { main: "#d97706", contrastText: "#ffffff" },
  error: { main: "#dc2626", contrastText: "#ffffff" },
  background: {
    default: "#f2f4f7",
    paper: "#ffffff",
  },
  text: {
    primary: "#1b2430",
    secondary: "#5b6675",
    disabled: "#9aa4b2",
  },
  divider: "#e3e8ef",
  academic: lightAcademic,
};

// Dedicated dark input surface — one step lighter than a card so filled
// controls read as distinct from the panel they sit on.
const DARK_INPUT = "#24284a";

const darkPalette: PaletteOptions = {
  mode: "dark",
  primary: YELLOW_DARK,
  secondary: {
    main: "#a5b0d6",
    dark: "#7c88b8",
    light: "#c7cef0",
    contrastText: "#0c0e1c",
  },
  info: INDIGO_DARK,
  success: { main: "#22c55e", contrastText: "#0c0e1c" },
  // Orange, not amber, so it stays distinct from the yellow primary.
  warning: { main: "#fb923c", contrastText: "#0c0e1c" },
  error: { main: "#FF0000", contrastText: "#0c0e1c" },
  background: {
    // Near-black indigo canvas so raised cards clearly float above it.
    default: "#0c0e1c",
    paper: "#1a1d38",
  },
  text: {
    primary: "#e7e9f5",
    secondary: "#a5abc9",
    disabled: "#646a8c",
  },
  // Faint indigo hairline so card/panel edges stay visible against dark surfaces.
  divider: "rgba(129,140,248,0.18)",
  academic: darkAcademic,
};

// Soft, layered shadows instead of MUI's heavy default elevation.
const SOFT_SHADOW =
  "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.08)";

const FONT = "'Plus Jakarta Sans', sans-serif";

const makeCustomizations = (palette: PaletteOptions) => ({
  palette,
  shape: { borderRadius: 8 },
  // Balanced density: standard 8px base unit.
  spacing: 8,
  sidebar: {
    width: 248,
    closedWidth: 64,
  },
  typography: {
    fontFamily: FONT,
    // Clear hierarchy: tight, weighted headings down to calm body text.
    h1: {
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: "2rem",
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: "1.6rem",
      letterSpacing: "-0.015em",
    },
    h3: {
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: "1.35rem",
      letterSpacing: "-0.01em",
    },
    h4: { fontFamily: FONT, fontWeight: 600, fontSize: "1.15rem" },
    h5: { fontFamily: FONT, fontWeight: 600, fontSize: "1.05rem" },
    h6: { fontFamily: FONT, fontWeight: 600, fontSize: "1rem" },
    subtitle1: { fontFamily: FONT, fontWeight: 600 },
    subtitle2: { fontFamily: FONT, fontWeight: 600 },
    body1: { fontFamily: FONT, fontSize: "0.9rem" },
    body2: { fontFamily: FONT, fontSize: "0.85rem" },
    button: {
      fontFamily: FONT,
      fontWeight: 600,
      textTransform: "none" as const,
      letterSpacing: 0,
    },
  },
  components: {
    // --- Buttons (RA Create/Export/Save/Filter + MUI buttons everywhere) ---
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none" as const,
          fontWeight: 600,
          letterSpacing: 0,
          paddingInline: 14,
        },
        contained: {
          boxShadow: SOFT_SHADOW,
          "&:hover": { boxShadow: SOFT_SHADOW },
        },
        sizeSmall: { paddingInline: 10 },
        sizeLarge: { paddingInline: 18, paddingBlock: 8 },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },

    // --- Inputs: modern outlined boxes instead of RA's default filled underline ---
    MuiTextField: {
      defaultProps: { variant: "outlined" as const, size: "small" as const },
    },
    MuiFormControl: {
      defaultProps: { variant: "outlined" as const, size: "small" as const },
    },
    MuiSelect: { defaultProps: { variant: "outlined" as const } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          borderRadius: 8,
          backgroundColor:
            theme.palette.mode === "dark"
              ? DARK_INPUT
              : theme.palette.background.paper,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.divider,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.light,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
            borderWidth: 1.5,
          },
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          "&.Mui-focused": { color: theme.palette.primary.main },
        }),
      },
    },

    // --- Cards & surfaces ---
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        rounded: { borderRadius: 12 },
        elevation1: { boxShadow: SOFT_SHADOW },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          borderRadius: 12,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: SOFT_SHADOW,
          backgroundImage: "none",
        }),
      },
    },

    // --- App bar: light, slim, hairline bottom border (no heavy shadow) ---
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: "none" } },
    },

    // --- Sidebar: full-height dark rail (deeper shade in dark mode) ---
    RaSidebar: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => {
          const rail =
            theme.palette.mode === "dark" ? SIDEBAR_DARK_MODE : SIDEBAR_DARK;
          return {
            height: "100vh",
            marginTop: 0,
            "& .RaSidebar-fixed": {
              height: "100vh",
              top: 0,
              backgroundColor: rail,
            },
            "& .MuiPaper-root": {
              backgroundColor: rail,
              border: "none",
            },
            // The phone drawer scrolls its paper, not `.RaSidebar-fixed`. Hide
            // that scrollbar the way RA hides the docked rail's: a visible one
            // takes ~15px from the 248px menu and adds a horizontal scrollbar.
            "& .MuiDrawer-paper": {
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            },
          };
        },
      },
    },
    RaMenu: {
      styleOverrides: { root: { backgroundColor: "transparent" } },
    },
    RaMenuItemLink: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          color: "rgba(255,255,255,0.72)",
          borderRadius: 8,
          margin: "2px 8px",
          paddingTop: 8,
          paddingBottom: 8,
          borderLeft: "3px solid transparent",
          "& .RaMenuItemLink-icon": { color: "inherit", minWidth: 40 },
          "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
          "&.RaMenuItemLink-active": {
            color: "#fff",
            fontWeight: 600,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(129,140,248,0.28)"
                : "rgba(36,86,214,0.22)",
            borderLeft: `3px solid ${theme.palette.primary.main}`,
            "& .RaMenuItemLink-icon": { color: "#fff" },
          },
        }),
      },
    },

    // --- List action toolbar + filters: spacing & alignment ---
    RaTopToolbar: {
      styleOverrides: {
        root: {
          alignItems: "center",
          gap: 8,
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
    },
    // --- List: bound the table to the available height and scroll it internally ---
    // Instead of the whole page growing (which scrolls the list toolbar's Create
    // button and pagination out of view), build a flex-height chain from the list
    // root down to the content Card, then make that Card the single scroll region.
    // The toolbar (Create/Export/Filter) and pagination are siblings of the Card,
    // so they stay pinned while the table body scrolls inside it. The sticky
    // `MuiTableCell` head below then sticks to the top of the Card rather than the
    // page. Requires `<main>` to be a flex column (see MyLayout) so this chain has
    // a bounded height to resolve against.
    RaList: {
      styleOverrides: {
        root: {
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          "& .RaList-main": {
            gap: 8,
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          },
          "& .RaList-content": {
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            overscrollBehavior: "contain",
          },
        },
      },
    },
    RaFilterForm: {
      styleOverrides: {
        root: { gap: 4 },
      },
    },
    // --- Tables: compact density (EXPERIMENTAL — recommendation #5) ---
    // Tighter rows so admins scan more records per screen, plus a sticky,
    // shaded header so column labels stay visible on long lists. RA DataTable
    // renders size="small" cells, so the padding override lands on every list.
    // Delete this whole block to revert tables to RA/MUI defaults.
    MuiTableCell: {
      styleOverrides: {
        sizeSmall: { paddingTop: 4, paddingBottom: 4 },
        head: ({ theme }: { theme: Theme }) => ({
          position: "sticky" as const,
          top: 0,
          zIndex: 2,
          backgroundColor:
            theme.palette.mode === "dark" ? DARK_INPUT : "#f8fafc",
          fontWeight: 600,
          color: theme.palette.text.secondary,
        }),
      },
    },
  },
});

export const lightTheme = createTheme(
  deepmerge(defaultTheme, makeCustomizations(lightPalette)),
);

export const darkTheme = createTheme(
  deepmerge(defaultDarkTheme, makeCustomizations(darkPalette)),
);
