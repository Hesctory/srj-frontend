import { Badge, Button, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ExportButton, TopToolbar } from "react-admin";

interface PaymentDocumentsListToolbarProps {
  /** Payments still owing a comprobante — not rows of this list. */
  pendingCount: number | null;
  onIssueClick: () => void;
}

/**
 * List toolbar. Replaces RA's Create navigation with "Generar comprobante",
 * which opens the issuing dialog: a comprobante is created *from a payment*,
 * so there is no record form to navigate to.
 *
 * The badge counts payments waiting to be facturados. It is deliberately not a
 * count of anything in this list — it is the backlog the button exists to
 * clear, and the only place in the app where that number is visible.
 */
const PaymentDocumentsListToolbar = ({
  pendingCount,
  onIssueClick,
}: PaymentDocumentsListToolbarProps) => (
  <TopToolbar>
    <Stack direction="row" spacing={1} alignItems="center">
      <ExportButton />
      <Badge
        color="error"
        badgeContent={pendingCount ?? 0}
        invisible={!pendingCount}
        overlap="rectangular"
      >
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onIssueClick}
        >
          Generar comprobante
        </Button>
      </Badge>
    </Stack>
  </TopToolbar>
);

export default PaymentDocumentsListToolbar;
