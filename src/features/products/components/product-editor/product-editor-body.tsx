import { useEffect, useState, type ReactNode } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { Box, Button, Typography } from "@mui/material";
import type { NormalizedProduct } from "@/features/products/resources/products/product-record";
import {
  LINE_FIELDS,
  productLineTransform,
} from "@/features/products/resources/products/product-line";
import type { PriceDraftsApi } from "@/features/products/hooks/use-price-drafts";
import type { PriceDrafts } from "@/features/products/utils/price-grid";
import { useCatalogWorkspace } from "@/features/products/components/catalog-workspace/workspace-context";
import ProductHeader from "./product-header";
import ProductPrices from "./product-prices";
import UnsavedChangesGuard from "./unsaved-changes-guard";
import { PANE_CLASSES } from "@/features/products/components/catalog-workspace/pane-sx";

export interface EditorToolbarState {
  dirty: boolean;
  summary: ReactNode;
}

interface ProductEditorBodyProps {
  product: NormalizedProduct;
  stored: PriceDrafts;
  prices: PriceDraftsApi;
  saving: boolean;
  onChanged: () => void;
  toolbar: (state: EditorToolbarState) => ReactNode;
}

const blank = (value: unknown) =>
  value === "" || value === undefined ? null : value;

/** The editor inside the form: header, grid, and the save bar. */
const ProductEditorBody = ({
  product,
  stored,
  prices,
  saving,
  onChanged,
  toolbar,
}: ProductEditorBodyProps) => {
  const [editingLine, setEditingLine] = useState(false);
  const { reset } = useFormContext();
  const { errors } = useFormState();
  const watched = useWatch({ name: [...LINE_FIELDS] });

  const line = productLineTransform(
    Object.fromEntries(LINE_FIELDS.map((f, i) => [f, blank(watched[i])])),
  );
  const lineDirty = LINE_FIELDS.some(
    (field) => blank(line[field]) !== blank(product[field]),
  );
  const count = prices.changedCount;
  const dirty = lineDirty || count > 0;
  const { setDirty } = useCatalogWorkspace();
  useEffect(() => setDirty(dirty && !saving), [dirty, saving, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);
  const parts = [
    count > 0 && `${count} ${count === 1 ? "precio" : "precios"} sin guardar`,
    lineDirty && "datos del producto sin guardar",
  ].filter(Boolean);

  const summary = (
    <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
      <Typography variant="body2" noWrap aria-live="polite">
        {dirty ? parts.join(" · ") : "Sin cambios"}
      </Typography>
      <Button
        disabled={!dirty || saving}
        onClick={() => {
          reset();
          prices.discard();
        }}
      >
        Descartar
      </Button>
    </Box>
  );

  return (
    <>
      <ProductHeader
        editing={editingLine || Object.keys(errors).length > 0}
        onToggleEditing={() => setEditingLine(!editingLine)}
      />
      <ProductPrices
        product={product}
        stored={stored}
        prices={prices}
        onChanged={onChanged}
      />
      <Box className={PANE_CLASSES.footer} borderTop={1} borderColor="divider">
        {toolbar({ dirty, summary })}
      </Box>
      <UnsavedChangesGuard when={dirty && !saving} />
    </>
  );
};

export default ProductEditorBody;
