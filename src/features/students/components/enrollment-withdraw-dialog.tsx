import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Identifier, useDataProvider } from "react-admin";
import { Link as RouterLink } from "react-router-dom";
import type { AppDataProvider } from "@/app/data-provider";
import {
  MONTH_NAMES,
  useDebounced,
} from "@/features/students/hooks/use-enrollment-preview";
import {
  fieldErrors,
  serverErrorMessage,
} from "@/features/students/utils/server-errors";
import type {
  EnrollmentWithdrawalLine,
  EnrollmentWithdrawalSibling,
} from "@/types/enrollment";
import { formatMoney } from "@/utils/money";

const FIRST_MONTH = 3;

const Lines = ({
  title,
  lines,
}: {
  title: string;
  lines: EnrollmentWithdrawalLine[];
}) => (
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
          <Typography variant="body2">{line.description}</Typography>
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
          >
            {formatMoney(line.net)}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

const siblingAdvice = ({ repriceFromMonth }: EnrollmentWithdrawalSibling) =>
  repriceFromMonth === null
    ? "ya no quedan meses por cambiar"
    : `revisar su precio desde ${MONTH_NAMES[repriceFromMonth - 1]}`;

const Siblings = ({
  siblings,
  linked,
}: {
  siblings: EnrollmentWithdrawalSibling[];
  /** Once withdrawn, each one opens: until then, leaving would lose the date. */
  linked: boolean;
}) => (
  <Box component="section" aria-label="Hermanos con descuento">
    <Typography variant="subtitle2">Hermanos con descuento</Typography>
    <Typography variant="caption" color="text.secondary">
      Su precio no cambia solo: hay que editar su matrícula.
    </Typography>
    <Box component="ul" sx={{ m: 0, pl: 2 }}>
      {siblings.map((sibling) => (
        <Typography variant="body2" component="li" key={sibling.enrollmentId}>
          {linked ? (
            <Link component={RouterLink} to={`/students/${sibling.studentId}`}>
              {sibling.fullName}
            </Link>
          ) : (
            sibling.fullName
          )}{" "}
          ({sibling.conceptName}): {siblingAdvice(sibling)}
        </Typography>
      ))}
    </Box>
  </Box>
);

interface EnrollmentWithdrawDialogProps {
  enrollmentId: Identifier;
  /** The enrollment's school year, to read the typed date against. */
  year: number;
  /** Writes the withdrawal; a refusal is thrown back to be shown here. */
  onConfirm: (withdrawalDate: string) => Promise<void>;
  onCancel: () => void;
  onDone: () => void;
}

/**
 * Withdrawing a student: the date, what it does to the pensiones, and the
 * siblings whose discount may no longer apply. Those are listed, not changed.
 */
const EnrollmentWithdrawDialog = ({
  enrollmentId,
  year,
  onConfirm,
  onCancel,
  onDone,
}: EnrollmentWithdrawDialogProps) => {
  const dataProvider = useDataProvider<AppDataProvider>();
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [refusal, setRefusal] = useState<unknown>(null);

  // A date input reports a valid date at every digit of the year.
  const settled = useDebounced(date, date);
  const { data, error, isPending } = useQuery({
    queryKey: ["enrollments", enrollmentId, "withdrawal-preview", settled],
    queryFn: () =>
      dataProvider.previewEnrollmentWithdrawal(enrollmentId, settled),
    enabled: settled !== "",
    retry: false,
  });

  const current = settled === date && settled !== "";
  const preview = current ? data : undefined;
  const failure = refusal ?? (current ? error : null);
  const dateError = fieldErrors(failure)?.withdrawalDate;

  const confirm = async () => {
    setSaving(true);
    setRefusal(null);
    try {
      await onConfirm(date);
      if (preview?.siblings.length) setWithdrawn(true);
      else onDone();
    } catch (cause) {
      setRefusal(cause);
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

  const [dateYear, dateMonth] = date.split("-").map(Number);
  const keptUntil =
    dateYear === year && dateMonth >= FIRST_MONTH
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
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setRefusal(null);
            }}
            disabled={saving}
            error={!!dateError}
            helperText={dateError}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {failure && !dateError ? (
            <Alert severity="error">
              {serverErrorMessage(
                failure,
                "No se pudo calcular el retiro. Inténtalo de nuevo.",
              )}
            </Alert>
          ) : null}
          {date === "" ? (
            <Typography variant="body2" color="text.secondary">
              Indica la fecha para ver qué pensiones se anulan.
            </Typography>
          ) : !failure && (!current || isPending) ? (
            <Skeleton variant="rounded" height={120} />
          ) : preview && !failure ? (
            <>
              <Typography variant="body2">
                {keptUntil
                  ? `Las pensiones hasta ${keptUntil}, la matrícula y la cuota de ingreso se mantienen.`
                  : "La matrícula y la cuota de ingreso se mantienen."}
              </Typography>
              {preview.voided.length > 0 ? (
                <Lines title="Pensiones que se anulan" lines={preview.voided} />
              ) : (
                <Typography variant="body2">
                  Ninguna pensión se anula.
                </Typography>
              )}
              {preview.keptPaid.length > 0 && (
                <Lines
                  title="Pensiones posteriores con pago, se mantienen"
                  lines={preview.keptPaid}
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
          disabled={!preview || !!failure || saving}
        >
          {saving ? "Retirando…" : "Confirmar retiro"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnrollmentWithdrawDialog;
