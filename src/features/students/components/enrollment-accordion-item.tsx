import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Form, Identifier } from "react-admin";
import EnrollmentFormInputs from "./enrollment-form-inputs";
import { useEnrollmentDetail } from "@/features/students/hooks/use-enrollment-detail";
import { EnrollmentSummary } from "@/types/enrollment";

interface EnrollmentAccordionItemProps {
  enrollment: EnrollmentSummary;
  expanded: boolean;
  onExpandChange: (id: Identifier, expanding: boolean) => void;
  onSave: (
    id: Identifier,
    data: Record<string, unknown>,
    previousData: Record<string, unknown>,
  ) => Promise<void>;
  onCancel: (
    id: Identifier,
    data: Record<string, unknown>,
    previousData: Record<string, unknown>,
  ) => Promise<void>;
  onWithdraw: (
    id: Identifier,
    data: Record<string, unknown>,
    previousData: Record<string, unknown>,
  ) => Promise<void>;
  onReactivate: (
    id: Identifier,
    data: Record<string, unknown>,
    previousData: Record<string, unknown>,
  ) => Promise<void>;
}

export const EnrollmentAccordionItem = ({
  enrollment,
  expanded,
  onExpandChange,
  onSave,
  onCancel,
  onWithdraw,
  onReactivate,
}: EnrollmentAccordionItemProps) => {
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingWithdraw, setPendingWithdraw] = useState(false);
  const { detail, isLoading, fetchDetail, updateDetail } = useEnrollmentDetail(
    enrollment.id,
  );

  useEffect(() => {
    if (expanded) fetchDetail();
  }, [expanded, fetchDetail]);

  const handleSave = async (data: Record<string, unknown>) => {
    await onSave(enrollment.id, data, detail!);
    updateDetail(data);
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanding) => onExpandChange(enrollment.id, isExpanding)}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={enrollment.year + " - " + enrollment.state}
            color={
              enrollment.state === "Cancelada"
                ? "error"
                : enrollment.state === "Retirada"
                  ? "warning"
                  : "primary"
            }
            size="small"
          />
          <Typography
            color={
              enrollment.state === "Cancelada"
                ? "error"
                : enrollment.state === "Retirada"
                  ? "warning.main"
                  : "inherit"
            }
          >
            {enrollment.grade} {enrollment.section}, {enrollment.level}{" "}
            {enrollment.shift}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : detail ? (
          <Form defaultValues={detail} onSubmit={handleSave}>
            <EnrollmentFormInputs />
            <Box
              display="flex"
              justifyContent="flex-end"
              alignItems="center"
              gap={1}
              mt={2}
            >
              {enrollment.state === "Cancelada" ? (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => onReactivate(enrollment.id, detail!, detail!)}
                >
                  Reactivar
                </Button>
              ) : enrollment.state === "Retirada" ? (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => onReactivate(enrollment.id, detail!, detail!)}
                >
                  Restaurar
                </Button>
              ) : pendingDelete ? (
                <>
                  <Typography variant="body2" color="error">
                    ¿Confirmar cancelación?
                  </Typography>
                  <Button size="small" onClick={() => setPendingDelete(false)}>
                    No
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    onClick={() => onCancel(enrollment.id, detail!, detail!)}
                  >
                    Sí
                  </Button>
                </>
              ) : pendingWithdraw ? (
                <>
                  <Typography variant="body2" color="warning.main">
                    ¿Confirmar retiro?
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setPendingWithdraw(false)}
                  >
                    No
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="warning"
                    onClick={() => onWithdraw(enrollment.id, detail!, detail!)}
                  >
                    Sí
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    onClick={() => setPendingDelete(true)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="small"
                    color="warning"
                    variant="contained"
                    onClick={() => setPendingWithdraw(true)}
                  >
                    Retirar
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    type="submit"
                  >
                    Guardar cambios
                  </Button>
                </>
              )}
            </Box>
          </Form>
        ) : null}
      </AccordionDetails>
    </Accordion>
  );
};
