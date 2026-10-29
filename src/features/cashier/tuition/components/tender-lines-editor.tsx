import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { PaymentMethod, PaymentPlan } from "@/types/payment";
import type { PaymentTarget } from "@/features/cashier/tuition/hooks/use-payment-drawer";
import type { PaymentDraftController } from "@/features/cashier/tuition/hooks/use-payment-draft";
import { formatMoney } from "@/features/cashier/tuition/utils/charges";
import { parseAmount } from "@/features/cashier/tuition/utils/payments";

interface TenderLinesEditorProps {
  draft: PaymentDraftController;
  target: PaymentTarget;
  methods: PaymentMethod[];
  loadingMethods: boolean;
  /** Validation stays quiet until the cashier has tried to submit once. */
  showErrors: boolean;
  /** The server's 422s by line position: `{ 0: { commission: "…" } }`. */
  serverErrors: Record<number, Record<string, string>>;
  /** The last plan previewed, kept after "Volver a editar" for its suggestions. */
  lastPlan: PaymentPlan | null;
}

/**
 * The suggestion the last preview made for this line — only while the line
 * still has the method and amount it was computed for, so a stale figure is
 * never shown beside a changed amount.
 */
const suggestionFor = (
  plan: PaymentPlan | null,
  index: number,
  paymentMethodId: number | "",
  amount: string,
) => {
  const tender = plan?.tenders[index];
  if (!tender || tender.suggestedCommission === null) return null;
  if (tender.paymentMethodId !== paymentMethodId) return null;
  if (tender.amount !== parseAmount(amount)) return null;
  return tender.suggestedCommission;
};

const SectionHeading = ({ children }: { children: string }) => (
  <Typography
    variant="overline"
    component="h3"
    color="text.secondary"
    sx={{ letterSpacing: "0.08em" }}
  >
    {children}
  </Typography>
);

/**
 * The compose step: an operative date and one or more tenders.
 *
 * Split payments are a real counter workflow (half cash, half card), and the
 * contract models them as `lines[]`, so the form is a list from the start
 * rather than a single amount that grows a "split" mode later.
 *
 * Amounts are what goes **toward the debt**. A card line also takes the
 * commission printed on the terminal's slip, charged on top. Left blank, the
 * server applies its suggestion (rate × amount); 0 means the school absorbs
 * it. The suggestion is only known after a preview, so it shows beside the
 * field once the cashier comes back from the review step.
 */
const TenderLinesEditor = ({
  draft,
  target,
  methods,
  loadingMethods,
  showErrors,
  serverErrors,
  lastPlan,
}: TenderLinesEditorProps) => (
  <Stack spacing={3}>
    {/* What is being settled — one row, concept against figure. It was three
        stacked lines for a single fact; the label stays only on the money side,
        where "is this the charge or the balance?" is a question worth answering. */}
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderLeft: 4,
        borderLeftColor: "warning.main",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box minWidth={0}>
        <Typography variant="subtitle2" sx={{ wordBreak: "break-word" }}>
          {target.label}
        </Typography>
        {target.hint && (
          <Typography variant="caption" color="text.secondary">
            {target.hint}
          </Typography>
        )}
      </Box>
      <Box textAlign="right" flexShrink={0}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          Saldo
        </Typography>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
        >
          {formatMoney(target.outstanding)}
        </Typography>
      </Box>
    </Paper>

    {/* Defaults to the server's today, so it is normally never touched. The
        rate-by-date subtlety only matters when deliberately backdating, and
        whoever does that already knows why — it does not earn a helper line. */}
    <TextField
      label="Fecha de operación"
      type="date"
      value={draft.date}
      onChange={(event) => draft.setDate(event.target.value)}
      InputLabelProps={{ shrink: true }}
      fullWidth
    />

    {/* Tenders */}
    <Box component="section">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        mb={1}
      >
        <SectionHeading>Medios de pago</SectionHeading>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={draft.addTender}
          disabled={loadingMethods}
        >
          Agregar
        </Button>
      </Box>

      <Stack spacing={2} divider={<Divider flexItem />}>
        {draft.tenders.map((tender, index) => {
          const issues = draft.issues[tender.key] ?? {};
          const fromServer = serverErrors[index] ?? {};
          const position = index + 1;
          const isCard = draft.takesCommission(tender);
          const suggestion = suggestionFor(
            lastPlan,
            index,
            tender.paymentMethodId,
            tender.amount,
          );
          const commissionError =
            (tender.commission.trim() !== "" || showErrors
              ? issues.commission
              : undefined) ?? fromServer.commission;
          const methodError = showErrors ? issues.paymentMethodId : undefined;
          // An amount that is present but unparseable is wrong now, not later.
          const amountError =
            showErrors || tender.amount.trim() !== ""
              ? issues.amount
              : undefined;

          return (
            <Box
              key={tender.key}
              display="grid"
              gap={1.5}
              alignItems="start"
              gridTemplateColumns={{
                xs: "minmax(0, 1fr) auto",
                sm: "minmax(0, 1fr) 150px auto",
              }}
            >
              <TextField
                select
                // Without it MUI's hidden native input has neither id nor name,
                // which Chrome flags as an unidentified form field.
                name={`${tender.key}-method`}
                label={`Medio ${position}`}
                value={tender.paymentMethodId}
                onChange={(event) =>
                  draft.updateTender(tender.key, {
                    paymentMethodId: Number(event.target.value),
                  })
                }
                disabled={loadingMethods}
                error={Boolean(methodError)}
                helperText={methodError}
                sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}
                fullWidth
              >
                {methods.map((method) => (
                  <MenuItem key={method.id} value={method.id}>
                    {method.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Monto"
                value={tender.amount}
                onChange={(event) =>
                  draft.updateTender(tender.key, { amount: event.target.value })
                }
                type="number"
                inputProps={{
                  min: 0,
                  step: "0.01",
                  inputMode: "decimal",
                  "aria-label": `Monto del medio de pago ${position}`,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">S/</InputAdornment>
                  ),
                }}
                error={Boolean(amountError)}
                helperText={amountError}
                fullWidth
              />

              {/* `canRemoveTender` is form-level, so every row agrees on whether
                  this column exists — no need to reserve it when it is empty,
                  which would only strand 40px beside a lone amount field. */}
              {draft.canRemoveTender && (
                <Box display="flex" justifyContent="center" pt={0.5}>
                  <Tooltip title="Quitar este medio de pago">
                    <IconButton
                      aria-label={`Quitar el medio de pago ${position}`}
                      onClick={() => draft.removeTender(tender.key)}
                      // 44px: the icon is small but the target is a thumb's.
                      sx={{ width: 44, height: 44 }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}

              <TextField
                label="N.º de operación"
                value={tender.reference}
                onChange={(event) =>
                  draft.updateTender(tender.key, {
                    reference: event.target.value,
                  })
                }
                placeholder="Opcional"
                inputProps={{
                  "aria-label": `Número de operación del medio de pago ${position}`,
                }}
                sx={{
                  gridColumn: isCard ? { xs: "1 / -1", sm: "1 / 2" } : "1 / -1",
                }}
                fullWidth
              />

              {isCard && (
                <TextField
                  label="Comisión"
                  value={tender.commission}
                  onChange={(event) =>
                    draft.updateTender(tender.key, {
                      commission: event.target.value,
                    })
                  }
                  type="number"
                  placeholder="Sugerida"
                  inputProps={{
                    min: 0,
                    step: "0.01",
                    inputMode: "decimal",
                    "aria-label": `Comisión del medio de pago ${position}`,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">S/</InputAdornment>
                    ),
                  }}
                  error={Boolean(commissionError)}
                  helperText={
                    commissionError ??
                    (suggestion !== null
                      ? `Sugerida: ${formatMoney(suggestion)}`
                      : "Vacía: se usa la sugerida")
                  }
                  sx={{ gridColumn: { xs: "1 / -1", sm: "2 / 3" } }}
                  fullWidth
                />
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>

    {/* Running total — only earns a card once there is more than one figure to
        add up. With a single tender it restated the Monto field directly above
        it. The status line below carries the same information either way. */}
    {draft.tenders.length > 1 && (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="baseline"
          gap={2}
        >
          <Typography variant="subtitle2">Total a aplicar</Typography>
          <Typography
            variant="h6"
            sx={{
              fontVariantNumeric: "tabular-nums",
              color: draft.totalIssue ? "error.main" : "text.primary",
            }}
          >
            {formatMoney(draft.total)}
          </Typography>
        </Box>
      </Paper>
    )}

    {/* The ceiling warning and the fill affordance, at any tender count. */}
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      gap={1}
      flexWrap="wrap"
      sx={{ mt: -1 }}
    >
      <Typography
        variant="caption"
        color={draft.totalIssue ? "error.main" : "text.secondary"}
      >
        {draft.totalIssue
          ? `${draft.totalIssue} Máximo: ${formatMoney(target.outstanding)}.`
          : draft.total > 0
            ? `Quedaría pendiente ${formatMoney(draft.remaining)}`
            : "La comisión de tarjeta se cobra encima del monto."}
      </Typography>
      {draft.remaining > 0 && (
        <Button size="small" onClick={draft.fillRemaining}>
          Completar el saldo
        </Button>
      )}
    </Box>
  </Stack>
);

export default TenderLinesEditor;
