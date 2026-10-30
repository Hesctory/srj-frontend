import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { serverErrorMessage } from "@/features/students/utils/server-errors";
import type { EnrollmentPreview } from "@/types/enrollment";
import EnrollmentChecks from "./enrollment-checks";

interface EnrollmentConfirmDialogProps {
  open: boolean;
  checking: boolean;
  preview: EnrollmentPreview | null;
  error: unknown;
  /** The enrollment is being written: every button waits. */
  saving: boolean;
  question: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The answer to "does this concept apply?", at the moment it matters: who was
 * found, or what could not be confirmed. Going on is always possible, even if
 * the check itself failed; the create has the last word.
 */
const EnrollmentConfirmDialog = ({
  open,
  checking,
  preview,
  error,
  saving,
  question,
  onConfirm,
  onCancel,
}: EnrollmentConfirmDialogProps) => {
  const warned = (preview?.warnings.length ?? 0) > 0 || !!error;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onCancel}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Confirmar matrícula</DialogTitle>
      <DialogContent>
        {checking ? (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2">Verificando…</Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            {error ? (
              <Alert severity="warning">
                <AlertTitle>No se pudo verificar</AlertTitle>
                {serverErrorMessage(
                  error,
                  "Inténtalo de nuevo, o matricula sin esta verificación.",
                )}
              </Alert>
            ) : null}
            {preview && (
              <EnrollmentChecks
                eligibility={preview.eligibility}
                warnings={preview.warnings}
              />
            )}
            <Typography>{question}</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={onConfirm}
          disabled={checking || saving}
        >
          {saving
            ? "Matriculando…"
            : warned
              ? "Matricular de todos modos"
              : "Matricular"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnrollmentConfirmDialog;
