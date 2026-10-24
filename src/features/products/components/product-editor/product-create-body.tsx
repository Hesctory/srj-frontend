import { useEffect, useState, type ReactNode } from "react";
import {
  ReferenceInput,
  SelectInput,
  TextInput,
  required,
  useInput,
} from "react-admin";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import { wideField } from "@/shared/components/form-grid";
import { axisForProductType } from "@/features/products/resources/products/product-constants";
import {
  validateColumnKeys,
  validatePrices,
} from "@/features/products/resources/products/product-create-transform";
import useGridColumns from "@/features/products/hooks/use-grid-columns";
import useCatalogYear from "@/features/products/hooks/use-catalog-year";
import {
  priceProblems,
  type PriceCell,
} from "@/features/products/utils/price-grid";
import PriceGrid, {
  GRID_GUTTERS,
  priceGridMaxWidth,
} from "@/features/products/components/price-grid/price-grid";
import type {
  GridRowSpec,
  GridWrite,
} from "@/features/products/components/price-grid/price-grid-types";
import { useCatalogWorkspace } from "@/features/products/components/catalog-workspace/workspace-context";
import ProductHeader from "./product-header";
import UnsavedChangesGuard from "./unsaved-changes-guard";
import { unitWord } from "./version-rows";
import { PANE_CLASSES } from "@/features/products/components/catalog-workspace/pane-sx";

type Prices = Record<string, PriceCell>;

const ROWS = [
  { id: "sale", label: "Venta S/" },
  { id: "cost", label: "Costo S/" },
] as const;

/**
 * Creating a product is one decision — what it is, which cut, in which sizes,
 * at what price — so it is one screen: the line's fields, the first
 * version's, and a grid whose header checkboxes choose the sizes (or grades)
 * and whose cells take their prices.
 */
const ProductCreateBody = ({ toolbar }: { toolbar: ReactNode }) => {
  const { setValue, getValues } = useFormContext();
  const { schoolYearId } = useCatalogYear();
  // Registered so their checks run on submit; the grid edits their values.
  useInput({ source: "columnKeys", validate: validateColumnKeys });
  useInput({ source: "prices", validate: validatePrices });
  const { errors, isDirty, isSubmitting, isSubmitSuccessful } = useFormState();
  const leaving = isDirty && !isSubmitting && !isSubmitSuccessful;
  const { setDirty, setEditorWidth } = useCatalogWorkspace();
  useEffect(() => setDirty(leaving), [leaving, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);
  const [typeId, scaleId, keys = [], prices = {}] = useWatch({
    name: ["productTypeId", "sizeScaleId", "columnKeys", "prices"],
  }) as [unknown, unknown, string[] | undefined, Prices | undefined];
  const axis = axisForProductType(Number(typeId));
  const hasType = Number(typeId) > 0;
  const { columns } = useGridColumns({
    axis,
    sizeScaleId: scaleId ? Number(scaleId) : null,
  });
  useEffect(() => {
    setEditorWidth(priceGridMaxWidth(columns.length) + GRID_GUTTERS);
    return () => setEditorWidth(null);
  }, [columns.length, setEditorWidth]);
  const [history, setHistory] = useState<Prices[]>([]);
  const [status, setStatus] = useState("");

  // The years can resolve after the form mounts; a remount to re-read the
  // default would wipe whatever was typed meanwhile.
  useEffect(() => {
    if (schoolYearId != null && !getValues("schoolYearId")) {
      setValue("schoolYearId", schoolYearId);
    }
  }, [schoolYearId, getValues, setValue]);

  // A garment starts with its whole ladder chosen, a book with no grades.
  const columnSignature = columns.map((c) => c.key).join();
  useEffect(() => {
    setValue(
      "columnKeys",
      axis === "size" ? columns.map((column) => column.key) : [],
    );
  }, [axis, columnSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = columns.map(
    (column) => axis === "none" || keys.includes(column.key),
  );
  const setPrices = (next: Prices, summary: string) => {
    setHistory([...history, prices].slice(-50));
    setValue("prices", next, { shouldDirty: true });
    setStatus(summary);
  };
  const undo = () => {
    if (history.length === 0) return;
    setValue("prices", history[history.length - 1], { shouldDirty: true });
    setHistory(history.slice(0, -1));
    setStatus("Cambio deshecho.");
  };

  const onWrite = (writes: GridWrite[], summary: string) => {
    const next = { ...prices };
    for (const write of writes) {
      const key = columns[write.col].key;
      const kind = write.rowId as "sale" | "cost";
      const cell = { ...(next[key] ?? { sale: null, cost: null }) };
      cell[kind] = write.value;
      if (cell.sale == null && cell.cost == null) delete next[key];
      else next[key] = cell;
    }
    setPrices(next, summary);
  };

  const rows: GridRowSpec[] = ROWS.map((row) => ({
    id: row.id,
    label: row.label,
    kind: "price",
    cells: columns.map((column, col) =>
      selected[col]
        ? {
            value: prices[column.key]?.[row.id] ?? null,
            ariaLabel: `${row.label} ${unitWord(axis)} ${column.label}`,
          }
        : null,
    ),
  }));
  const values = (kind: "sale" | "cost") =>
    columns.map((c, col) =>
      selected[col] ? (prices[c.key]?.[kind] ?? null) : null,
    );
  const warnings = priceProblems(values("sale"), values("cost"));
  const formErrors = [errors.columnKeys, errors.prices]
    .map((error) => error?.message)
    .filter((message): message is string => typeof message === "string");

  return (
    <>
      <ProductHeader editing title="Nuevo producto" onToggleEditing={() => {}}>
        <TextInput source="versionLabel" label="Versión" helperText={false} />
        {axis === "grade" && (
          <ReferenceInput source="publisherId" reference="publishers">
            <SelectInput
              optionText="name"
              label="Editorial"
              helperText={false}
            />
          </ReferenceInput>
        )}
        <TextInput
          source="versionNotes"
          label="Notas de la versión"
          helperText={false}
          sx={wideField}
        />
      </ProductHeader>
      <Box
        className={PANE_CLASSES.scroll}
        flex={1}
        minHeight={0}
        overflow="auto"
        px={2}
        pb={2}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
          pt={1.5}
        >
          <Typography variant="subtitle2" component="h3">
            {!hasType
              ? "Precios para"
              : axis === "grade"
                ? "Grados y precios para"
                : axis === "size"
                  ? "Tallas y precios para"
                  : "Precio para"}
          </Typography>
          <ReferenceInput source="schoolYearId" reference="school-years">
            <SelectInput
              optionText="year"
              label="Año escolar"
              validate={required()}
              helperText={false}
              size="small"
              fullWidth={false}
              sx={{ width: 120, m: 0 }}
            />
          </ReferenceInput>
          <Typography variant="caption" aria-live="polite" noWrap>
            {status}
          </Typography>
          <Box flexGrow={1} />
          <Button
            size="small"
            startIcon={<UndoIcon />}
            disabled={history.length === 0}
            onClick={undo}
          >
            Deshacer
          </Button>
        </Box>
        {!hasType ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            Elige el tipo de producto para ver sus tallas o grados.
          </Alert>
        ) : axis === "size" && !scaleId ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            Elige la escala de tallas.
          </Alert>
        ) : (
          <PriceGrid
            columns={columns}
            sections={[{ id: "new", rows }]}
            onWrite={onWrite}
            onUndo={undo}
            columnToggles={
              axis === "none"
                ? undefined
                : {
                    selected,
                    onToggle: (cols) => {
                      const on = cols.every((col) => selected[col]);
                      const toggled = new Set(
                        cols.map((col) => columns[col].key),
                      );
                      setValue(
                        "columnKeys",
                        on
                          ? keys.filter((key) => !toggled.has(key))
                          : [...new Set([...keys, ...toggled])],
                        { shouldDirty: true },
                      );
                    },
                  }
            }
          />
        )}
        <Stack spacing={0.25} mt={0.75}>
          {formErrors.map((message) => (
            <Typography key={message} variant="caption" color="error">
              {message}
            </Typography>
          ))}
          {warnings.costAboveSale.length > 0 && (
            <Typography variant="caption" color="warning.dark">
              El costo supera la venta en{" "}
              {warnings.costAboveSale
                .map((col) => columns[col].label)
                .join(", ")}
              .
            </Typography>
          )}
        </Stack>
      </Box>
      <Box className={PANE_CLASSES.footer} borderTop={1} borderColor="divider">
        {toolbar}
      </Box>
      <UnsavedChangesGuard when={leaving} />
    </>
  );
};

export default ProductCreateBody;
