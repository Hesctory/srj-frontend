import type { ReactNode } from "react";
import {
  BooleanInput,
  ReferenceInput,
  SelectInput,
  TextInput,
  required,
} from "react-admin";
import { useWatch } from "react-hook-form";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { FormGrid } from "@/shared/components/form-grid";
import useNames from "@/features/products/hooks/use-names";
import { ProductLineFields } from "@/features/products/resources/products/product-axis-fields";
import { PRODUCT_TYPE_GARMENT } from "@/features/products/resources/products/product-constants";
import { useCatalogWorkspace } from "@/features/products/components/catalog-workspace/workspace-context";
import CatalogYearSelect from "@/features/products/components/catalog-workspace/catalog-year-select";

/** "Uniforme · Unisex · Niño y adulto". */
const useLineSummary = () => {
  const [typeId, genderId, scaleId] = useWatch({
    name: ["productTypeId", "garmentGenderId", "sizeScaleId"],
  });
  const types = useNames("product-types");
  const genders = useNames("garment-genders");
  const scales = useNames("sizes/scales");
  const name = (names: Map<number, string | null>, id: unknown) =>
    names.get(Number(id));
  const parts = [name(types, typeId)];
  if (Number(typeId) === PRODUCT_TYPE_GARMENT) {
    parts.push(name(genders, genderId), name(scales, scaleId));
  }
  return parts.filter(Boolean).join(" · ");
};

interface ProductHeaderProps {
  /** Shows the line's fields for editing instead of the summary. */
  editing: boolean;
  onToggleEditing: () => void;
  /** Leading slot: "Nuevo producto" on create, nothing on edit. */
  title?: ReactNode;
  /** More fields in the same grid: the first version's, on create. */
  children?: ReactNode;
}

/**
 * The product's name and what it is, with its fields one click away. The
 * line is edited rarely and the prices often, so the fields stay folded.
 */
const ProductHeader = ({
  editing,
  onToggleEditing,
  title,
  children,
}: ProductHeaderProps) => {
  const name = useWatch({ name: "name" });
  const summary = useLineSummary();
  const { narrow } = useCatalogWorkspace();

  return (
    <Box px={2} pt={1.5} pb={1}>
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <Box flex="1 1 200px" minWidth={0}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="h6" component="h2" noWrap>
              {title ?? (name || "Sin nombre")}
            </Typography>
            {!title && (
              <Tooltip title={editing ? "Ocultar datos" : "Editar datos"}>
                <IconButton
                  size="small"
                  aria-label="Editar datos del producto"
                  aria-expanded={editing}
                  onClick={onToggleEditing}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {!editing && summary && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {summary}
            </Typography>
          )}
        </Box>
        {narrow && <CatalogYearSelect />}
        <BooleanInput source="isActive" label="Activo" helperText={false} />
      </Box>
      {editing && (
        <FormGrid sx={{ mt: 1.5 }}>
          <TextInput source="name" label="Nombre" validate={required()} />
          <ReferenceInput source="productTypeId" reference="product-types">
            <SelectInput optionText="name" label="Tipo" validate={required()} />
          </ReferenceInput>
          <ProductLineFields />
          {children}
        </FormGrid>
      )}
    </Box>
  );
};

export default ProductHeader;
