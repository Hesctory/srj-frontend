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
  HttpError,
  Identifier,
  useDataProvider,
  useGetList,
  useNotify,
} from "react-admin";
import {
  ENROLLMENT_STATE,
  annulledMessage,
  updatedNotification,
  updateBodyOf,
} from "@/features/students/utils/enrollment-update";
import {
  fieldErrors,
  serverErrorMessage,
  splitFieldErrors,
} from "@/features/students/utils/server-errors";
import { EnrollmentAccordionItem } from "./enrollment-accordion-item";
import { SETTLEMENT_FIELDS } from "./excess-settlement-fields";
import type { EnrollmentSummary, UpdateEnrollment } from "@/types/enrollment";

interface EnrollmentsDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: Identifier;
}

type Values = Record<string, unknown>;

/** Values the form keeps without showing an input for them. */
const NOT_SHOWN = new Set(["documents", ...SETTLEMENT_FIELDS]);

/** The settlement's own messages, for the reprice dialog to show; null if none. */
const settlementErrorsOf = (errors: Record<string, string>) => {
  const found = Object.entries(errors).filter(([field]) =>
    SETTLEMENT_FIELDS.includes(field),
  );
  return found.length > 0 ? Object.fromEntries(found) : null;
};

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

  const tell = ({ message, options }: ReturnType<typeof updatedNotification>) =>
    notify(message, { ...options, messageArgs: { _: message } });

  const refused = (error: unknown, fallback: string) =>
    say(serverErrorMessage(error, fallback), "error");

  const handleSave = async (
    id: Identifier,
    values: Values,
    previousData: Values,
    extra: Partial<UpdateEnrollment>,
    inDialog: boolean,
  ) => {
    try {
      const { data } = await dataProvider.update("enrollments", {
        id,
        data: updateBodyOf(values, extra),
        previousData,
      });
      tell(updatedNotification("Matrícula actualizada", data));
      await refetch();
      return { saved: true };
    } catch (error) {
      const errors = fieldErrors(error);
      // The reprice dialog stays open on these, for staff to settle otherwise.
      if (inDialog) {
        const settlementErrors = errors && settlementErrorsOf(errors);
        if (settlementErrors)
          return {
            saved: false,
            settlementRefusal: { errors: settlementErrors },
          };
        if (error instanceof HttpError && error.status === 409)
          return {
            saved: false,
            settlementRefusal: {
              message: serverErrorMessage(
                error,
                "No se pudo guardar la matrícula.",
              ),
            },
          };
      }
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
      say(annulledMessage(await refetch(), id), "success");
      setExpandedId(null);
    } catch (error) {
      refused(error, "No se pudo anular la matrícula.");
    }
  };

  const handleWithdraw = async (
    id: Identifier,
    detail: Values,
    extra: Partial<UpdateEnrollment>,
  ) => {
    const { data } = await dataProvider.update("enrollments", {
      id,
      data: updateBodyOf(detail, {
        stateName: ENROLLMENT_STATE.withdrawn,
        ...extra,
      }),
      previousData: detail,
    });
    tell(updatedNotification("Estudiante retirado", data));
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
