import { Alert, Button, CircularProgress } from "@mui/material";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import type { PaymentRecoveryScanResult } from "@/types/payment-recovery";
import { formatIsoDateTime } from "@/utils/money";
import type { RecoveryApiError } from "@/features/cashier/recovery/utils/recovery-error";

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export const ScanButton = ({
  onScan,
  scanning,
}: {
  onScan: () => void;
  scanning: boolean;
}) => (
  <Button
    variant="outlined"
    onClick={onScan}
    disabled={scanning}
    startIcon={
      scanning ? (
        <CircularProgress size={16} color="inherit" />
      ) : (
        <ManageSearchIcon />
      )
    }
  >
    Escanear inconsistencias
  </Button>
);

/** What the last scan found, or why it did not run. Dismissible. */
export const ScanBanner = ({
  result,
  error,
  onClose,
}: {
  result: PaymentRecoveryScanResult | null;
  error: RecoveryApiError | null;
  onClose: () => void;
}) => {
  if (error) {
    return (
      <Alert severity={error.isConflict ? "info" : "error"} onClose={onClose}>
        {error.isConflict ? "Ya hay un escaneo en curso." : error.message}
      </Alert>
    );
  }
  if (!result) return null;

  const nothing = result.detected === 0;
  return (
    <Alert severity={nothing ? "success" : "info"} onClose={onClose}>
      Escaneo de las {formatIsoDateTime(result.scannedAt)}.{" "}
      {nothing
        ? "No se encontraron inconsistencias."
        : `${plural(result.detected, "inconsistencia detectada", "inconsistencias detectadas")} · ${plural(result.opened, "caso nuevo", "casos nuevos")} · ${result.autoQueued} en cola automática · ${result.needsReview} ${result.needsReview === 1 ? "requiere" : "requieren"} revisión.`}
    </Alert>
  );
};
