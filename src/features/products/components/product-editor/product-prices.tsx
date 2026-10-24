import { useEffect, useMemo, useState } from "react";
import { useGetList } from "react-admin";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  ToggleButton,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UndoIcon from "@mui/icons-material/Undo";
import type { ProductVersion } from "@/types/product";
import type { NormalizedProduct } from "@/features/products/resources/products/product-record";
import {
  PRODUCT_TYPE_BOOK,
  axisForProductType,
} from "@/features/products/resources/products/product-constants";
import {
  priceRuns,
  raisePrice,
  readCell,
  variantKey,
  writeCells,
  type PriceDrafts,
  type PriceWrite,
} from "@/features/products/utils/price-grid";
import useCatalogYear, {
  useCatalogRows,
} from "@/features/products/hooks/use-catalog-year";
import useGridColumns from "@/features/products/hooks/use-grid-columns";
import useSizes from "@/features/products/hooks/use-sizes";
import type { PriceDraftsApi } from "@/features/products/hooks/use-price-drafts";
import PriceGrid, {
  GRID_GUTTERS,
  priceGridMaxWidth,
} from "@/features/products/components/price-grid/price-grid";
import { useCatalogWorkspace } from "@/features/products/components/catalog-workspace/workspace-context";
import type {
  GridSectionSpec,
  GridWrite,
} from "@/features/products/components/price-grid/price-grid-types";
import KardexDialog from "@/features/products/components/kardex-dialog";
import VersionHeader from "./version-header";
import NewVersionDialog from "./new-version-dialog";
import {
  alignVariants,
  buildVersionRows,
  orderVersions,
  unitWord,
  versionMeta,
  versionProblems,
} from "./version-rows";
import { PANE_CLASSES } from "@/features/products/components/catalog-workspace/pane-sx";

interface ProductPricesProps {
  product: NormalizedProduct;
  stored: PriceDrafts;
  prices: PriceDraftsApi;
  onChanged: () => void;
}

/**
 * Every version's prices and stock for the workspace's school year, as one
 * grid. Versions with nothing on sale that year fold into a single line each.
 */
const ProductPrices = ({
  product,
  stored,
  prices,
  onChanged,
}: ProductPricesProps) => {
  const { schoolYears, schoolYearId, yearLabel } = useCatalogYear();
  const [show, setShow] = useCatalogRows();
  const axis = axisForProductType(product.productTypeId);
  const isBook = product.productTypeId === PRODUCT_TYPE_BOOK;
  const { columns, isLoading: columnsLoading } = useGridColumns({
    axis,
    sizeScaleId: product.sizeScaleId,
    versions: product.versions,
  });
  const { sizes: scaleSizes } = useSizes(product.sizeScaleId);
  const { data: publishers = [] } = useGetList<{ id: number; name: string }>(
    "publishers",
    {
      pagination: { page: 1, perPage: 200 },
      sort: { field: "name", order: "ASC" },
    },
    { enabled: isBook },
  );
  const [expanded, setExpanded] = useState<number[]>([]);
  const [kardex, setKardex] = useState<{ id: number; title: string } | null>(
    null,
  );
  const [addingVersion, setAddingVersion] = useState(false);

  // Newest first, whatever order the backend sends (it sends oldest first).
  const versions = useMemo(
    () =>
      orderVersions(
        product.versions,
        new Map(schoolYears.map((y, i) => [y.id, Number(y.year) || -i])),
      ),
    [product.versions, schoolYears],
  );
  const { setEditorWidth } = useCatalogWorkspace();
  // Only once the sizes are known: the pane would otherwise jump.
  useEffect(() => {
    if (columnsLoading) return;
    setEditorWidth(priceGridMaxWidth(columns.length) + GRID_GUTTERS);
    return () => setEditorWidth(null);
  }, [columns.length, columnsLoading, setEditorWidth]);
  const aligned = useMemo(
    () =>
      new Map(product.versions.map((v) => [v.id, alignVariants(v, columns)])),
    [product.versions, columns],
  );

  // Without its columns the grid would render collapsed for a moment.
  if (columnsLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress aria-label="Cargando tallas" />
      </Box>
    );
  }

  if (schoolYearId == null) {
    return (
      <Alert severity="info" sx={{ m: 2.5 }}>
        No hay años escolares: crea uno en Configuraciones para poner precios.
      </Alert>
    );
  }

  const { drafts } = prices;
  const labelOf = (version: ProductVersion) => {
    const label = version.label?.trim() || `Versión ${version.id}`;
    const publisher = publishers.find((p) => p.id === version.publisherId);
    return publisher ? `${publisher.name} ${label}` : label;
  };
  const priced = (version: ProductVersion, source: PriceDrafts, year: number) =>
    version.variants.some(
      (variant) => readCell(source, year, variantKey(variant.id)).sale != null,
    );
  const visible = versions.filter(
    (v) =>
      priced(v, drafts, schoolYearId) ||
      priced(v, stored, schoolYearId) ||
      expanded.includes(v.id),
  );
  const folded = versions.filter((v) => !visible.includes(v));

  const onWrite = (writes: GridWrite[], summary: string) => {
    const priceWrites = writes.flatMap<PriceWrite>((write) => {
      const [versionId, kind] = write.rowId.split(":");
      const variant = aligned.get(Number(versionId))?.[write.col];
      if (!variant || (kind !== "sale" && kind !== "cost")) return [];
      return [{ variantKey: variantKey(variant.id), kind, value: write.value }];
    });
    prices.apply(writeCells(drafts, schoolYearId, priceWrites), summary);
  };

  const copyProps = (version: ProductVersion) => {
    const row = aligned.get(version.id) ?? [];
    const raised = (source: number, pct: number, amt: number) =>
      row.map((variant) => {
        const sale = variant
          ? readCell(drafts, source, variantKey(variant.id)).sale
          : null;
        return sale == null ? null : raisePrice(sale, pct, amt);
      });
    return {
      targetYearLabel: yearLabel,
      sources: schoolYears
        .filter((y) => y.id !== schoolYearId && priced(version, drafts, y.id))
        .map((y) => ({ id: y.id, label: y.year })),
      preview: (source: number, pct: number, amt: number) =>
        priceRuns(raised(source, pct, amt)).map((run) => ({
          sizes:
            run.start === run.end
              ? columns[run.start].label
              : `${columns[run.start].label}–${columns[run.end].label}`,
          price: `S/ ${run.price.toFixed(2)}`,
        })),
      onApply: (source: number, pct: number, amt: number) => {
        const writes = version.variants.flatMap<PriceWrite>((variant) => {
          const key = variantKey(variant.id);
          const from = readCell(drafts, source, key);
          return [
            {
              variantKey: key,
              kind: "sale",
              value: from.sale == null ? null : raisePrice(from.sale, pct, amt),
            },
            { variantKey: key, kind: "cost", value: from.cost },
          ];
        });
        const sourceLabel = schoolYears.find((y) => y.id === source)?.year;
        const raise = [pct ? `+${pct} %` : "", amt ? `+S/ ${amt}` : ""]
          .filter(Boolean)
          .join(" y ");
        prices.apply(
          writeCells(drafts, schoolYearId, writes),
          `Precios de ${sourceLabel} copiados${raise ? ` con ${raise}` : ""}.`,
        );
      },
    };
  };

  const sections: GridSectionSpec[] = visible.map((version) => {
    const row = aligned.get(version.id) ?? [];
    const displayLabel = labelOf(version);
    const problems = versionProblems(row, columns, axis, drafts, schoolYearId);
    return {
      id: String(version.id),
      header: (
        <VersionHeader
          displayLabel={displayLabel}
          meta={versionMeta(row, axis, drafts, schoolYearId)}
          notes={version.notes}
          copy={copyProps(version)}
          menu={{
            version,
            displayLabel,
            axis,
            isBook,
            sizes: scaleSizes,
            sizeScaleId: product.sizeScaleId,
            schoolYearId,
            publishers,
            onChanged,
            onDeleted: (deleted) => {
              prices.forget(deleted.variants.map((v) => variantKey(v.id)));
              onChanged();
            },
          }}
        />
      ),
      rows: buildVersionRows({
        version,
        displayLabel,
        aligned: row,
        columns,
        axis,
        drafts,
        stored,
        schoolYearId,
        show,
        onOpenKardex: (id, title) => setKardex({ id, title }),
      }),
      footer:
        problems.length > 0 ? (
          <Stack spacing={0.25} mt={0.5}>
            {problems.map((problem) => (
              <Typography
                key={problem.text}
                variant="caption"
                color={problem.severity === "error" ? "error" : "warning.dark"}
              >
                {problem.text}
              </Typography>
            ))}
          </Stack>
        ) : undefined,
    };
  });

  return (
    <Box
      className={PANE_CLASSES.body}
      display="flex"
      flexDirection="column"
      flex={1}
      minHeight={0}
    >
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        px={2}
        pb={1}
        borderBottom={1}
        borderColor="divider"
        flexWrap="wrap"
      >
        <Typography variant="caption" color="text.secondary">
          Filas
        </Typography>
        {(["cost", "stock"] as const).map((key) => (
          <ToggleButton
            key={key}
            value={key}
            size="small"
            selected={show[key]}
            onChange={() => setShow({ ...show, [key]: !show[key] })}
            sx={{ py: 0.25, px: 1.25, fontSize: 12, textTransform: "none" }}
          >
            {key === "cost" ? "Costo" : "Stock"}
          </ToggleButton>
        ))}
        <Typography
          variant="caption"
          aria-live="polite"
          sx={{ ml: 1, minWidth: 0 }}
          noWrap
        >
          {prices.status}
        </Typography>
        <Box flexGrow={1} />
        <Button
          size="small"
          startIcon={<UndoIcon />}
          disabled={!prices.canUndo}
          onClick={prices.undo}
        >
          Deshacer
        </Button>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAddingVersion(true)}
        >
          Nueva versión
        </Button>
      </Box>

      <Box
        className={PANE_CLASSES.scroll}
        flex={1}
        minHeight={0}
        overflow="auto"
        px={2}
        pb={2}
      >
        {product.versions.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Este producto no tiene versiones, así que no se puede vender. Crea
            una con «Nueva versión».
          </Alert>
        ) : (
          sections.length > 0 && (
            <PriceGrid
              columns={columns}
              sections={sections}
              onWrite={onWrite}
              onUndo={prices.undo}
            />
          )
        )}
        {folded.map((version) => (
          <Button
            key={version.id}
            fullWidth
            variant="outlined"
            color="inherit"
            onClick={() => setExpanded([...expanded, version.id])}
            sx={{
              maxWidth: priceGridMaxWidth(columns.length),
              mt: 1.5,
              justifyContent: "flex-start",
              flexWrap: "wrap",
              columnGap: 1,
              textAlign: "left",
              borderRadius: 1.5,
              borderStyle: "dashed",
              textTransform: "none",
              color: "text.secondary",
            }}
          >
            <Typography
              variant="subtitle2"
              component="span"
              color="text.primary"
            >
              {labelOf(version)}
            </Typography>{" "}
            sin precios en {yearLabel}
            {axis !== "none" &&
              ` · ${version.variants.length} ${unitWord(axis)}${
                version.variants.length === 1 ? "" : "s"
              }`}
            <Box flexGrow={1} />
            <Typography variant="button" color="primary">
              Poner a la venta
            </Typography>
          </Button>
        ))}
      </Box>

      <KardexDialog
        offeringId={kardex?.id ?? null}
        title={kardex?.title ?? ""}
        onClose={() => setKardex(null)}
      />
      {addingVersion && (
        <NewVersionDialog
          productId={product.id}
          axis={axis}
          scaleSizes={scaleSizes}
          publishers={publishers}
          onClose={() => setAddingVersion(false)}
          onCreated={onChanged}
        />
      )}
    </Box>
  );
};

export default ProductPrices;
