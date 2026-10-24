import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Form, Identifier } from "react-admin";
import EmploymentContractFormInputs from "./employment-contract-form-inputs";
import { useEmploymentContractDetail } from "@/features/staff/hooks/use-employment-contract-detail";
import { EmploymentContractSummary } from "@/types/employment-contract";

interface EmploymentContractAccordionItemProps {
  contract: EmploymentContractSummary;
  expanded: boolean;
  onExpandChange: (id: Identifier, expanding: boolean) => void;
  onSave: (
    id: Identifier,
    data: Record<string, unknown>,
    previousData: Record<string, unknown>,
  ) => Promise<void>;
  onDelete: (id: Identifier) => Promise<void>;
}

export const EmploymentContractAccordionItem = ({
  contract,
  expanded,
  onExpandChange,
  onSave,
  onDelete,
}: EmploymentContractAccordionItemProps) => {
  const [pendingDelete, setPendingDelete] = useState(false);
  const { detail, isLoading, fetchDetail, updateDetail } =
    useEmploymentContractDetail(contract.id);

  useEffect(() => {
    if (expanded) fetchDetail();
  }, [expanded, fetchDetail]);

  const handleSave = async (data: Record<string, unknown>) => {
    await onSave(contract.id, data, detail!);
    updateDetail(data);
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanding) => onExpandChange(contract.id, isExpanding)}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography fontWeight="medium">
            {contract.schoolYear} — {contract.jobPosition}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {contract.institution}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {contract.startDate}
            {contract.endDate ? ` → ${contract.endDate}` : ""}
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
            <EmploymentContractFormInputs />
            <Box
              display="flex"
              justifyContent="flex-end"
              alignItems="center"
              gap={1}
              mt={2}
            >
              {pendingDelete ? (
                <>
                  <Typography variant="body2" color="error">
                    ¿Eliminar contrato?
                  </Typography>
                  <Button size="small" onClick={() => setPendingDelete(false)}>
                    No
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    onClick={() => onDelete(contract.id)}
                  >
                    Sí
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    onClick={() => setPendingDelete(true)}
                  >
                    Eliminar
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
