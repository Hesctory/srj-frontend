import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { EnrollmentCharge } from "@/types/enrollment-charge";
import {
  chargeLabel,
  formatIsoDate,
  formatMoney,
  isSettleable,
  outstandingOf,
  statusChipOf,
} from "@/features/cashier/tuition/utils/charges";

interface ChargeDetailsPanelProps {
  charge: EnrollmentCharge;
}

const DetailRow = ({
  label,
  value,
  emphasis,
  color,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  color?: string;
}) => (
  <Box
    display="flex"
    justifyContent="space-between"
    alignItems="baseline"
    gap={2}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={emphasis ? 600 : 400}
      sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", color }}
    >
      {value}
    </Typography>
  </Box>
);

/**
 * Read-only breakdown of one statement line.
 *
 * Everything here comes from the charge already in hand — the endpoint carries
 * the gross price, the discount and its reason, which the list row deliberately
 * collapses. There is no per-obligation payment history in the API yet, so this
 * answers "why does this row look like that", not "who paid what and when".
 */
const ChargeDetailsPanel = ({ charge }: ChargeDetailsPanelProps) => {
  const voided = charge.isChargeVoided;
  const settleable = isSettleable(charge) && !voided;
  const status = statusChipOf(charge);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography
          variant="h6"
          component="h3"
          sx={{ wordBreak: "break-word" }}
        >
          {chargeLabel(charge)}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 1 }}
        >
          <Chip label={status.label} color={status.color} size="small" />
          <Chip label={charge.chargeTypeName} size="small" variant="outlined" />
          <Chip label={String(charge.year)} size="small" variant="outlined" />
          {!charge.isEffective && !voided && (
            <Chip label="No vigente" size="small" variant="outlined" />
          )}
        </Stack>
      </Box>

      {voided && (
        <Alert severity="info">
          Este cargo se anuló: ya no se cobra, y queda en el estado de cuenta
          como registro.
        </Alert>
      )}

      {charge.isFullyWaived && !voided && (
        <Alert severity="info">
          El descuento cubrió el cargo completo, así que no generó deuda y no
          hay nada que cobrar.
        </Alert>
      )}

      {charge.isOverdue && !voided && (
        <Alert severity="error">
          Vencido hace {charge.daysOverdue} día
          {charge.daysOverdue === 1 ? "" : "s"}.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1}>
          <DetailRow label="Importe bruto" value={formatMoney(charge.amount)} />
          {charge.discount > 0 && (
            <DetailRow
              label="Descuento"
              value={`- ${formatMoney(charge.discount)}`}
              color="success.main"
            />
          )}
          <Divider />
          <DetailRow
            label="Cargo neto"
            value={formatMoney(charge.netAmount)}
            emphasis
          />
        </Stack>

        {charge.discountReason && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1.5, lineHeight: 1.4 }}
          >
            Descuento por concepto de: {charge.discountReason}
          </Typography>
        )}
      </Paper>

      {settleable && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <DetailRow
              label="Vencimiento"
              value={formatIsoDate(charge.dueDate)}
            />
            <DetailRow label="Pagado" value={formatMoney(charge.paidAmount)} />
            <Divider />
            <DetailRow
              label="Saldo"
              value={formatMoney(outstandingOf(charge))}
              emphasis
              color={outstandingOf(charge) > 0 ? "error.main" : "success.main"}
            />
          </Stack>
        </Paper>
      )}

      <Typography variant="caption" color="text.secondary">
        Información al {formatIsoDate(charge.asOf)}
      </Typography>
    </Stack>
  );
};

export default ChargeDetailsPanel;
