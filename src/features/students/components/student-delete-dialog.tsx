import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  HttpError,
  useDataProvider,
  useDelete,
  useGetList,
  useGetOne,
  useNotify,
  useRedirect,
  type RaRecord,
} from "react-admin";
import type { AppDataProvider } from "@/app/data-provider";
import EnrollmentWithdrawDialog, {
  Siblings,
} from "./enrollment-withdraw-dialog";
import {
  ENROLLMENT_STATE,
  updateBodyOf,
} from "@/features/students/utils/enrollment-update";
import { serverErrorMessage } from "@/features/students/utils/server-errors";
import type { EnrollmentSummary } from "@/types/enrollment";
import type {
  StudentDeletionOutcome,
  StudentDeletionPreview,
} from "@/types/student";

type Values = Record<string, unknown>;

/** Said when the API sends no message of its own. */
const FALLBACK: Record<StudentDeletionOutcome, string> = {
  DELETE: "El estudiante se puede eliminar.",
  CANCEL_ENROLLMENT: "El estudiante no se puede eliminar.",
  WITHDRAW: "El estudiante no se puede eliminar.",
  KEEP: "El estudiante no se puede eliminar.",
  WAIT: "Hay un trámite en proceso. Inténtalo cuando termine.",
};

interface StudentDeleteDialogProps {
  student: RaRecord;
  onClose: () => void;
}

/**
 * Deleting a student, as the API's preview decides: delete (ticking any
 * warnings), annul or withdraw the enrollment instead, or keep them.
 */
const StudentDeleteDialog = ({
  student,
  onClose,
}: StudentDeleteDialogProps) => {
  const dataProvider = useDataProvider<AppDataProvider>();
  const notify = useNotify();
  const redirect = useRedirect();
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [refusal, setRefusal] = useState<unknown>(null);
  const [annulling, setAnnulling] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [deletedWithSiblings, setDeletedWithSiblings] = useState(false);

  const say = (message: string, type: "success" | "error" = "success") =>
    notify(message, { type, messageArgs: { _: message } });

  const {
    data: preview,
    error: previewError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["students", student.id, "deletion-preview"],
    queryFn: () => dataProvider.previewStudentDeletion(student.id),
    retry: false,
    // A preview from an earlier visit must not be confirmable.
    gcTime: 0,
  });

  const outcome = preview?.outcome ?? null;
  const enrollmentId = preview?.enrollmentId ?? null;
  const actsOnEnrollment =
    (outcome === "CANCEL_ENROLLMENT" || outcome === "WITHDRAW") &&
    enrollmentId !== null;

  // The enrollment's PUT resends its placement; its year reads the date typed.
  const { data: enrollment, error: enrollmentError } = useGetOne<RaRecord>(
    "enrollments",
    { id: enrollmentId! },
    { enabled: actsOnEnrollment },
  );
  const { data: enrollments, refetch: refetchEnrollments } =
    useGetList<EnrollmentSummary>(
      "enrollments",
      {
        filter: { studentId: student.id },
        pagination: { page: 1, perPage: 100 },
        sort: { field: "year", order: "DESC" },
      },
      { enabled: actsOnEnrollment },
    );
  const year = enrollments?.find((row) => row.id === enrollmentId)?.year;

  const [deleteOne, { isPending: deleting }] = useDelete();

  const warnings = preview?.warnings ?? [];
  const allTicked = warnings.every((_, index) => ticked.has(index));
  const busy = deleting || annulling || isFetching;

  const tick = (index: number, checked: boolean) =>
    setTicked((current) => {
      const next = new Set(current);
      if (checked) next.add(index);
      else next.delete(index);
      return next;
    });

  const recheck = () => {
    setTicked(new Set());
    void refetch();
  };

  const remove = () => {
    setRefusal(null);
    deleteOne(
      "students",
      {
        id: student.id,
        previousData: student,
        meta: { confirmWarnings: warnings.length > 0 },
      },
      {
        mutationMode: "pessimistic",
        onSuccess: () => {
          say("Estudiante eliminado");
          if (preview?.siblings.length) setDeletedWithSiblings(true);
          else redirect("list", "students");
        },
        onError: (error) => {
          setRefusal(error);
          // A 409 means things changed since the preview: show the new one.
          if (error instanceof HttpError && error.status === 409) recheck();
        },
      },
    );
  };

  const annul = async () => {
    setAnnulling(true);
    setRefusal(null);
    try {
      await dataProvider.update("enrollments", {
        id: enrollmentId!,
        data: updateBodyOf(enrollment as Values, {
          stateName: ENROLLMENT_STATE.cancelled,
        }),
        previousData: enrollment as RaRecord,
      });
      const { data } = await refetchEnrollments();
      const state = data?.find((row) => row.id === enrollmentId)?.state;
      say(
        state === ENROLLMENT_STATE.withdrawn
          ? "La matrícula queda como Retirada y el estudiante se mantiene. Sus cobros salieron de Caja."
          : "Matrícula anulada. Sus cobros salieron de Caja.",
      );
      onClose();
    } catch (error) {
      setRefusal(error);
    } finally {
      setAnnulling(false);
    }
  };

  const withdraw = async (withdrawalDate: string) => {
    await dataProvider.update("enrollments", {
      id: enrollmentId!,
      data: updateBodyOf(enrollment as Values, {
        stateName: ENROLLMENT_STATE.withdrawn,
        withdrawalDate,
      }),
      previousData: enrollment as RaRecord,
    });
    say("Estudiante retirado");
  };

  if (deletedWithSiblings && preview) {
    const done = () => redirect("list", "students");
    return (
      <Dialog open onClose={done} fullWidth maxWidth="sm">
        <DialogTitle>Estudiante eliminado</DialogTitle>
        <DialogContent>
          <Siblings siblings={preview.siblings} linked />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={done}>
            Listo
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (withdrawing && enrollmentId !== null && year !== undefined) {
    return (
      <EnrollmentWithdrawDialog
        enrollmentId={enrollmentId}
        year={Number(year)}
        onConfirm={withdraw}
        onCancel={() => setWithdrawing(false)}
        onDone={onClose}
      />
    );
  }

  const enrollmentReady = !!enrollment && !enrollmentError;
  const message = preview && outcome && (preview.message ?? FALLBACK[outcome]);

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Eliminar estudiante</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {refusal ? (
            <Alert severity="error">
              {serverErrorMessage(
                refusal,
                "No se pudo completar la acción. Inténtalo de nuevo.",
              )}
            </Alert>
          ) : null}
          {previewError && !isFetching ? (
            <Alert severity="error">
              {serverErrorMessage(
                previewError,
                "No se pudo consultar si el estudiante se puede eliminar.",
              )}
            </Alert>
          ) : !preview || (isFetching && !refusal) ? (
            <Skeleton variant="rounded" height={96} />
          ) : outcome === "DELETE" ? (
            <DeleteSummary
              preview={preview}
              ticked={ticked}
              onTick={tick}
              disabled={busy}
            />
          ) : (
            <>
              <Alert severity={outcome === "WAIT" ? "info" : "warning"}>
                {message ?? FALLBACK.KEEP}
              </Alert>
              {outcome === "CANCEL_ENROLLMENT" && (
                <Typography variant="body2">
                  Puedes anular su matrícula actual. Sus cobros salen de Caja.
                </Typography>
              )}
              {outcome === "WITHDRAW" && (
                <Typography variant="body2">
                  Puedes registrar su retiro.
                </Typography>
              )}
              {actsOnEnrollment && enrollmentError ? (
                <Alert severity="error">
                  No se pudo cargar la matrícula. Cierra y vuelve a intentarlo.
                </Alert>
              ) : null}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button onClick={onClose} disabled={busy}>
          {outcome === "DELETE" ? "Cancelar" : "Cerrar"}
        </Button>
        {(previewError || outcome === "WAIT") && (
          <Button onClick={recheck} disabled={busy}>
            Consultar de nuevo
          </Button>
        )}
        {outcome === "DELETE" && !previewError && (
          <Button
            variant="contained"
            color="error"
            onClick={remove}
            disabled={!allTicked || busy}
          >
            {deleting ? "Eliminando…" : "Eliminar estudiante"}
          </Button>
        )}
        {outcome === "CANCEL_ENROLLMENT" && !previewError && (
          <Button
            variant="contained"
            color="error"
            onClick={annul}
            disabled={!enrollmentReady || busy}
          >
            {annulling ? "Anulando…" : "Anular matrícula"}
          </Button>
        )}
        {outcome === "WITHDRAW" && !previewError && (
          <Button
            variant="contained"
            color="warning"
            onClick={() => setWithdrawing(true)}
            disabled={!enrollmentReady || year === undefined || busy}
          >
            Registrar retiro
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const DeleteSummary = ({
  preview,
  ticked,
  onTick,
  disabled,
}: {
  preview: StudentDeletionPreview;
  ticked: Set<number>;
  onTick: (index: number, checked: boolean) => void;
  disabled: boolean;
}) => (
  <>
    <Typography variant="body2">
      El estudiante dejará de aparecer en las listas.
      {preview.enrollmentId !== null &&
        " Su matrícula se anula y sus cobros salen de Caja."}{" "}
      Para recuperarlo, vuelve a registrarlo con su documento.
    </Typography>
    {preview.warnings.length > 0 && (
      <Box component="section" aria-label="Advertencias">
        <Typography variant="subtitle2">
          Confirma cada advertencia para eliminar:
        </Typography>
        <Stack>
          {preview.warnings.map((warning, index) => (
            <Box key={`${warning.code}-${index}`}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={ticked.has(index)}
                    onChange={(event) => onTick(index, event.target.checked)}
                    disabled={disabled}
                  />
                }
                label={warning.message ?? warning.code}
              />
              {warning.code === "SIBLING_DISCOUNT" &&
                preview.siblings.length > 0 && (
                  <Box sx={{ pl: 4 }}>
                    <Siblings siblings={preview.siblings} linked={false} />
                  </Box>
                )}
            </Box>
          ))}
        </Stack>
      </Box>
    )}
  </>
);

export default StudentDeleteDialog;
