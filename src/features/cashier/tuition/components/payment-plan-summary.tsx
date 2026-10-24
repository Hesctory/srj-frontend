import { Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import type { PaymentPlan } from "@/types/payment";
import {
  formatIsoDate,
  formatMoney,
  statusColorOf,
} from "@/features/cashier/tuition/utils/charges";
import {
  ALLOCATION_KIND_LABEL,
  formatRate,
  hasCommission,
} from "@/features/cashier/tuition/utils/payments";

interface PaymentPlanSummaryProps {
  plan: PaymentPlan;
  /** Copy for the hero figure — "Total a cobrar" before the fact, "Total cobrado" after. */
  totalLabel: string;
}

const SectionHeading = ({ children }: { children: string }) => (
  <Typography
    variant="overline"
    component="h3"
    color="text.secondary"
    sx={{ display: "block", letterSpacing: "0.08em", mb: 1 }}
  >
    {children}
  </Typography>
);

/** One label/figure pair. `emphasis` promotes the line that carries meaning. */
const MoneyLine = ({
  label,
  value,
  emphasis,
  sign,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
  sign?: "+";
}) => (
  <Box
    display="flex"
    justifyContent="space-between"
    alignItems="baseline"
    gap={2}
  >
    <Typography
      variant="body2"
      color={emphasis ? "text.primary" : "text.secondary"}
      fontWeight={emphasis ? 600 : 400}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={emphasis ? 600 : 400}
      sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
    >
      {sign === "+" ? "+ " : ""}
      {formatMoney(value)}
    </Typography>
  </Box>
);

/**
 * Renders a settlement plan: what the payer is charged, through which tenders,
 * and against which obligations. Shared by the review step and the receipt —
 * they show the same plan, only the framing changes.
 *
 * Nothing here is computed. The three totals diverge whenever a card is
 * involved (`amount` is charged, `baseAmount` reduces the debt,
 * `totalToAccounts` lands in the bank) and the breakdown exists to say so
 * out loud rather than let a cashier read it as a rounding bug.
 */
const PaymentPlanSummary = ({ plan, totalLabel }: PaymentPlanSummaryProps) => {
  const withCommission = hasCommission(plan);

  return (
    <Stack spacing={3}>
      {/* Hero total */}
      <Paper
        variant="outlined"
        sx={{ p: 2, borderLeft: 4, borderLeftColor: "primary.main" }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {totalLabel}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            mt: 0.25,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            fontSize: { xs: "1.75rem", sm: "2rem" },
          }}
        >
          {formatMoney(plan.amount)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Fecha de operación: {formatIsoDate(plan.date)}
        </Typography>

        {withCommission && (
          <Box mt={1.5}>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={0.75}>
              <MoneyLine label="Aplicado a la deuda" value={plan.baseAmount} />
              <MoneyLine
                label="Comisión de tarjeta"
                value={plan.commissionTotal}
                sign="+"
              />
              <Divider sx={{ my: 0.5 }} />
              <MoneyLine
                label="Ingresa a cuentas"
                value={plan.totalToAccounts}
                emphasis
              />
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1, lineHeight: 1.4 }}
            >
              El operador de la tarjeta retiene su comisión antes del abono, por
              eso el monto cobrado y el que ingresa a cuentas no coinciden.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Tenders */}
      <Box component="section">
        <SectionHeading>Medios de pago</SectionHeading>
        <Stack
          divider={<Divider flexItem />}
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {plan.tenders.map((tender, index) => {
            const rate = formatRate(tender.rate);
            return (
              <Box
                key={`${tender.paymentMethodId}-${index}`}
                sx={{
                  p: 1.5,
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start",
                }}
              >
                <Box minWidth={0} flex={1}>
                  <Typography
                    variant="subtitle2"
                    sx={{ wordBreak: "break-word" }}
                  >
                    {tender.paymentMethodName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    {tender.cashAccountName}
                    {tender.reference ? ` · Op. ${tender.reference}` : ""}
                  </Typography>
                  {rate && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      {formatMoney(tender.amount)} + {rate} (
                      {formatMoney(tender.commission)})
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatMoney(tender.charged)}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* Allocations */}
      <Box component="section">
        <SectionHeading>Aplicación del pago</SectionHeading>
        <Stack
          divider={<Divider flexItem />}
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {plan.allocations.map((line, index) => {
            const kindLabel = ALLOCATION_KIND_LABEL[line.kind];
            return (
              <Box
                key={`${line.obligationId ?? line.kind}-${index}`}
                sx={{ p: 1.5 }}
              >
                <Box display="flex" gap={2} alignItems="flex-start">
                  <Box minWidth={0} flex={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ wordBreak: "break-word" }}
                      >
                        {line.description}
                      </Typography>
                      {kindLabel && (
                        <Chip
                          label={kindLabel}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                    {line.dueDate && (
                      <Typography variant="caption" color="text.secondary">
                        Vence: {formatIsoDate(line.dueDate)}
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatMoney(line.allocated)}
                  </Typography>
                </Box>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={1}
                  mt={0.75}
                  flexWrap="wrap"
                >
                  <Chip
                    label={line.newStatusName}
                    size="small"
                    color={statusColorOf(line.newStatusCode)}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    Saldo {formatMoney(line.outstandingBefore)} →{" "}
                    <Box
                      component="span"
                      sx={{
                        color:
                          line.outstandingAfter > 0
                            ? "text.primary"
                            : "success.main",
                        fontWeight: 600,
                      }}
                    >
                      {formatMoney(line.outstandingAfter)}
                    </Box>
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
};

export default PaymentPlanSummary;
