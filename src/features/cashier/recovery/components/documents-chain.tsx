import { Box, Link as MuiLink, Stack, Typography } from "@mui/material";
import { useCreatePath } from "react-admin";
import { Link } from "react-router-dom";
import type { PaymentRecoveryCase } from "@/types/payment-recovery";

interface Row {
  label: string;
  value: string;
  to?: string;
}

/**
 * What the case touches: the original comprobante, the credit note it
 * generated, the payment, and the payment that replaced it. Only what exists
 * is listed. Payments have no screen of their own yet, so they are not links.
 */
export const DocumentsChain = ({ record }: { record: PaymentRecoveryCase }) => {
  const createPath = useCreatePath();
  const documentPath = (id: number) =>
    createPath({ resource: "payment-documents", type: "show", id });

  const rows: Row[] = [];
  if (record.documentId !== null)
    rows.push({
      label: "Comprobante original",
      value: `N.º ${record.documentId}`,
      to: documentPath(record.documentId),
    });
  if (record.creditNoteDocumentId !== null)
    rows.push({
      label: "Nota de crédito",
      value: `N.º ${record.creditNoteDocumentId}`,
      to: documentPath(record.creditNoteDocumentId),
    });
  if (record.paymentId !== null)
    rows.push({ label: "Pago", value: `N.º ${record.paymentId}` });
  if (record.replacementPaymentId !== null)
    rows.push({
      label: "Pago de reemplazo",
      value: `N.º ${record.replacementPaymentId}`,
    });

  if (rows.length === 0) return null;

  return (
    <Stack spacing={1}>
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
            px: 1.5,
            py: 1.25,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {row.label}
          </Typography>
          {row.to ? (
            <MuiLink component={Link} to={row.to} fontWeight={600}>
              {row.value}
            </MuiLink>
          ) : (
            <Typography fontWeight={600}>{row.value}</Typography>
          )}
        </Box>
      ))}
    </Stack>
  );
};

export default DocumentsChain;
