import { useEffect, useState } from "react";
import { Siblings } from "./siblings-to-review";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { HttpError, Identifier, useDataProvider } from "react-admin";
import type { AppDataProvider } from "@/app/data-provider";
import {
  FIRST_BILLABLE_MONTH,
  MONTH_NAMES,
  useDebounced,
} from "@/features/students/hooks/use-enrollment-preview";
import {
  fieldErrors,
  serverErrorMessage,
} from "@/features/students/utils/server-errors";
import type { UpdateEnrollment } from "@/types/enrollment";
import { formatDate } from "@/utils/date";
import { formatMoney } from "@/utils/money";
import {
  ExcessSettlementFields,
  NO_SETTLEMENT,
  SETTLEMENT_FIELDS,
  settlementBody,
  settlementReady,
} from "./excess-settlement-fields";

interface Line {
  month: number;
  description: string | null;
  amount: number;
  note?: string;
}

const Lines = ({ title, lines }: { title: string; lines: Line[] }) => (
  <Box component="section" aria-label={title}>
    <Typography variant="subtitle2">{title}</Typography>
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {lines.map((line) => (
        <Box
          component="li"
          key={line.month}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            py: 0.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2">{line.description}</Typography>
            {line.note && (
              <Typography variant="caption" color="text.secondary">
                {line.note}
              </Typography>
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
          >
            {formatMoney(line.amount)}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

interface EnrollmentWithdrawDialogProps {
  enrollmentId: Identifier;
  /** The enrollment's school year, to read the date against. */
  year: number;
  /**
   * Writes the withdrawal with what the `PUT` adds (the date, and how the
   * money given back is settled); a refusal is thrown back to be shown here.
   */
  onConfirm: (extra: Partial<UpdateEnrollment>) => Promise<void>;
  onCancel: () => void;
  onDone: () => void;
}

/**
 * Withdrawing a student: the date, what it does to the pensiones, and the
 * siblings whose discount may no longer apply. Those are listed, not changed.
 * Paid pensiones after the date go back to the family, refunded or credited.
 */
const EnrollmentWithdrawDialog = ({
  enrollmentId,
  year,
  onConfirm,
  onCancel,
  onDone,
}: EnrollmentWithdrawDialogProps) => {
  const dataProvider = useDataProvider<AppDataProvider>();
  // Null until staff type one: the API proposes today, and the dates it takes.
  const [date, setDate] = useState<string | null>(null);
  const [settlement, setSettlement] = useState(NO_SETTLEMENT);
  const [bounds, setBounds] = useState<{ min: string; max: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [refusal, setRefusal] = useState<unknown>(null);

  // A date input reports a valid date at every digit of the year.
  const settled = useDebounced(date, date ?? "(today)");
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["enrollments", enrollmentId, "withdrawal-preview", settled],
    queryFn: () =>
      dataProvider.previewEnrollmentWithdrawal(enrollmentId, settled),
    enabled: settled !== "",
    retry: false,
    // Pensiones from an earlier visit must not be confirmable while new ones load.
    gcTime: 0,
  });

  // The window stays on the field while another date is priced.
  useEffect(() => {
    if (data) setBounds({ min: data.minDate, max: data.maxDate });
  }, [data]);

  const current = settled === date && date !== "";
  const preview = current ? data : undefined;
  const previewError = current ? error : null;
  const failure = refusal ?? previewError;
  const errors = fieldErrors(failure);
  const dateError = errors?.withdrawalDate;
  const onSettlement = SETTLEMENT_FIELDS.some((field) => errors?.[field]);
  // The API's own no stays no; anything else (network, 5xx) can be tried again.
  const refusedForGood =
    refusal instanceof HttpError && [409, 422].includes(refusal.status);
  const totalExcess = preview?.totalExcess ?? 0;

  const confirm = async () => {
    if (!preview) return;
    setSaving(true);
    setRefusal(null);
    try {
      await onConfirm({
        withdrawalDate: preview.withdrawalDate,
        ...settlementBody(totalExcess, settlement),
      });
      if (preview.siblings.length) setWithdrawn(true);
      else onDone();
    } catch (cause) {
      setRefusal(cause);
      // A payment may have landed since the preview: show what holds now.
      void refetch();
    } finally {
      setSaving(false);
    }
  };

  if (withdrawn && preview) {
    return (
      <Dialog open onClose={onDone} fullWidth maxWidth="sm">
        <DialogTitle>Estudiante retirado</DialogTitle>
        <DialogContent>
          <Siblings siblings={preview.siblings} linked />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onDone}>
            Listo
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const shown = date ?? data?.withdrawalDate ?? "";
  const [dateYear, dateMonth] = shown.split("-").map(Number);
  const keptUntil =
    dateYear === year && dateMonth >= FIRST_BILLABLE_MONTH
      ? MONTH_NAMES[dateMonth - 1]
      : null;

  return (
    <Dialog
      open
      onClose={saving ? undefined : onCancel}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Retirar estudiante</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            type="date"
            required
            fullWidth
            label="Fecha de retiro"
            value={shown}
            onChange={(event) => {
              setDate(event.target.value);
              setRefusal(null);
            }}
            disabled={saving}
            error={!!dateError}
            helperText={
              dateError ??
              (bounds
                ? `Entre el ${formatDate(bounds.min)} y el ${formatDate(bounds.max)}.`
                : undefined)
            }
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: bounds ? { min: bounds.min, max: bounds.max } : {},
            }}
          />
          {failure && !dateError && !(onSettlement && totalExcess > 0) ? (
            <Alert severity="error">
              {serverErrorMessage(
                failure,
                refusal
                  ? "No se pudo registrar el retiro. Inténtalo de nuevo."
                  : "No se pudo calcular el retiro. Inténtalo de nuevo.",
              )}
            </Alert>
          ) : null}
          {date === "" ? (
            <Typography variant="body2" color="text.secondary">
              Indica la fecha para ver qué pensiones se anulan.
            </Typography>
          ) : !previewError && (!current || isPending) ? (
            <Skeleton variant="rounded" height={120} />
          ) : preview && !dateError ? (
            <>
              <Typography variant="body2">
                {keptUntil
                  ? `Las pensiones hasta ${keptUntil}, la matrícula y la cuota de ingreso se mantienen.`
                  : "La matrícula y la cuota de ingreso se mantienen."}
              </Typography>
              {preview.voided.length > 0 ? (
                <Lines
                  title="Pensiones que se anulan"
                  lines={preview.voided.map((line) => ({
                    ...line,
                    amount: line.net,
                  }))}
                />
              ) : preview.reversed.length === 0 ? (
                <Typography variant="body2">
                  Ninguna pensión se anula.
                </Typography>
              ) : null}
              {preview.reversed.length > 0 && (
                <Lines
                  title="Pensiones pagadas que se anulan: se devuelve lo pagado"
                  lines={preview.reversed.map((line) => ({
                    ...line,
                    amount: line.paid,
                    note: line.creditNote ? "Con nota de crédito" : undefined,
                  }))}
                />
              )}
              {totalExcess > 0 && (
                <ExcessSettlementFields
                  totalExcess={totalExcess}
                  value={settlement}
                  onChange={(value) => {
                    setSettlement(value);
                    setRefusal(null);
                  }}
                  errors={errors}
                  disabled={saving}
                />
              )}
              {preview.siblings.length > 0 && (
                <Siblings siblings={preview.siblings} linked={false} />
              )}
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={saving}>
          Volver
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={confirm}
          disabled={
            !preview ||
            refusedForGood ||
            saving ||
            !settlementReady(totalExcess, settlement)
          }
        >
          {saving ? "Retirando…" : "Confirmar retiro"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnrollmentWithdrawDialog;
