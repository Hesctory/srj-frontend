import { useState } from "react";
import { useDataProvider, useNotify } from "react-admin";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import type { AppDataProvider } from "@/app/data-provider";
import type { ProductVersion, Size } from "@/types/product";
import { toCatalogError } from "@/features/products/utils/catalog-error";
import type { ProductAxis } from "@/features/products/resources/products/product-constants";
import VariantAdderDialog from "@/features/products/components/variant-adder-dialog";
import CloneVersionDialog from "@/features/products/components/clone-version-dialog";
import VersionEditDialog from "./version-edit-dialog";

interface VersionMenuProps {
  version: ProductVersion;
  displayLabel: string;
  axis: ProductAxis;
  isBook: boolean;
  sizes: Size[];
  sizeScaleId: number | null;
  schoolYearId: number;
  publishers: { id: number; name: string }[];
  onChanged: () => void;
  /** After a delete: the caller drops that version's unsaved prices. */
  onDeleted: (version: ProductVersion) => void;
}

type OpenDialog = "edit" | "variants" | "clone" | "delete" | null;

/** Everything done to a version as a whole lives behind its ⋯ button. */
const VersionMenu = ({
  version,
  displayLabel,
  axis,
  isBook,
  sizes,
  sizeScaleId,
  schoolYearId,
  publishers,
  onChanged,
  onDeleted,
}: VersionMenuProps) => {
  const notify = useNotify();
  const dataProvider = useDataProvider<AppDataProvider>();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const open = (which: OpenDialog) => {
    setAnchor(null);
    setBlockedReason(null);
    setDialog(which);
  };
  const close = () => setDialog(null);

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: () => dataProvider.deleteProductVersion(version.id),
    onSuccess: () => {
      notify("Versión eliminada.", { type: "success" });
      close();
      onDeleted(version);
    },
    onError: (cause) => {
      const failure = toCatalogError(cause);
      // 409: the version has sales behind it. Not something to retry.
      if (failure.isBlockedByHistory) setBlockedReason(failure.message);
      else {
        notify(failure.message, { type: "error" });
        close();
      }
    },
  });

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Acciones de la versión ${displayLabel}`}
        aria-haspopup="menu"
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={anchor != null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => open("edit")}>
          {isBook
            ? "Editar nombre, editorial y notas"
            : "Editar nombre y notas"}
        </MenuItem>
        {axis !== "none" && (
          <MenuItem onClick={() => open("variants")}>
            {axis === "grade" ? "Agregar grados" : "Agregar tallas"}
          </MenuItem>
        )}
        <MenuItem onClick={() => open("clone")}>
          Clonar como nueva versión
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => open("delete")} sx={{ color: "error.main" }}>
          Eliminar versión
        </MenuItem>
      </Menu>

      {dialog === "edit" && (
        <VersionEditDialog
          version={version}
          isBook={isBook}
          publishers={publishers}
          onClose={close}
          onSaved={onChanged}
        />
      )}
      {dialog === "variants" && (
        <VariantAdderDialog
          open
          versionId={version.id}
          versionLabel={displayLabel}
          axis={axis}
          sizes={sizes}
          sizeScaleId={sizeScaleId}
          existingVariants={version.variants}
          onClose={close}
          onAdded={onChanged}
        />
      )}
      {dialog === "clone" && (
        <CloneVersionDialog
          open
          versionId={version.id}
          versionLabel={displayLabel}
          schoolYearId={schoolYearId}
          isBook={isBook}
          onClose={close}
          onCloned={onChanged}
        />
      )}
      <Dialog open={dialog === "delete"} onClose={close}>
        <DialogTitle>¿Eliminar «{displayLabel}»?</DialogTitle>
        <DialogContent>
          {blockedReason ? (
            <Alert severity="warning">
              {blockedReason}
              <Typography variant="body2" sx={{ mt: 1 }}>
                Una versión con ventas no se elimina. Si ya no se vende, quítale
                los precios del año o desactiva el producto.
              </Typography>
            </Alert>
          ) : (
            <DialogContentText>
              Se eliminan sus variantes y todos sus precios. Si tiene ventas
              registradas, no podrá eliminarse.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>
            {blockedReason ? "Entendido" : "Cancelar"}
          </Button>
          {!blockedReason && (
            <Button
              color="error"
              variant="contained"
              disabled={isDeleting}
              onClick={() => remove()}
            >
              {isDeleting ? "Eliminando…" : "Eliminar"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VersionMenu;
