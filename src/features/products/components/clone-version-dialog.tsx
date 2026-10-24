import { useState } from "react";
import { useDataProvider, useGetList, useNotify } from "react-admin";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import useCurrentSchoolYear from "@/shared/hooks/use-current-school-year";
import type { CloneProductVersion } from "@/types/product";
import type { AppDataProvider } from "@/app/data-provider";
import { toCatalogError } from "@/features/products/utils/catalog-error";

interface CloneVersionDialogProps {
  open: boolean;
  versionId: number;
  versionLabel: string;
  schoolYearId: number;
  isBook: boolean;
  onClose: () => void;
  onCloned: () => void;
}

/**
 * The redesign changeover: a new version carrying the old one's size ladder.
 *
 * A new cut of the buzo does not replace the old one overnight — the old one
 * keeps selling at its own price until its stock runs out, and the school has
 * to know which of the two a parent bought. So this *clones* rather than edits,
 * and both versions then sell side by side.
 *
 * Pricing the clone is optional and offered two ways because both are real: a
 * redesign that costs the same across the board takes one figure, while one
 * that keeps the old ladder's shape copies the prices instead.
 */
const CloneVersionDialog = ({
  open,
  versionId,
  versionLabel,
  schoolYearId,
  isBook,
  onClose,
  onCloned,
}: CloneVersionDialogProps) => {
  const notify = useNotify();
  const dataProvider = useDataProvider<AppDataProvider>();
  const { schoolYears } = useCurrentSchoolYear();
  const { data: publishers = [] } = useGetList<{ id: number; name: string }>(
    "publishers",
    {
      pagination: { page: 1, perPage: 200 },
      sort: { field: "name", order: "ASC" },
    },
  );

  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [publisherId, setPublisherId] = useState<number | "">("");
  const [priceMode, setPriceMode] = useState<"none" | "copy" | "flat">("copy");
  const [flatPrice, setFlatPrice] = useState("");
  const [targetYear, setTargetYear] = useState<number>(schoolYearId);

  const { mutate: clone, isPending: isSaving } = useMutation({
    mutationFn: (body: CloneProductVersion) =>
      dataProvider.cloneProductVersion(versionId, body),
    onSuccess: () => {
      notify("Versión creada. Ambas versiones se venden a la vez.", {
        type: "success",
      });
      setLabel("");
      setNotes("");
      onCloned();
      onClose();
    },
    onError: (cause) =>
      notify(toCatalogError(cause).message, { type: "error" }),
  });

  const submit = () => {
    if (label.trim() === "") {
      notify("Ponle una etiqueta a la versión nueva.", { type: "warning" });
      return;
    }
    const parsedFlat = Number(flatPrice);
    if (
      priceMode === "flat" &&
      !(Number.isFinite(parsedFlat) && parsedFlat > 0)
    ) {
      notify("Indica el precio de venta de la versión nueva.", {
        type: "warning",
      });
      return;
    }

    clone({
      label: label.trim(),
      publisherId: isBook && publisherId !== "" ? Number(publisherId) : null,
      notes: notes.trim() || null,
      schoolYearId: priceMode === "none" ? null : targetYear,
      salePrice: priceMode === "flat" ? parsedFlat : null,
      copyPrices: priceMode === "copy",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Nueva versión a partir de {versionLabel}
        <Typography variant="body2" color="text.secondary">
          Copia las variantes de esta versión en una nueva. La anterior sigue a
          la venta hasta agotar stock.
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} mt={1}>
          <TextField
            label="Etiqueta de la versión nueva"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="p. ej. 2026"
            required
            fullWidth
          />

          {/* Plain MUI, not RA inputs: this dialog has no react-hook-form
              context around it, and RA's inputs require one. */}
          {isBook && (
            <TextField
              select
              label="Editorial"
              value={publisherId}
              onChange={(event) =>
                setPublisherId(
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
              helperText="Un cambio de editorial es una edición distinta."
              fullWidth
            >
              <MenuItem value="">
                <em>Sin editorial</em>
              </MenuItem>
              {publishers.map((publisher) => (
                <MenuItem key={publisher.id} value={publisher.id}>
                  {publisher.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            label="Notas"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Opcional"
            fullWidth
          />

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Precios de la versión nueva
            </Typography>
            <RadioGroup
              value={priceMode}
              onChange={(event) =>
                setPriceMode(event.target.value as typeof priceMode)
              }
            >
              <FormControlLabel
                value="copy"
                control={<Radio />}
                label="Copiar la escala de precios de la versión anterior"
              />
              <FormControlLabel
                value="flat"
                control={<Radio />}
                label="Un solo precio para todas las tallas"
              />
              <FormControlLabel
                value="none"
                control={<Radio />}
                label="Sin precio por ahora"
              />
            </RadioGroup>
          </Box>

          {priceMode !== "none" && (
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                select
                label="Año escolar"
                value={targetYear}
                onChange={(event) => setTargetYear(Number(event.target.value))}
                sx={{ flex: "1 1 160px" }}
              >
                {schoolYears.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.year}
                  </MenuItem>
                ))}
              </TextField>
              {priceMode === "flat" && (
                <TextField
                  label="Precio de venta"
                  type="number"
                  value={flatPrice}
                  onChange={(event) => setFlatPrice(event.target.value)}
                  inputProps={{ min: 0, step: "0.01", inputMode: "decimal" }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">S/</InputAdornment>
                    ),
                  }}
                  sx={{ flex: "1 1 160px" }}
                />
              )}
            </Box>
          )}

          {priceMode === "none" && (
            <Alert severity="info">
              Sin precio para un año, la versión nueva no estará a la venta
              hasta que se lo pongas.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={submit} disabled={isSaving}>
          {isSaving ? "Creando…" : "Crear versión"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CloneVersionDialog;
