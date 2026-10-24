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
import { EnrollmentAccordionItem } from "./enrollment-accordion-item";
import { EnrollmentSummary } from "@/types/enrollment";

interface EnrollmentsDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: Identifier;
}

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

  const handleSave = async (
    id: Identifier,
    data: Record<string, unknown>,
    previousData: Record<string, unknown>,
  ) => {
    try {
      await dataProvider.update("enrollments", { id, data, previousData });
      notify("Matrícula actualizada", { type: "success" });
      refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      notify(`Error al guardar: ${message}`, { type: "error" });
    }
  };

  const handleCancel = async (
    id: Identifier,
    data: Record<string, unknown>,
    previousData: Record<string, unknown>,
  ) => {
    try {
      await dataProvider.update("enrollments", {
        id,
        data: { ...data, stateName: "Cancelada" },
        previousData,
      });
      notify("Matrícula cancelada", { type: "success" });
      setExpandedId(null);
      refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      notify(`Error al cancelar: ${message}`, { type: "error" });
    }
  };

  const handleWithdraw = async (
    id: Identifier,
    data: Record<string, unknown>,
    previousData: Record<string, unknown>,
  ) => {
    try {
      await dataProvider.update("enrollments", {
        id,
        data: { ...data, stateName: "Retirada" },
        previousData,
      });
      notify("Estudiante retirado", { type: "success" });
      setExpandedId(null);
      refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      notify(`Error al retirar: ${message}`, { type: "error" });
    }
  };

  const handleReactivate = async (
    id: Identifier,
    data: Record<string, unknown>,
    previousData: Record<string, unknown>,
  ) => {
    try {
      await dataProvider.update("enrollments", {
        id,
        data: { ...data, stateName: "Activa" },
        previousData,
      });
      notify("Matrícula reactivada", { type: "success" });
      refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      notify(`Error al reactivar: ${message}`, { type: "error" });
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
