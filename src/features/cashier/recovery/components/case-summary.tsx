import { Box, Typography } from "@mui/material";
import type { PaymentRecoveryCase } from "@/types/payment-recovery";
import {
  actionLabel,
  causeLabel,
  commissionTreatmentLabel,
  originLabel,
} from "@/features/cashier/recovery/utils/labels";

const Row = ({ term, children }: { term: string; children: string }) => (
  <>
    <Typography component="dt" variant="body2" color="text.secondary">
      {term}
    </Typography>
    <Typography component="dd" sx={{ m: 0, overflowWrap: "anywhere" }}>
      {children}
    </Typography>
  </>
);

export const CaseSummary = ({ record }: { record: PaymentRecoveryCase }) => (
  <Box
    component="dl"
    sx={{
      m: 0,
      display: "grid",
      gridTemplateColumns: "minmax(0, 150px) minmax(0, 1fr)",
      gap: 1.25,
      columnGap: 2,
    }}
  >
    <Row term="Acción">{actionLabel(record.action)}</Row>
    <Row term="Origen">{originLabel(record.origin)}</Row>
    <Row term="Causa">{causeLabel(record.cause)}</Row>
    {record.justification && (
      <Row term="Justificación">{record.justification}</Row>
    )}
    {record.creditNoteReasonCode && (
      <Row term="Motivo de nota de crédito">{record.creditNoteReasonCode}</Row>
    )}
    {record.commissionTreatment && (
      <Row term="Comisión">
        {commissionTreatmentLabel(record.commissionTreatment)}
      </Row>
    )}
    <Row term="Solicitud">{record.requestId}</Row>
  </Box>
);

export default CaseSummary;
