import { Create, Form } from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";
import useCatalogYear from "@/features/products/hooks/use-catalog-year";
import { useCatalogWorkspace } from "@/features/products/components/catalog-workspace/workspace-context";
import ProductCreateBody from "@/features/products/components/product-editor/product-create-body";
import {
  PANE_FORM_CLASS,
  PANE_SX,
} from "@/features/products/components/catalog-workspace/pane-sx";
import { productCreateTransform } from "./product-create-transform";

/**
 * Creating a product line, its first version, its variants and their prices
 * — in one POST.
 *
 * This is the only screen that still writes the whole tree at once, and it is
 * safe here precisely because the tree is new: `PUT /api/products/:id` deletes
 * children absent from the payload, which is fine when there are none and
 * destructive the moment a version has sales history. Everything after
 * creation goes through the incremental editor.
 */
export const ProductsCreate = () => {
  const { schoolYearId } = useCatalogYear();
  const { confirmLeave } = useCatalogWorkspace();

  return (
    <Create
      redirect="edit"
      mutationMode="pessimistic"
      transform={productCreateTransform}
      component="div"
      sx={PANE_SX}
    >
      <Form
        defaultValues={{
          isActive: true,
          schoolYearId,
          columnKeys: [],
          prices: {},
        }}
        className={PANE_FORM_CLASS}
      >
        <ProductCreateBody
          toolbar={<CRUDToolBar save onBeforeLeave={confirmLeave} />}
        />
      </Form>
    </Create>
  );
};
