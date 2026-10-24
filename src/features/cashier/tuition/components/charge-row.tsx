import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { EnrollmentCharge } from "@/types/enrollment-charge";
import {
  chargeLabel,
  formatIsoDate,
  formatMoney,
  isPayable,
  isSettleable,
  outstandingOf,
  statusChipOf,
} from "@/features/cashier/tuition/utils/charges";

interface ChargeRowProps {
  charge: EnrollmentCharge;
  onPay: (charge: EnrollmentCharge) => void;
  onDetails: (charge: EnrollmentCharge) => void;
}

interface AmountCellProps {
  label: string;
  value: string;
  strong?: boolean;
  color?: string;
  /**
   * Dropped on phones. There the statement answers one question — what is
   * still owed — and the gross/paid split stays available in the detail
   * drawer rather than tripling the height of every card.
   */
  mobileHidden?: boolean;
}

/**
 * Shared column tracks. Every row is its own <Paper>, so the only way the money
 * columns and the action cluster line up down the page is for each row to use
 * the *same fixed* widths — an `auto` track sizes to its own row's content, and
 * a wider status chip ("Pendiente" vs "Vencido") drags the whole right side out
 * of alignment.
 */
const MONEY_COL = 104;
const ACTION_COL = 244;

const AmountCell = ({
  label,
  value,
  strong,
  color,
  mobileHidden,
}: AmountCellProps) => (
  <Box
    sx={{
      minWidth: 0,
      textAlign: { xs: "left", md: "right" },
      // Phones read it as one line ("Saldo  S/ 332.80"); md stacks the label
      // over the figure so the shared columns can stay narrow.
      display: mobileHidden
        ? { xs: "none", md: "block" }
        : { xs: "flex", md: "block" },
      alignItems: "baseline",
      gap: 1,
    }}
  >
    <Typography variant="caption" color="text.secondary" display="block" noWrap>
      {label}
    </Typography>
    <Typography
      variant={strong ? "subtitle1" : "body2"}
      noWrap
      sx={{ fontVariantNumeric: "tabular-nums", color }}
    >
      {value}
    </Typography>
  </Box>
);

/**
 * One statement line. Rows with no `obligationId` (fully waived) have no
 * payment data at all — they still render, with dashes where the money goes.
 */
const ChargeRow = ({ charge, onPay, onDetails }: ChargeRowProps) => {
  const settleable = isSettleable(charge);
  const payable = isPayable(charge);
  const status = statusChipOf(charge);
  const outstanding = outstandingOf(charge);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, md: 2 },
        borderLeft: 4,
        borderLeftColor: charge.isOverdue
          ? "error.main"
          : payable
            ? "warning.main"
            : settleable
              ? "success.main"
              : "divider",
        opacity: settleable ? 1 : 0.75,
      }}
    >
      <Box
        display="grid"
        gap={{ xs: 1, md: 2 }}
        alignItems="center"
        gridTemplateColumns={{
          // Phones stack outright: a payable row carries a status chip plus two
          // buttons, and sharing one line with them truncates the balance to
          // "S/ 3…" — the one figure the row exists to show.
          xs: "minmax(0, 1fr)",
          sm: "minmax(0, 1fr) auto",
          md: `minmax(0, 1fr) repeat(3, ${MONEY_COL}px) ${ACTION_COL}px`,
        }}
      >
        {/* Concept — spans the full width until the money columns appear. */}
        <Box sx={{ minWidth: 0, gridColumn: { xs: "1 / -1", md: "auto" } }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography variant="subtitle2">{chargeLabel(charge)}</Typography>
            {!charge.isEffective && settleable && (
              <Tooltip title="Programado para una fecha futura: aún no es exigible">
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<ScheduleIcon fontSize="small" />}
                  label="No vigente"
                />
              </Tooltip>
            )}
          </Stack>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            sx={{ mt: 0.25 }}
          >
            <Typography variant="caption" color="text.secondary">
              Vence: {formatIsoDate(charge.dueDate)}
            </Typography>
            {charge.isOverdue && (
              <Typography
                variant="caption"
                color="error.main"
                display="flex"
                alignItems="center"
                gap={0.5}
              >
                <EventBusyIcon sx={{ fontSize: 14 }} />
                {charge.daysOverdue} día{charge.daysOverdue === 1 ? "" : "s"} de
                atraso
              </Typography>
            )}
          </Stack>

          {charge.discount > 0 && charge.discountReason && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: "none", md: "block" } }}
            >
              Descuento {formatMoney(charge.discount)} · Por concepto de:{" "}
              {charge.discountReason}
            </Typography>
          )}
        </Box>

        {/* Money — `display: contents` at md lifts the three cells into the row
            grid so they land on the shared tracks; below md they fall back to
            their own equal-width grid that can shrink with the viewport. */}
        <Box sx={{ display: { xs: "block", md: "contents" }, minWidth: 0 }}>
          <AmountCell
            label="Cargo"
            value={formatMoney(charge.netAmount)}
            mobileHidden
          />
          <AmountCell
            label="Pagado"
            value={settleable ? formatMoney(charge.paidAmount) : "—"}
            mobileHidden
          />
          <AmountCell
            label="Saldo"
            strong
            value={settleable ? formatMoney(outstanding) : "—"}
            color={outstanding > 0 ? "error.main" : "text.primary"}
          />
        </Box>

        {/* Status + action */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          minWidth={0}
          flexWrap="wrap"
          useFlexGap
          justifyContent={{ xs: "flex-start", md: "flex-end" }}
        >
          <Chip label={status.label} color={status.color} size="small" />
          {/* Details is offered on every row, waived ones included — "why isn't
              May's pensión here?" is answered by the discount breakdown, which
              only that panel shows. */}
          <Button
            variant={payable ? "text" : "outlined"}
            size="small"
            onClick={() => onDetails(charge)}
          >
            Detalles
          </Button>
          {payable && (
            <Button
              variant="contained"
              size="small"
              onClick={() => onPay(charge)}
            >
              Pagar
            </Button>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

export default ChargeRow;
