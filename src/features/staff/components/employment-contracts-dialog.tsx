import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  Form,
  Identifier,
  useDataProvider,
  useGetList,
  useNotify,
} from "react-admin";
import { EmploymentContractAccordionItem } from "./employment-contract-accordion-item";
import EmploymentContractFormInputs from "./employment-contract-form-inputs";
import { EmploymentContractSummary } from "@/types/employment-contract";

interface EmploymentContractsDialogProps {
  open: boolean;
  onClose: () => void;
  staffMemberId: Identifier;
}

export const EmploymentContractsDialog = ({
  open,
  onClose,
  staffMemberId,
}: EmploymentContractsDialogProps) => {
  const [expandedId, setExpandedId] = useState<Identifier | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const {
    data: contracts = [],
    isLoading,
    refetch,
  } = useGetList<EmploymentContractSummary>(
    "employment-contracts",
    {
      filter: { staffMemberId },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "startDate", order: "DESC" },
    },
    { enabled: open },
  );

  const handleSave = async (
    id: Identifier,
    data: Record<string, unknown>,
    previousData: Record<string, unknown>,
  ) => {
    try {
      await dataProvider.update("employment-contracts", {
        id,
        data,
        previousData,
      });
      notify("Contrato actualizado", { type: "success" });
      refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      notify(`Error al guardar: ${message}`, { type: "error" });
    }
  };

  const handleDelete = async (id: Identifier) => {
    try {
      await dataProvider.delete("employment-contracts", {
        id,
        previousData: { id },
      });
      notify("Contrato eliminado", { type: "success" });
      setExpandedId(null);
      refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      notify(`Error al eliminar: ${message}`, { type: "error" });
    }
  };

  const handleAdd = async (data: Record<string, unknown>) => {
    try {
      await dataProvider.create("employment-contracts", {
        data: { staffMemberId, ...data },
      });
      notify("Contrato agregado", { type: "success" });
      setShowAddForm(false);
      refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      notify(`Error al agregar: ${message}`, { type: "error" });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Contratos de Empleo</DialogTitle>
      <DialogContent>
        <Box mt={1} display="flex" flexDirection="column" gap={2}>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => setShowAddForm((v) => !v)}
            >
              {showAddForm ? "Cancelar" : "Agregar Contrato"}
            </Button>
            <Collapse in={showAddForm}>
              <Box
                mt={2}
                p={2}
                border={1}
                borderColor="divider"
                borderRadius={1}
              >
                <Typography variant="subtitle2" mb={1}>
                  Nuevo Contrato
                </Typography>
                <Form onSubmit={handleAdd}>
                  <EmploymentContractFormInputs />
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button variant="contained" color="primary" type="submit">
                      Guardar
                    </Button>
                  </Box>
                </Form>
              </Box>
            </Collapse>
          </Box>

          <Divider />

          {isLoading ? (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress />
            </Box>
          ) : contracts.length === 0 ? (
            <Typography color="text.secondary">
              No hay contratos registrados.
            </Typography>
          ) : (
            contracts.map((contract) => (
              <EmploymentContractAccordionItem
                key={contract.id}
                contract={contract}
                expanded={expandedId === contract.id}
                onExpandChange={(id, expanding) =>
                  setExpandedId(expanding ? id : null)
                }
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
