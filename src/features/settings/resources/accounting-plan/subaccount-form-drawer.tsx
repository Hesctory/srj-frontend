import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useCreate, useNotify, useRefresh, useUpdate } from "react-admin";
import { Account } from "@/types/accounting-plan";

interface SubaccountFormDrawerProps {
  open: boolean;
  onClose: () => void;
  parentId: number;
  record?: Account;
}

const DRAWER_WIDTH = 420;

const SubaccountFormDrawer = ({
  open,
  onClose,
  parentId,
  record,
}: SubaccountFormDrawerProps) => {
  const isEditing = !!record;
  const [formData, setFormData] = useState({
    code: "",
    printCode: "",
    name: "",
  });
  const [create, { isPending: isCreating }] = useCreate();
  const [update, { isPending: isUpdating }] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();

  useEffect(() => {
    if (open) {
      setFormData(
        record
          ? {
              code: record.code,
              printCode: record.printCode,
              name: record.name,
            }
          : { code: "", printCode: "", name: "" },
      );
    }
  }, [open, record]);

  const handleSave = () => {
    if (isEditing) {
      update(
        "accounting-plan",
        { id: record!.id, data: formData, previousData: record },
        {
          onSuccess: () => {
            notify("Subcuenta actualizada", { type: "success" });
            refresh();
            onClose();
          },
          onError: () =>
            notify("Error al actualizar subcuenta", { type: "error" }),
        },
      );
    } else {
      create(
        "accounting-plan",
        { data: { ...formData, parentAccountId: parentId } },
        {
          onSuccess: () => {
            notify("Subcuenta creada", { type: "success" });
            refresh();
            onClose();
          },
          onError: () => notify("Error al crear subcuenta", { type: "error" }),
        },
      );
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, p: 3 } }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h6">
          {isEditing ? "Editar subcuenta" : "Nueva subcuenta"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box display="flex" flexDirection="column" gap={2}>
        <TextField
          label="Código"
          value={formData.code}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, code: e.target.value }))
          }
          fullWidth
          size="small"
        />
        <TextField
          label="Cód. Impresión"
          value={formData.printCode}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, printCode: e.target.value }))
          }
          fullWidth
          size="small"
        />
        <TextField
          label="Nombre"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          fullWidth
          size="small"
        />
      </Box>

      <Box display="flex" gap={2} mt={3}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            isCreating || isUpdating || !formData.code || !formData.name
          }
          fullWidth
        >
          {isCreating || isUpdating ? "Guardando..." : "Guardar"}
        </Button>
        <Button variant="outlined" onClick={onClose} fullWidth>
          Cancelar
        </Button>
      </Box>
    </Drawer>
  );
};

export default SubaccountFormDrawer;
