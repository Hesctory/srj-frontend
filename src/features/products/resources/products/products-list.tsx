import { useMemo, useState, type MouseEvent } from "react";
import { DataTable, ListBase, useGetList, useListContext } from "react-admin";
import { Link, useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import type { ProductListItem } from "@/types/product";
import useCatalogYear from "@/features/products/hooks/use-catalog-year";
import useNames from "@/features/products/hooks/use-names";
import { useCatalogWorkspace } from "@/features/products/components/catalog-workspace/workspace-context";
import CatalogYearSelect from "@/features/products/components/catalog-workspace/catalog-year-select";
import {
  KindCell,
  OfferCell,
  ProductCell,
  VersionsCell,
} from "./products-list-cells";

/**
 * Variants on offer per product in the workspace's year.
 *
 * Asked separately, by id, because filtering the list itself by year keeps
 * only the lines priced that year — and the catalogue must show the unpriced
 * ones too, flagged. Missing from this answer means "not on sale".
 */
const useOffers = (ids: number[]) => {
  const { schoolYearId } = useCatalogYear();
  const { data, isPending } = useGetList<ProductListItem>(
    "products",
    {
      filter: { id: ids, schoolYearId },
      pagination: { page: 1, perPage: Math.max(ids.length, 1) },
      sort: { field: "id", order: "ASC" },
    },
    { enabled: ids.length > 0 && schoolYearId != null },
  );
  const offers = useMemo(
    () => new Map((data ?? []).map((r) => [r.id, r.variantsOnOffer ?? 0])),
    [data],
  );
  return { offers, isPending };
};

export type ProductsListLayout = "page" | "pane";

const ListPane = ({ layout }: { layout: ProductsListLayout }) => {
  const {
    data = [],
    total,
    error,
    filterValues,
    setFilters,
    displayedFilters,
  } = useListContext<ProductListItem>();
  const { yearLabel } = useCatalogYear();
  const { confirmLeave } = useCatalogWorkspace();
  const types = useNames("product-types");
  const genders = useNames("garment-genders");
  const [search, setSearch] = useState<string>(filterValues.q ?? "");
  const selectedId = Number(
    useLocation().pathname.match(/^\/products\/(\d+)/)?.[1],
  );
  const ids = useMemo(() => data.map((r) => r.id), [data]);
  const { offers, isPending: offersLoading } = useOffers(ids);
  // A phone-width page has no room for the extra columns either.
  const small = useMediaQuery("(max-width:699.95px)");
  const compact = layout === "pane" || small;

  const setFilter = (key: string, value: unknown, debounce = false) =>
    setFilters({ ...filterValues, [key]: value }, displayedFilters, debounce);
  const narrowed = !!filterValues.q || filterValues.productTypeId != null;

  const newButton = (
    <Button
      component={Link}
      to="/products/create"
      onClick={(event: MouseEvent) => {
        if (!confirmLeave()) event.preventDefault();
      }}
      variant="contained"
      startIcon={<AddIcon />}
      sx={{ flexShrink: 0 }}
    >
      Nuevo
    </Button>
  );
  const searchField = (
    <TextField
      size="small"
      placeholder="Buscar producto o versión"
      value={search}
      onChange={(event) => {
        setSearch(event.target.value);
        setFilter("q", event.target.value || undefined, true);
      }}
      // In the page's row it takes the slack; in the pane's column, only
      // its own height.
      sx={layout === "page" ? { flex: "1 1 220px" } : undefined}
      slotProps={{
        htmlInput: { "aria-label": "Buscar" },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
  const typeToggles = (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={filterValues.productTypeId ?? ""}
      onChange={(_, value) =>
        value !== null &&
        setFilter("productTypeId", value === "" ? undefined : value)
      }
      aria-label="Tipo de producto"
      sx={{
        flexWrap: "wrap",
        "& .MuiToggleButton-root": { py: 0.25, textTransform: "none" },
      }}
    >
      <ToggleButton value="">Todos</ToggleButton>
      {[...types].map(([id, name]) => (
        <ToggleButton key={id} value={id}>
          {name}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );

  const columns = [
    <DataTable.Col
      key="name"
      source="name"
      label="Producto"
      // Width 0 + ellipsis: long names shrink instead of pushing the
      // offer column under the scrollbar.
      sx={{ maxWidth: 0, width: compact ? "100%" : "40%" }}
    >
      <ProductCell types={types} genders={genders} compact={compact} />
    </DataTable.Col>,
  ];
  if (!compact) {
    columns.push(
      <DataTable.Col key="kind" label="Tipo" disableSort>
        <KindCell types={types} genders={genders} />
      </DataTable.Col>,
      <DataTable.Col key="versions" label="Versiones" disableSort>
        <VersionsCell />
      </DataTable.Col>,
    );
  }
  columns.push(
    <DataTable.Col
      key="offer"
      // In the pane the year selector sits right above: the year alone says it
      // and leaves the names room.
      label={
        compact
          ? yearLabel || "Oferta"
          : yearLabel
            ? `A la venta ${yearLabel}`
            : "A la venta"
      }
      align="right"
      disableSort
      sx={{ whiteSpace: "nowrap" }}
    >
      <OfferCell offers={offers} loading={offersLoading} />
    </DataTable.Col>,
  );

  return (
    <Box display="flex" flexDirection="column" flex={1} minHeight={0}>
      {layout === "pane" ? (
        <Box
          p={1.5}
          display="flex"
          flexDirection="column"
          gap={1.25}
          borderBottom={1}
          borderColor="divider"
        >
          <Box display="flex" gap={1} alignItems="center">
            <Box flex={1}>
              <CatalogYearSelect />
            </Box>
            {newButton}
          </Box>
          {searchField}
          {typeToggles}
        </Box>
      ) : (
        <Box
          p={2}
          display="flex"
          flexWrap="wrap"
          alignItems="center"
          gap={1.5}
          borderBottom={1}
          borderColor="divider"
        >
          <CatalogYearSelect />
          {searchField}
          {typeToggles}
          {newButton}
        </Box>
      )}

      <Box flex={1} minHeight={0} overflow="auto">
        {error ? (
          <Alert severity="error" sx={{ m: 1.5 }}>
            No se pudo cargar el catálogo. Vuelve a intentarlo.
          </Alert>
        ) : (
          <DataTable
            rowClick={(id) =>
              Number(id) !== selectedId && confirmLeave()
                ? `/products/${id}`
                : false
            }
            bulkActionButtons={false}
            rowSx={(record) =>
              record.id === selectedId
                ? {
                    bgcolor: "action.selected",
                    // Secondary text falls under 4.5:1 on the selected fill.
                    "& .MuiTypography-caption": { color: "text.primary" },
                  }
                : {}
            }
            empty={
              <Box p={2}>
                <Typography variant="body2" color="text.secondary">
                  {narrowed
                    ? "Ningún producto coincide con la búsqueda."
                    : "Todavía no hay productos. Crea el primero con «Nuevo»."}
                </Typography>
              </Box>
            }
          >
            {columns}
          </DataTable>
        )}
      </Box>

      <Box
        px={layout === "pane" ? 1.5 : 2}
        py={0.5}
        display="flex"
        alignItems="center"
        borderTop={1}
        borderColor="divider"
      >
        <Typography variant="caption" color="text.secondary" flex={1}>
          {total == null
            ? ""
            : total > data.length
              ? `${data.length} de ${total} productos`
              : `${total} ${total === 1 ? "producto" : "productos"}`}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              size="small"
              name="showInactive"
              checked={filterValues.isActive !== true}
              onChange={(event) =>
                setFilter("isActive", event.target.checked ? undefined : true)
              }
            />
          }
          label={<Typography variant="caption">Ver inactivos</Typography>}
          sx={{ mr: 0 }}
        />
      </Box>
    </Box>
  );
};

/**
 * The catalogue's product list: the whole page when nothing is open, the
 * workspace's left pane beside an open product. Every `ProductFilter` key is
 * used: `q`, `productTypeId` and `isActive` here, `schoolYearId` and `id` for
 * the offer column (see `useOffers`).
 */
export const ProductsList = ({
  layout = "page",
}: {
  layout?: ProductsListLayout;
}) => (
  <ListBase
    resource="products"
    perPage={200}
    sort={{ field: "name", order: "ASC" }}
    filterDefaultValues={{ isActive: true }}
    debounce={500}
    disableSyncWithLocation
    storeKey="products.catalog.list"
  >
    <ListPane layout={layout} />
  </ListBase>
);
