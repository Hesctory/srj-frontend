import { Box, Paper, Typography } from "@mui/material";
import {
  ChargeTotals,
  formatMoney,
} from "@/features/cashier/tuition/utils/charges";

interface ChargeSummaryTilesProps {
  totals: ChargeTotals;
}

type Tone = "neutral" | "success" | "error" | "warning";

interface Tile {
  label: string;
  value: string;
  hint?: string;
  tone: Tone;
}

const TONE_COLOR: Record<Tone, string> = {
  neutral: "text.primary",
  success: "success.main",
  error: "error.main",
  warning: "warning.main",
};

const TONE_ACCENT: Record<Tone, string> = {
  neutral: "divider",
  success: "success.main",
  error: "error.main",
  warning: "warning.main",
};

/**
 * Four-up money summary of the account statement. The accent bar on the left
 * carries the tone so the numbers themselves stay legible in both themes.
 */
const ChargeSummaryTiles = ({ totals }: ChargeSummaryTilesProps) => {
  const tiles: Tile[] = [
    {
      label: "Total del período",
      value: formatMoney(totals.charged),
      hint:
        totals.discount > 0
          ? `Descuentos: ${formatMoney(totals.discount)}`
          : undefined,
      tone: "neutral",
    },
    { label: "Pagado", value: formatMoney(totals.paid), tone: "success" },
    {
      label: "Saldo pendiente",
      value: formatMoney(totals.outstanding),
      tone: totals.outstanding > 0 ? "warning" : "success",
    },
    {
      label: "Vencido",
      value: formatMoney(totals.overdueAmount),
      hint:
        totals.overdueCount > 0
          ? `${totals.overdueCount} cargo${totals.overdueCount === 1 ? "" : "s"} vencido${totals.overdueCount === 1 ? "" : "s"}`
          : "Sin cargos vencidos",
      tone: totals.overdueCount > 0 ? "error" : "neutral",
    },
  ];

  return (
    <Box
      display="grid"
      gap={{ xs: 1, md: 2 }}
      gridTemplateColumns={{
        xs: "repeat(2, minmax(0, 1fr))",
        md: "repeat(4, 1fr)",
      }}
    >
      {tiles.map((tile) => (
        <Paper
          key={tile.label}
          variant="outlined"
          sx={{
            p: { xs: 1.5, md: 2 },
            borderLeft: 4,
            borderLeftColor: TONE_ACCENT[tile.tone],
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontSize: { xs: "0.6875rem", md: "0.75rem" },
            }}
          >
            {tile.label}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mt: 0.25,
              color: TONE_COLOR[tile.tone],
              fontVariantNumeric: "tabular-nums",
              fontSize: { xs: "1.125rem", md: "1.5rem" },
            }}
          >
            {tile.value}
          </Typography>
          {tile.hint && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", lineHeight: 1.3 }}
            >
              {tile.hint}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default ChargeSummaryTiles;
