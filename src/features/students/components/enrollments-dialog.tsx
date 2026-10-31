import { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  Identifier,
  useDataProvider,
  useGetList,
  useNotify,
} from "react-admin";
import {
  ENROLLMENT_STATE,
  updateBodyOf,
} from "@/features/students/utils/enrollment-update";
import {
  fieldErrors,
  serverErrorMessage,
  splitFieldErrors,
} from "@/features/students/utils/server-errors";
import { EnrollmentAccordionItem } from "./enrollment-accordion-item";
import { EnrollmentSummary } from "@/types/enrollment";

interface EnrollmentsDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: Identifier;
}

type Values = Record<string, unknown>;

/** Values the form keeps without showing an input for them. */
const NOT_SHOWN = new Set(["documents", "repriceFromMonth"]);

export const EnrollmentsDialog = ({
  open,
  onClose,
  studentId,
}: EnrollmentsDialogProps) => {
  const [expandedId, setExpandedId] = useState<Identifier | null>(null);
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const {
    data: enrollments = [],
    isLoading,
    refetch,
  } = useGetList<EnrollmentSummary>(
    "enrollments",
    {
      filter: { studentId },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "year", order: "DESC" },
    },
    { enabled: open },
  );

  const say = (message: string, type: "success" | "error" | "info") =>
    notify(message, { type, messageArgs: { _: message } });

  const refused = (error: unknown, fallback: string) =>
    say(serverErrorMessage(error, fallback), "error");

  const handleSave = async (
    id: Identifier,
    values: Values,
    previousData: Values,
    repriceFromMonth: number | null,
  ) => {
    try {
      await dataProvider.update("enrollments", {
        id,
        data: updateBodyOf(
          values,
          repriceFromMonth === null ? {} : { repriceFromMonth },
        ),
        previousData,
      });
      say("Matrícula actualizada", "success");
      await refetch();
      return { saved: true };
    } catch (error) {
      const errors = fieldErrors(error);
      if (!errors) {
        refused(error, "No se pudo guardar la matrícula.");
        return { saved: false };
      }
      const { onFields, elsewhere } = splitFieldErrors(
        errors,
        (field) => !NOT_SHOWN.has(field) && values[field] !== undefined,
      );
      if (elsewhere) say(elsewhere, "error");
      return { saved: false, errors: onFields };
    }
  };

  const handleCancel = async (id: Identifier, detail: Values) => {
    try {
      await dataProvider.update("enrollments", {
        id,
        data: updateBodyOf(detail, { stateName: ENROLLMENT_STATE.cancelled }),
        previousData: detail,
      });
      // The API decides the outcome: a returning student is marked Retirada.
      // `refetch` hands back the provider's `{ data, total }`, whatever its type
      // says: only the hook's own `data` is unwrapped to the rows.
      const { data, isError } = await refetch();
      const rows = (data as unknown as { data: EnrollmentSummary[] }).data;
      const state = rows.find((row) => row.id === id)?.state;
      say(
        // A failed refetch leaves the old rows: they cannot tell the outcome.
        isError
          ? "Se anularon los cobros de la matrícula, pero no se pudo leer su nuevo estado. Abre de nuevo esta ventana para verlo."
          : state === ENROLLMENT_STATE.withdrawn
            ? "La matrícula queda como Retirada porque el estudiante tiene otra matrícula. Sus cobros salieron de Caja."
            : "Matrícula anulada. Sus cobros salieron de Caja.",
        "success",
      );
      setExpandedId(null);
    } catch (error) {
      refused(error, "No se pudo anular la matrícula.");
    }
  };

  const handleWithdraw = async (
    id: Identifier,
    detail: Values,
    withdrawalDate: string,
  ) => {
    await dataProvider.update("enrollments", {
      id,
      data: updateBodyOf(detail, {
        stateName: ENROLLMENT_STATE.withdrawn,
        withdrawalDate,
      }),
      previousData: detail,
    });
    say("Estudiante retirado", "success");
    await refetch();
  };

  const handleReactivate = async (
    id: Identifier,
    detail: Values,
    terms: { graceDays: number; billEnrollmentMonth: boolean },
  ): Promise<Record<string, string> | undefined> => {
    try {
      await dataProvider.update("enrollments", {
        id,
        data: updateBodyOf(detail, {
          stateName: ENROLLMENT_STATE.active,
          ...terms,
        }),
        previousData: detail,
      });
      say("Matrícula reactivada", "success");
      await refetch();
      return undefined;
    } catch (error) {
      const errors = fieldErrors(error);
      if (errors?.graceDays) return { graceDays: errors.graceDays };
      refused(error, "No se pudo reactivar la matrícula.");
      return {};
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Matrículas del Estudiante</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Box mt={1} display="flex" flexDirection="column" gap={1}>
            {enrollments.length === 0 ? (
              <Typography color="text.secondary">
                No hay matrículas registradas.
              </Typography>
            ) : (
              enrollments.map((enrollment) => (
                <EnrollmentAccordionItem
                  key={enrollment.id}
                  enrollment={enrollment}
                  expanded={expandedId === enrollment.id}
                  onExpandChange={(id, expanding) =>
                    setExpandedId(expanding ? id : null)
                  }
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onWithdraw={handleWithdraw}
                  onReactivate={handleReactivate}
                />
              ))
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
