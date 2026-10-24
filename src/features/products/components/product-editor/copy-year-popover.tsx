import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export interface CopyYearSource {
  id: number;
  label: string;
}

interface CopyYearPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  targetYearLabel: string;
  sources: CopyYearSource[];
  /** Sale runs the copy would produce, for the preview. */
  preview: (
    sourceYearId: number,
    percent: number,
    amount: number,
  ) => { sizes: string; price: string }[];
  onApply: (sourceYearId: number, percent: number, amount: number) => void;
}

const toNumber = (text: string) => {
  const value = Number(text.replace(",", ".").trim() || "0");
  return Number.isFinite(value) ? value : NaN;
};

/**
 * Starts a year from another year's prices, raised by a percentage and/or a
 * flat amount. The copy lands in the grid as unsaved edits, so it can be
 * reviewed, adjusted and undone before anything is written.
 */
const CopyYearPopover = ({
  anchorEl,
  onClose,
  targetYearLabel,
  sources,
  preview,
  onApply,
}: CopyYearPopoverProps) => {
  const [sourceId, setSourceId] = useState<number | "">(sources[0]?.id ?? "");
  const [percent, setPercent] = useState("");
  const [amount, setAmount] = useState("");

  const pct = toNumber(percent);
  const amt = toNumber(amount);
  const invalid = Number.isNaN(pct) || Number.isNaN(amt) || pct <= -100;
  const runs = sourceId === "" || invalid ? [] : preview(sourceId, pct, amt);

  return (
    <Popover
      open={anchorEl != null}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { width: 420, maxWidth: "90vw", p: 2 } } }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Copiar precios a {targetYearLabel}
      </Typography>
      {sources.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Esta versión no tiene precios en otros años.
        </Typography>
      ) : (
        <Stack spacing={1.5} mt={1}>
          <TextField
            select
            size="small"
            label="Desde"
            value={sourceId}
            onChange={(event) => setSourceId(Number(event.target.value))}
          >
            {sources.map((source) => (
              <MenuItem key={source.id} value={source.id}>
                {source.label}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Subir"
              value={percent}
              onChange={(event) => setPercent(event.target.value)}
              error={Number.isNaN(pct) || pct <= -100}
              inputMode="decimal"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              size="small"
              label="y/o sumar"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              error={Number.isNaN(amt)}
              inputMode="decimal"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">S/</InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
          {runs.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Venta quedaría
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                {runs.map((run) => (
                  <Chip
                    key={run.sizes}
                    size="small"
                    label={`${run.sizes}: ${run.price}`}
                  />
                ))}
              </Box>
            </Box>
          )}
          <Typography variant="caption" color="text.secondary">
            Reemplaza venta y costo de esta versión en {targetYearLabel}. El
            aumento se aplica solo a la venta. Se puede deshacer.
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              variant="contained"
              disabled={sourceId === "" || invalid}
              onClick={() => sourceId !== "" && onApply(sourceId, pct, amt)}
            >
              Copiar a {targetYearLabel}
            </Button>
          </Box>
        </Stack>
      )}
    </Popover>
  );
};

export default CopyYearPopover;
