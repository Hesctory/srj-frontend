import { useState } from "react";
import { useCreatePath, useRecordContext } from "react-admin";
import { Link } from "react-router-dom";
import { IconButton, ListItemText, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { PaymentDocument } from "@/types/payment-document";
import { CorrectionDialog } from "@/features/cashier";

/**
 * The row's "⋮" menu. Corregir opens the correction dialog; while a case is
 * open on the comprobante it is disabled and the menu links to that case.
 * A comprobante that is already voided has nothing to correct.
 */
export const RowCorrectionMenu = () => {
  const record = useRecordContext<PaymentDocument>();
  const createPath = useCreatePath();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  if (!record || record.isVoided) return null;

  const openCaseId =
    typeof record.openRecoveryCaseId === "number"
      ? record.openRecoveryCaseId
      : null;
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Acciones del comprobante ${record.number}`}
        onClick={(event) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuItem
          disabled={openCaseId !== null}
          onClick={() => {
            close();
            setDialogOpen(true);
          }}
        >
          <ListItemText
            primary="Corregir…"
            secondary={
              openCaseId !== null ? "Ya hay una corrección en curso" : undefined
            }
          />
        </MenuItem>
        {openCaseId !== null && (
          <MenuItem
            component={Link}
            to={createPath({
              resource: "payment-recovery-cases",
              type: "show",
              id: openCaseId,
            })}
          >
            Ver la corrección en curso
          </MenuItem>
        )}
      </Menu>
      <CorrectionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        documentId={record.id}
        paymentId={record.paymentId}
        documentNumber={record.number}
      />
    </>
  );
};

export default RowCorrectionMenu;
