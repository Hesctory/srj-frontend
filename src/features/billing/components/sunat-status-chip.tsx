import { Chip, Tooltip } from "@mui/material";
import { useRecordContext } from "react-admin";
import {
  SUNAT_STATUS_COLOR,
  type PaymentDocument,
} from "@/types/payment-document";

/**
 * The SUNAT state of one document.
 *
 * The label is the backend's `sunatStatusName` — only the colour is mapped
 * here, so there is no second Spanish vocabulary to keep in sync. A voided
 * document reads "Anulado" instead: whatever SUNAT thinks of it stopped
 * mattering the moment it was voided.
 */
const SunatStatusChip = () => {
  const record = useRecordContext<PaymentDocument>();
  if (!record) return null;

  if (record.isVoided) {
    return (
      <Chip size="small" color="default" label="Anulado" variant="outlined" />
    );
  }

  const chip = (
    <Chip
      size="small"
      label={record.sunatStatusName}
      color={SUNAT_STATUS_COLOR[record.sunatStatusCode] ?? "default"}
      variant={
        record.sunatStatusCode === "NOT_APPLICABLE" ? "outlined" : "filled"
      }
    />
  );

  // The rejection reason is the one thing a status chip cannot carry, and on
  // every view except «Observados» this tooltip is the only place it surfaces
  // without opening the document.
  return record.sunatMessage ? (
    <Tooltip title={record.sunatMessage}>{chip}</Tooltip>
  ) : (
    chip
  );
};

export default SunatStatusChip;
