import { useState } from "react";
import { useCreatePath } from "react-admin";
import { Link } from "react-router-dom";
import { Button, Link as MuiLink, Stack, Tooltip } from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CorrectionDialog from "./correction-dialog";

interface Props {
  documentId: number | null;
  paymentId: number | null;
  documentNumber?: string | null;
  /** From the record: a number means a correction is already open. */
  openRecoveryCaseId: number | null | undefined;
}

/** Only one correction can be open on a payment or comprobante at a time. */
export const CorrectButton = ({
  documentId,
  paymentId,
  documentNumber,
  openRecoveryCaseId,
}: Props) => {
  const [open, setOpen] = useState(false);
  const createPath = useCreatePath();
  const locked = typeof openRecoveryCaseId === "number";

  return (
    <>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <Tooltip
          title={
            locked
              ? "Ya hay una corrección en curso. Termínala antes de abrir otra."
              : ""
          }
        >
          <span>
            <Button
              variant="outlined"
              startIcon={<EditNoteIcon />}
              disabled={locked}
              onClick={() => setOpen(true)}
            >
              Corregir
            </Button>
          </span>
        </Tooltip>
        {locked && (
          <MuiLink
            component={Link}
            to={createPath({
              resource: "payment-recovery-cases",
              type: "show",
              id: openRecoveryCaseId,
            })}
            variant="body2"
          >
            Ver la corrección en curso
          </MuiLink>
        )}
      </Stack>
      <CorrectionDialog
        open={open}
        onClose={() => setOpen(false)}
        documentId={documentId}
        paymentId={paymentId}
        documentNumber={documentNumber}
      />
    </>
  );
};

export default CorrectButton;
