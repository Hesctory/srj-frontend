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
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Identifier, useDataProvider } from "react-admin";
import type { AppDataProvider } from "@/app/data-provider";
import { MONTH_NAMES } from "@/features/students/hooks/use-enrollment-preview";
import { serverErrorMessage } from "@/features/students/utils/server-errors";
import type {
  EnrollmentChangeLine,
  EnrollmentChangeOutcome,
  UpdateEnrollment,
} from "@/types/enrollment";
import { formatMoney } from "@/utils/money";
import {
  ExcessSettlementFields,
  NO_SETTLEMENT,
  settlementBody,
  settlementReady,
} from "./excess-settlement-fields";

const OUTCOME_LABELS: Record<EnrollmentChangeOutcome, string> = {
  REPRICED: "Cambia",
  UNCHANGED: "Sin cambio",
  IN_FORCE: "En curso, se mantiene",
};

/** What the line already holds, and what of it goes back. */
const paidNote = ({ paid, excess, creditNote }: EnrollmentChangeLine) => {
  if (paid <= 0) return null;
  const held = `Pagado ${formatMoney(paid)}`;
  if (excess <= 0) return held;
  const back = `se devuelven ${formatMoney(excess)}`;
  return `${held}: ${back}${creditNote ? " con nota de crédito" : ""}`;
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
        {[
          repriced && line.newDiscount > 0
            ? `${formatMoney(line.newGross)} − ${formatMoney(line.newDiscount)} de descuento`
            : null,
          paidNote(line),
        ]
          .filter(Boolean)
          .join(" · ")}
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
  /** A refused save's messages on the settlement, kept open to fix them. */
  errors?: Record<string, string>;
  /** What the `PUT` adds: how the money given back is settled, if any is. */
  onConfirm: (extra: Partial<UpdateEnrollment>) => void;
  onCancel: () => void;
}

/**
 * The stop before a change of concept, level or shift is saved: the API says
 * from which month the new price applies (the first not yet in force) and
 * what that does to every pensión. Money a paid month holds beyond its new
 * price goes back, refunded or credited, as staff choose here.
 */
const EnrollmentRepriceDialog = ({
  enrollmentId,
  levelId,
  shiftId,
  schoolFeeConceptId,
  saving,
  errors,
  onConfirm,
  onCancel,
}: EnrollmentRepriceDialogProps) => {
  const dataProvider = useDataProvider<AppDataProvider>();
  const [settlement, setSettlement] = useState(NO_SETTLEMENT);

  const { data, error, isPending } = useQuery({
    queryKey: [
      "enrollments",
      enrollmentId,
      "change-preview",
      { levelId, shiftId, schoolFeeConceptId },
    ],
    queryFn: () =>
      dataProvider.previewEnrollmentChange(enrollmentId, {
        levelId,
        shiftId,
        schoolFeeConceptId,
      }),
    // A refused preview (404 no fees, 422) answers the same on a retry.
    retry: false,
    // Amounts from an earlier visit must not be confirmable while new ones load.
    gcTime: 0,
  });

  const lines = data?.lines ?? [];
  const totalExcess = data?.totalExcess ?? 0;
  const repricedCount = lines.filter((l) => l.outcome === "REPRICED").length;
  const ready = !!data && !error && settlementReady(totalExcess, settlement);

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
          ) : isPending ? (
            <Skeleton variant="rounded" height={120} />
          ) : lines.length === 0 ? (
            <Alert severity="info">
              Esta matrícula no tiene pensiones vigentes: el cambio se guarda
              sin mover ningún monto.
            </Alert>
          ) : (
            <>
              <Typography variant="body2">
                {data.fromMonth === null
                  ? "Todos los meses ya empezaron: sus pensiones mantienen su precio."
                  : `El nuevo precio rige desde ${MONTH_NAMES[data.fromMonth - 1]}, el primer mes que aún no empieza. ${
                      repricedCount === 0
                        ? "Ninguna pensión cambia de precio."
                        : repricedCount === 1
                          ? "1 pensión cambia de precio."
                          : `${repricedCount} pensiones cambian de precio.`
                    }`}
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
              {totalExcess > 0 && (
                <ExcessSettlementFields
                  totalExcess={totalExcess}
                  value={settlement}
                  onChange={setSettlement}
                  errors={errors}
                  disabled={saving}
                />
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
          onClick={() => onConfirm(settlementBody(totalExcess, settlement))}
          disabled={!ready || saving}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnrollmentRepriceDialog;
