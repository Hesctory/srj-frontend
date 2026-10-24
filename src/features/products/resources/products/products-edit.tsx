import { useMemo, useState } from "react";
import {
  Edit,
  Form,
  useDataProvider,
  useNotify,
  useRecordContext,
  useRefresh,
} from "react-admin";
import type { FieldValues } from "react-hook-form";
import { CircularProgress, Stack } from "@mui/material";
import CRUDToolBar from "@/app/layout/crud-toolbar";
import type { AppDataProvider } from "@/app/data-provider";
import type { ProductDetail } from "@/types/product";
import { toCatalogError } from "@/features/products/utils/catalog-error";
import {
  countCostOnlyCells,
  draftsFromProduct,
  priceListChanges,
} from "@/features/products/utils/price-grid";
import usePriceDrafts from "@/features/products/hooks/use-price-drafts";
import ProductEditorBody from "@/features/products/components/product-editor/product-editor-body";
import {
  PANE_FORM_CLASS,
  PANE_SX,
} from "@/features/products/components/catalog-workspace/pane-sx";
import { useCatalogWorkspace } from "@/features/products/components/catalog-workspace/workspace-context";
import { normalizeProductRecord } from "./product-record";
import { LINE_FIELDS, productLineTransform } from "./product-line";

const EditorForm = () => {
  const record = useRecordContext<ProductDetail>();
  // Memoized on the record: a parent re-render must not look like a reload.
  const { product, isPartial } = useMemo(
    () => normalizeProductRecord(record),
    [record],
  );
  const stored = useMemo(
    () => (product ? draftsFromProduct(product) : {}),
    [product],
  );
  const prices = usePriceDrafts(stored);
  const dataProvider = useDataProvider<AppDataProvider>();
  const notify = useNotify();
  const refresh = useRefresh();
  const [saving, setSaving] = useState(false);
  const { confirmLeave } = useCatalogWorkspace();

  // The list's cached row has no versions: wait for the real detail.
  if (isPartial || !product) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress aria-label="Cargando producto" />
      </Stack>
    );
  }

  /**
   * One Guardar for everything: the line's own fields through `update`
   * (mapped to `PUT /products/:id/line`), then one price list per version and
   * year that changed. A failure part way leaves the rest unsaved and still
   * marked, after a refresh shows what did land.
   */
  const submit = async (values: FieldValues) => {
    if (countCostOnlyCells(prices.drafts) > 0) {
      notify(
        "Hay costos sin precio de venta. Ponles precio o borra el costo antes de guardar.",
        { type: "error" },
      );
      return;
    }
    const line = productLineTransform(values);
    const lineChanged = LINE_FIELDS.some(
      (field) => (line[field] ?? null) !== (product[field] ?? null),
    );
    setSaving(true);
    try {
      if (lineChanged) {
        await dataProvider.update("products", {
          id: product.id,
          data: line,
          previousData: product,
        });
      }
      for (const change of priceListChanges(product, stored, prices.drafts)) {
        await dataProvider.setVersionPriceList(change.versionId, change.body);
      }
      prices.settle();
      notify("Cambios guardados.", { type: "success" });
    } catch (cause) {
      notify(toCatalogError(cause).message, { type: "error" });
    } finally {
      setSaving(false);
      refresh();
    }
  };

  return (
    <Form
      onSubmit={submit}
      className={PANE_FORM_CLASS}
      // A reload after a version action must not wipe a name being typed.
      resetOptions={{ keepDirtyValues: true }}
    >
      <ProductEditorBody
        product={product}
        stored={stored}
        prices={prices}
        saving={saving}
        onChanged={refresh}
        toolbar={({ dirty, summary }) => (
          <CRUDToolBar
            save
            saveAlwaysEnable={dirty && !saving}
            onBeforeLeave={confirmLeave}
          >
            {summary}
          </CRUDToolBar>
        )}
      />
    </Form>
  );
};

/**
 * The catalogue editor: the product line's fields, folded under its name, and
 * the price grid of every version for the workspace's school year.
 *
 * No `delete`: the backend refuses it for any product with history.
 * Deactivating the line is the real action.
 */
export const ProductsEdit = () => (
  <Edit
    actions={false}
    mutationMode="pessimistic"
    redirect={false}
    component="div"
    sx={PANE_SX}
  >
    <EditorForm />
  </Edit>
);
