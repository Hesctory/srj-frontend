import { useMemo, useRef, useState } from "react";
import { Title, useTranslate } from "react-admin";
import { Route, Routes, useLocation, useParams } from "react-router-dom";
import { Box, Paper, useMediaQuery } from "@mui/material";
import { CatalogWorkspaceContext } from "@/features/products/components/catalog-workspace/workspace-context";
import { ProductsList } from "./products-list";
import { ProductsCreate } from "./products-create";
import { ProductsEdit } from "./products-edit";

/** Keyed by id: switching product starts a fresh editor, drafts and all. */
const EditRoute = () => {
  const { id } = useParams();
  return <ProductsEdit key={id} />;
};

const PANE = {
  variant: "outlined" as const,
  sx: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
  } as const,
};

/** A readable table: past this a row is mostly gap between name and count. */
const LIST_PAGE_MAX_WIDTH = 1100;
/** Room for the editor's header and save bar, however small the grid. */
const EDITOR_MIN_WIDTH = 640;
/** Before the grid reports its width (loading): a middling pane. */
const EDITOR_DEFAULT_WIDTH = 960;
const LIST_PANE_WIDTH = "clamp(280px, 20vw, 340px)";

/**
 * The catalogue. With no product open, the list is the page: centred, with
 * room for its columns. Opening a product shrinks the list into a side pane,
 * so moving between products stays one click and keeps the search and scroll.
 *
 * Below 1200px the two do not fit side by side, so each is its own page: the
 * list, and the editor with Volver back to it.
 *
 * Nothing stretches past its content: the editor pane hugs its grid and the
 * pair is centred on what it really is, so a QHD screen gets even margins,
 * not a blank half-pane. The pair re-centres when a product with a wider or
 * narrower grid opens; the editor's width animates so it glides, not jumps.
 */
export const ProductsWorkspace = () => {
  const narrow = useMediaQuery("(max-width:1199.95px)");
  const { pathname } = useLocation();
  const detailOpen = /^\/products\/.+/.test(pathname);
  const [editorWidth, setEditorWidth] = useState<number | null>(null);

  const translate = useTranslate();
  // A ref, not state: the editor reports on every change, and nothing needs
  // to re-render for it — only the next click on a way out reads it.
  const dirty = useRef(false);

  const workspace = useMemo(
    () => ({
      narrow,
      setEditorWidth,
      setDirty: (value: boolean) => {
        dirty.current = value;
      },
      confirmLeave: () =>
        !dirty.current ||
        window.confirm(translate("ra.message.unsaved_changes")),
    }),
    [narrow, translate],
  );

  const showPane = detailOpen && !narrow;

  return (
    <CatalogWorkspaceContext.Provider value={workspace}>
      {!detailOpen && <Title title="Productos" />}
      <Box
        display="flex"
        justifyContent="center"
        gap={2}
        flex={1}
        minHeight={0}
      >
        {(!detailOpen || showPane) && (
          <Paper
            {...PANE}
            component="section"
            aria-label="Productos"
            sx={{
              ...PANE.sx,
              flex: showPane ? `0 0 ${LIST_PANE_WIDTH}` : "1 1 0",
              minWidth: 0,
              maxWidth: showPane ? undefined : LIST_PAGE_MAX_WIDTH,
            }}
          >
            <ProductsList layout={showPane ? "pane" : "page"} />
          </Paper>
        )}
        {detailOpen && (
          <Paper
            {...PANE}
            component="section"
            aria-label="Producto"
            sx={{
              ...PANE.sx,
              flex: "1 1 0",
              minWidth: 0,
              maxWidth: Math.max(
                editorWidth ?? EDITOR_DEFAULT_WIDTH,
                EDITOR_MIN_WIDTH,
              ),
              transition: "max-width 200ms ease",
              "@media (prefers-reduced-motion: reduce)": { transition: "none" },
            }}
          >
            <Routes>
              <Route path="create/*" element={<ProductsCreate />} />
              <Route path=":id/*" element={<EditRoute />} />
            </Routes>
          </Paper>
        )}
      </Box>
    </CatalogWorkspaceContext.Provider>
  );
};
