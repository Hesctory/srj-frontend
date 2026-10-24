import { DeleteButton, ListButton, SaveButton, TopToolbar } from "react-admin";
import { Box } from "@mui/material";
import type { MouseEvent, ReactNode } from "react";

interface CRUDToolBarProps {
  save?: boolean;
  /**
   * Enables Guardar even when the form's own fields are pristine: for screens
   * whose changes live partly outside the form (the product price grid).
   */
  saveAlwaysEnable?: boolean;
  delete?: boolean;
  /**
   * Called before "Volver" navigates; returning false stays. For screens that
   * keep changes the router cannot see (the product price grid).
   */
  onBeforeLeave?: () => boolean;
  children?: ReactNode;
}

const CRUDToolBar = ({
  save,
  saveAlwaysEnable,
  delete: showDelete,
  onBeforeLeave,
  children,
}: CRUDToolBarProps) => (
  <TopToolbar
    sx={{
      display: "flex",
      justifyContent: "space-between",
      // A narrow screen stacks the extras under the buttons, never clips them.
      flexWrap: "wrap",
      gap: 1,
    }}
  >
    <Box display="flex" gap={1}>
      <ListButton
        label="Volver"
        size="large"
        onClick={(event: MouseEvent) => {
          if (onBeforeLeave && !onBeforeLeave()) event.preventDefault();
        }}
        sx={{
          backgroundColor: "info.main",
          color: "white",
          "&:hover": { backgroundColor: "primary.dark" },
        }}
      />
      {save && (
        <SaveButton
          size="large"
          label="Guardar"
          alwaysEnable={saveAlwaysEnable}
        />
      )}
    </Box>
    {children}
    {showDelete && (
      <Box>
        <DeleteButton
          mutationMode="pessimistic"
          confirmTitle="¿Eliminar registro?"
          confirmContent="Esta acción no se puede deshacer. ¿Estás seguro?"
          label="Eliminar"
          size="large"
          sx={{
            backgroundColor: "error.main",
            color: "white",
            "&:hover": { backgroundColor: "error.dark" },
          }}
        />
      </Box>
    )}
  </TopToolbar>
);

export default CRUDToolBar;
