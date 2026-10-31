import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Identifier, useDataProvider } from "react-admin";
import type { AppDataProvider } from "@/app/data-provider";
import {
  FIRST_BILLABLE_MONTH,
  MONTH_NAMES,
} from "@/features/students/hooks/use-enrollment-preview";
import { serverErrorMessage } from "@/features/students/utils/server-errors";
import type {
  EnrollmentChangeLine,
  EnrollmentChangeOutcome,
} from "@/types/enrollment";
import { formatMoney } from "@/utils/money";

const LAST_MONTH = 12;
const MONTHS = Array.from(
  { length: LAST_MONTH - FIRST_BILLABLE_MONTH + 1 },
  (_, index) => FIRST_BILLABLE_MONTH + index,
);

const OUTCOME_LABELS: Record<EnrollmentChangeOutcome, string> = {
  REPRICED: "Cambia",
  UNCHANGED: "Sin cambio",
  PAID: "Con pago, se mantiene",
  BEFORE_FROM_MONTH: "Antes del mes elegido",
};

const ChangeLine = ({ line }: { line: EnrollmentChangeLine }) => {
  const repriced = line.outcome === "REPRICED";
  return (
    <Box
      component="li"
      sx={{
        display: "grid",
        // On a phone the old and new amounts leave no room beside the month.
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "minmax(0, 1fr) auto",
        },
        columnGap: 2,
        alignItems: "center",
        py: 0.75,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="body2">{line.description}</Typography>
      <Typography
        variant="body2"
        fontWeight={repriced ? 600 : 400}
        sx={{
          fontVariantNumeric: "tabular-nums",
          textAlign: { xs: "left", sm: "right" },
        }}
      >
        {repriced
          ? `${formatMoney(line.currentNet)} → ${formatMoney(line.newNet)}`
          : formatMoney(line.currentNet)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {repriced && line.newDiscount > 0
          ? `${formatMoney(line.newGross)} − ${formatMoney(line.newDiscount)} de descuento`
          : ""}
      </Typography>
      {line.outcome && (
        <Chip
          size="small"
          variant={repriced ? "filled" : "outlined"}
          color={repriced ? "primary" : "default"}
          label={OUTCOME_LABELS[line.outcome]}
          sx={{ justifySelf: { xs: "start", sm: "end" }, mt: 0.5 }}
        />
      )}
    </Box>
  );
};

interface EnrollmentRepriceDialogProps {
  enrollmentId: Identifier;
  /** What the form proposes; the API prices the pensiones against it. */
  levelId: number;
  shiftId: number;
  schoolFeeConceptId: number;
  /** The enrollment is being written: every button waits. */
  saving: boolean;
  /** Null when no pensión is left to price, so no month applies. */
  onConfirm: (repriceFromMonth: number | null) => void;
  onCancel: () => void;
}

/**
 * The stop before a change of concept, level or shift is saved: which month
 * the new price starts from, and what that does to every pensión.
 */
const EnrollmentRepriceDialog = ({
  enrollmentId,
  levelId,
  shiftId,
  schoolFeeConceptId,
  saving,
  onConfirm,
  onCancel,
}: EnrollmentRepriceDialogProps) => {
  const dataProvider = useDataProvider<AppDataProvider>();
  const [month, setMonth] = useState<number | null>(null);

  // Every live pensión comes back whatever the month, so before one is chosen
  // the earliest one still says whether there is anything to price.
  const repriceFromMonth = month ?? FIRST_BILLABLE_MONTH;
  const { data, error, isPending } = useQuery({
    queryKey: [
      "enrollments",
      enrollmentId,
      "change-preview",
      { levelId, shiftId, schoolFeeConceptId, repriceFromMonth },
    ],
    queryFn: () =>
      dataProvider.previewEnrollmentChange(enrollmentId, {
        levelId,
        shiftId,
        schoolFeeConceptId,
        repriceFromMonth,
      }),
    // A refused preview (404 no fees, 422) answers the same on a retry.
    retry: false,
    // Amounts from an earlier visit must not be confirmable while new ones load.
    gcTime: 0,
  });

  const lines = data?.lines ?? [];
  const nothingToPrice = !!data && lines.length === 0;
  const repricedCount = lines.filter((l) => l.outcome === "REPRICED").length;
  const ready = !isPending && !error && (nothingToPrice || month !== null);

  return (
    <Dialog
      open
      onClose={saving ? undefined : onCancel}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Cambiar el precio de la matrícula</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error ? (
            <Alert severity="error">
              {serverErrorMessage(
                error,
                "No se pudo calcular el cambio. Inténtalo de nuevo.",
              )}
            </Alert>
          ) : nothingToPrice ? (
            <Alert severity="info">
              Esta matrícula no tiene pensiones vigentes: el cambio se guarda
              sin mover ningún monto.
            </Alert>
          ) : (
            <>
              <TextField
                select
                required
                fullWidth
                label="Nuevo precio desde"
                value={month ?? ""}
                onChange={(event) => setMonth(Number(event.target.value))}
                disabled={saving}
              >
                {MONTHS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {MONTH_NAMES[option - 1]}
                  </MenuItem>
                ))}
              </TextField>
              {isPending ? (
                <Skeleton variant="rounded" height={120} />
              ) : month === null ? (
                <Typography variant="body2" color="text.secondary">
                  Elige el mes para ver el monto de cada pensión.
                </Typography>
              ) : (
                <>
                  <Typography variant="body2">
                    {repricedCount === 0
                      ? "Ninguna pensión cambia de precio."
                      : repricedCount === 1
                        ? "1 pensión cambia de precio."
                        : `${repricedCount} pensiones cambian de precio.`}
                  </Typography>
                  <Box
                    component="ul"
                    aria-label="Pensiones de la matrícula"
                    sx={{ listStyle: "none", m: 0, p: 0 }}
                  >
                    {lines.map((line) => (
                      <ChangeLine key={line.month} line={line} />
                    ))}
                  </Box>
                </>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={saving}>
          Volver
        </Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(nothingToPrice ? null : month)}
          disabled={!ready || saving}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnrollmentRepriceDialog;
