import { Resource } from "react-admin";
import InventoryIcon from "@mui/icons-material/Inventory";
import { ProductsWorkspace } from "./products-workspace";

/**
 * One route for the whole catalogue: the workspace keeps the product list
 * mounted and swaps the editor beside it (`create`, `:id`) in nested routes.
 * `hasCreate`/`hasEdit` keep React Admin's links and redirects pointing there.
 */
export const ProductsResource = (
  <Resource
    name="products"
    list={ProductsWorkspace}
    hasCreate
    hasEdit
    icon={InventoryIcon}
    options={{ label: "Productos" }}
  />
);
