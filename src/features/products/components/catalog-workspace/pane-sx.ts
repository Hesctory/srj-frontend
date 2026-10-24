import type { SxProps, Theme } from "@mui/material";

/** Class the editor's <Form> carries so the flex chain reaches inside it. */
export const PANE_FORM_CLASS = "catalog-pane-form";

/** The editor's parts that change behaviour on a phone (see `PANE_SX`). */
export const PANE_CLASSES = {
  body: "catalog-pane-body",
  scroll: "catalog-pane-scroll",
  footer: "catalog-pane-footer",
};

// `minWidth: 0` and `stretch` at every level: React Admin's card otherwise
// sizes to its content, and a grid wider than the pane is clipped instead of
// scrolling inside it.
const column = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
} as const;

/**
 * Makes an <Edit>/<Create> fill the workspace's right pane as a flex column,
 * so the grid scrolls inside it while the header and the save bar stay put
 * (on a phone, the whole form scrolls).
 * The pane itself is sized to the grid by the workspace.
 */
export const PANE_SX: SxProps<Theme> = {
  ...column,
  "& .RaEdit-main, & .RaCreate-main": { ...column, mt: 0 },
  "& .RaEdit-card, & .RaCreate-card": column,
  [`& form.${PANE_FORM_CLASS}`]: column,
  // On a phone a fixed header over its own scroll box leaves a slit for the
  // prices: the whole form scrolls instead, with only the save bar pinned.
  "@media (max-width:599.95px)": {
    [`& form.${PANE_FORM_CLASS}`]: { overflowY: "auto" },
    [`& .${PANE_CLASSES.body}, & .${PANE_CLASSES.scroll}`]: {
      flex: "none",
      overflow: "visible",
    },
    [`& .${PANE_CLASSES.footer}`]: {
      position: "sticky",
      bottom: 0,
      zIndex: 5,
      px: 1,
      bgcolor: "background.paper",
    },
  },
};
