import { useState } from "react";
import { useDataProvider, useNotify } from "react-admin";
import { useMutation } from "@tanstack/react-query";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import type { AppDataProvider } from "@/app/data-provider";
import type { Size } from "@/types/product";
import { toCatalogError } from "@/features/products/utils/catalog-error";
import type { ProductAxis } from "@/features/products/resources/products/product-constants";

interface NewVersionDialogProps {
  productId: number;
  axis: ProductAxis;
  /** The line's scale: a new garment version starts with all of it. */
  scaleSizes: Size[];
  publishers: { id: number; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}

/**
 * An empty new version. A garment's starts with the whole size ladder and a
 * tie's with its single variant, so it is ready to price; a book's grades are
 * added from the version's menu, because a book rarely covers every level.
 * To start from an existing version's sizes and prices, clone that one.
 */
const NewVersionDialog = ({
  productId,
  axis,
  scaleSizes,
  publishers,
  onClose,
  onCreated,
}: NewVersionDialogProps) => {
  const notify = useNotify();
  const dataProvider = useDataProvider<AppDataProvider>();
  const [label, setLabel] = useState("");
  const [publisherId, setPublisherId] = useState<number | "">("");

  const { mutate: create, isPending } = useMutation({
    mutationFn: async () => {
      const { id } = await dataProvider.createProductVersion(productId, {
        label: label.trim(),
        publisherId:
          axis === "grade" && publisherId !== "" ? publisherId : null,
        notes: null,
        sizeIds: axis === "size" ? scaleSizes.map((size) => size.id) : null,
      });
      if (axis === "none") {
        await dataProvider.addProductVariants(id, { noAxis: true });
      }
    },
    onSuccess: () => {
      notify(
        axis === "grade"
          ? "Versión creada. Agrégale grados desde su menú."
          : "Versión creada.",
        { type: "success" },
      );
      onCreated();
      onClose();
    },
    onError: (cause) =>
      notify(toCatalogError(cause).message, { type: "error" }),
  });

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nueva versión</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2">
          Para partir de las tallas y precios de otra versión, usa «Clonar como
          nueva versión» en su menú.
        </DialogContentText>
        <Stack spacing={2} mt={2}>
          <TextField
            autoFocus
            required
            label="Nombre de la versión"
            placeholder="p. ej. 2026"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          {axis === "grade" && (
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={isPending || label.trim() === ""}
          onClick={() => create()}
        >
          {isPending ? "Creando…" : "Crear"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewVersionDialog;
