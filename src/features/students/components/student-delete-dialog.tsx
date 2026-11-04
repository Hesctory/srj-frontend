import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  useNotify,
  useRedirect,
  type RaRecord,
} from "react-admin";
import type { AppDataProvider } from "@/app/data-provider";
import EnrollmentWithdrawDialog from "./enrollment-withdraw-dialog";
import type { DeletedStudentState } from "./deleted-student-siblings";
import StudentDeleteSummary from "./student-delete-summary";
import {
  ENROLLMENT_STATE,
  annulledMessage,
  issuedDocumentsNote,
  updateBodyOf,
} from "@/features/students/utils/enrollment-update";
import { serverErrorMessage } from "@/features/students/utils/server-errors";
import type { EnrollmentSummary, UpdateEnrollment } from "@/types/enrollment";
import type { StudentDeletionOutcome } from "@/types/student";

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
  // Its own key: RA seeds `getOne` with the list's summary rows, which lack
  // the placement, and a PUT built from one would clear it.
  const { data: enrollment, error: enrollmentError } = useQuery({
    queryKey: ["enrollments", enrollmentId, "detail-for-state-change"],
    queryFn: () =>
      dataProvider
        .getOne("enrollments", { id: enrollmentId! })
        .then(({ data }) => data),
    enabled: actsOnEnrollment,
    // Say it at once: staff can close and try again.
    retry: false,
    gcTime: 0,
  });
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
          // The list asks about the siblings: this page is about to 404.
          const state: DeletedStudentState = {
            deletedSiblings: preview?.siblings,
          };
          redirect("list", "students", undefined, undefined, state);
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
      say(annulledMessage(await refetchEnrollments(), enrollmentId));
      onClose();
    } catch (error) {
      setRefusal(error);
    } finally {
      setAnnulling(false);
    }
  };

  const withdraw = async (extra: Partial<UpdateEnrollment>) => {
    const { data } = await dataProvider.update("enrollments", {
      id: enrollmentId!,
      data: updateBodyOf(enrollment as Values, {
        stateName: ENROLLMENT_STATE.withdrawn,
        ...extra,
      }),
      previousData: enrollment as RaRecord,
    });
    say(`Estudiante retirado${issuedDocumentsNote(data)}`);
  };

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
            <StudentDeleteSummary
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

export default StudentDeleteDialog;
