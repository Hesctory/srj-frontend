import { useMemo, useState } from "react";
import { useDataProvider, useGetList, useNotify } from "react-admin";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import type { ProductVariant, Size } from "@/types/product";
import type { AppDataProvider } from "@/app/data-provider";
import { toCatalogError } from "@/features/products/utils/catalog-error";
import type { ProductAxis } from "@/features/products/resources/products/product-constants";

interface Grade {
  id: number;
  grade: string;
}

interface VariantAdderDialogProps {
  open: boolean;
  versionId: number;
  versionLabel: string;
  axis: ProductAxis;
  sizes: Size[];
  /**
   * The line's size scale. A variant's size must belong to it or the DB trigger
   * rejects the write, so with no scale set there is no safe ladder to offer.
   */
  sizeScaleId: number | null;
  existingVariants: ProductVariant[];
  onClose: () => void;
  onAdded: () => void;
}

/**
 * Adds a run of variants to an existing version.
 *
 * Bulk by default because that is how the school thinks: a version gets a whole
 * size ladder or a whole level's grades, never one size at a time. The picker
 * is a row of toggles rather than a multi-select so the ladder stays visible as
 * a ladder — in `sortOrder`, which is also the order the prices step up in.
 *
 * Sizes the version already has are shown but disabled, so the ladder reads
 * complete and it is obvious which rungs are missing.
 */
const VariantAdderDialog = ({
  open,
  versionId,
  versionLabel,
  axis,
  sizes,
  sizeScaleId,
  existingVariants,
  onClose,
  onAdded,
}: VariantAdderDialogProps) => {
  const notify = useNotify();
  const dataProvider = useDataProvider<AppDataProvider>();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data: grades = [] } = useGetList<Grade>("grades", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "id", order: "ASC" },
  });

  const takenSizeIds = useMemo(
    () =>
      new Set(
        existingVariants
          .map((variant) => variant.sizeId)
          .filter((id): id is number => id != null),
      ),
    [existingVariants],
  );
  const takenGradeIds = useMemo(
    () =>
      new Set(
        existingVariants
          .map((variant) => variant.gradeId)
          .filter((id): id is number => id != null),
      ),
    [existingVariants],
  );

  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const options: { id: number; label: string; taken: boolean }[] =
    axis === "size"
      ? sizes.map((size) => ({
          id: size.id,
          label: size.code ?? size.name ?? String(size.id),
          taken: takenSizeIds.has(size.id),
        }))
      : axis === "grade"
        ? grades.map((grade) => ({
            id: grade.id,
            label: grade.grade,
            taken: takenGradeIds.has(grade.id),
          }))
        : [];

  const hasAxislessVariant = existingVariants.some(
    (variant) => variant.sizeId == null && variant.gradeId == null,
  );

  const { mutate: submit, isPending: isSaving } = useMutation({
    mutationFn: () =>
      dataProvider.addProductVariants(versionId, {
        sizeIds: axis === "size" ? Array.from(selected) : null,
        gradeIds: axis === "grade" ? Array.from(selected) : null,
        noAxis: axis === "none",
      }),
    onSuccess: (result) => {
      notify(
        `${result.affected} ${result.affected === 1 ? "variante agregada" : "variantes agregadas"}.`,
        { type: "success" },
      );
      setSelected(new Set());
      onAdded();
      onClose();
    },
    onError: (cause) =>
      notify(toCatalogError(cause).message, { type: "error" }),
  });

  const canSubmit =
    axis === "size" && sizeScaleId == null
      ? false
      : axis === "none"
        ? !hasAxislessVariant
        : selected.size > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Agregar variantes — {versionLabel}
        <Typography variant="body2" color="text.secondary">
          {axis === "size"
            ? "Las tallas que esta versión pondrá a la venta."
            : axis === "grade"
              ? "Los grados para los que existe esta edición."
              : "Este producto no varía por talla ni por grado."}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {axis === "size" && sizeScaleId == null ? (
          <Alert severity="warning">
            Este producto no tiene escala de tallas. Asígnale una arriba, en los
            datos del producto, antes de agregar tallas: una talla que no
            pertenezca a la escala del producto es rechazada al guardar.
          </Alert>
        ) : axis === "none" ? (
          hasAxislessVariant ? (
            <Alert severity="info">
              Esta versión ya tiene su única variante.
            </Alert>
          ) : (
            <Alert severity="info">
              Se creará una sola variante, sin talla ni grado.
            </Alert>
          )
        ) : options.length === 0 ? (
          <Alert severity="warning">
            {axis === "size"
              ? "No hay tallas disponibles. Revisa la escala de tallas del producto."
              : "No hay grados disponibles."}
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            <Box display="flex" gap={1} flexWrap="wrap">
              {options.map((option) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  disabled={option.taken}
                  color={selected.has(option.id) ? "primary" : "default"}
                  variant={
                    option.taken
                      ? "outlined"
                      : selected.has(option.id)
                        ? "filled"
                        : "outlined"
                  }
                  onClick={option.taken ? undefined : () => toggle(option.id)}
                  sx={{ minWidth: 56 }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Las opciones atenuadas ya existen en esta versión.
            </Typography>
            {axis === "size" && (
              <Button
                size="small"
                onClick={() =>
                  setSelected(
                    new Set(options.filter((o) => !o.taken).map((o) => o.id)),
                  )
                }
                sx={{ alignSelf: "flex-start" }}
              >
                Seleccionar todas las que faltan
              </Button>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => submit()}
          disabled={isSaving || !canSubmit}
        >
          {isSaving ? "Agregando…" : "Agregar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariantAdderDialog;
