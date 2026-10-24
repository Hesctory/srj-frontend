import { Box, Typography } from "@mui/material";
import { useRecordContext } from "react-admin";
import {
  ACQUIRER_DOCUMENT_TYPE_LABEL,
  type PaymentDocument,
} from "@/types/payment-document";

/**
 * Who the document was issued to: name on top, document underneath.
 *
 * Every acquirer field is nullable, and all of them being null is not an edge
 * case — it is the most common cause of a SUNAT rejection, so it reads as an
 * explicit "sin adquirente registrado" rather than an empty cell.
 */
const AcquirerField = () => {
  const record = useRecordContext<PaymentDocument>();
  if (!record) return null;

  const documentLabel =
    record.acquirerDocumentType !== null &&
    record.acquirerDocumentNumber !== null
      ? `${ACQUIRER_DOCUMENT_TYPE_LABEL[record.acquirerDocumentType] ?? "Doc."} ${record.acquirerDocumentNumber}`
      : null;

  if (!record.acquirerFullName && !documentLabel) {
    return (
      <Typography variant="body2" color="text.disabled" fontStyle="italic">
        Sin adquirente registrado
      </Typography>
    );
  }

  return (
    <Box minWidth={0}>
      <Typography variant="body2" noWrap>
        {record.acquirerFullName ?? "—"}
      </Typography>
      {documentLabel && (
        <Typography variant="caption" color="text.secondary" noWrap>
          {documentLabel}
        </Typography>
      )}
    </Box>
  );
};

export default AcquirerField;
