import { useState } from "react";
import { useDataProvider, useNotify } from "react-admin";
import { useMutation } from "@tanstack/react-query";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import type { AppDataProvider } from "@/app/data-provider";
import type { ProductVersion } from "@/types/product";
import { toCatalogError } from "@/features/products/utils/catalog-error";

interface VersionEditDialogProps {
  version: ProductVersion;
  isBook: boolean;
  publishers: { id: number; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}

/** A version's name, publisher (books only) and notes. */
const VersionEditDialog = ({
  version,
  isBook,
  publishers,
  onClose,
  onSaved,
}: VersionEditDialogProps) => {
  const notify = useNotify();
  const dataProvider = useDataProvider<AppDataProvider>();
  const [label, setLabel] = useState(version.label ?? "");
  const [notes, setNotes] = useState(version.notes ?? "");
  const [publisherId, setPublisherId] = useState<number | "">(
    version.publisherId ?? "",
  );

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      dataProvider.updateProductVersion(version.id, {
        label: label.trim() || null,
        publisherId: isBook && publisherId !== "" ? publisherId : null,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      notify("Versión actualizada.", { type: "success" });
      onSaved();
      onClose();
    },
    onError: (cause) =>
      notify(toCatalogError(cause).message, { type: "error" }),
  });

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Editar versión</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            autoFocus
            label="Nombre de la versión"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          {isBook && (
            <TextField
              select
              label="Editorial"
              value={publisherId}
              onChange={(event) =>
                setPublisherId(
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
            >
              <MenuItem value="">
                <em>Sin editorial</em>
              </MenuItem>
              {publishers.map((publisher) => (
                <MenuItem key={publisher.id} value={publisher.id}>
                  {publisher.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label="Notas"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => save()} disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionEditDialog;
