import { Box, Chip, Stack, Typography } from "@mui/material";
import type { RecoveryFinding } from "@/types/payment-recovery";
import { formatIsoDateTime } from "@/utils/money";
import {
  findingLabel,
  severityLabel,
} from "@/features/cashier/recovery/utils/labels";

/** What the scanner found. A resolved finding stays, quieter. */
export const CaseFindings = ({ findings }: { findings: RecoveryFinding[] }) => (
  <Stack spacing={1.5}>
    {findings.map((finding) => {
      const resolved = finding.resolvedAt != null;
      return (
        <Box
          key={finding.id}
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
            p: 1.5,
            opacity: resolved ? 0.7 : 1,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            gap={1}
          >
            <Typography fontWeight={600}>
              {findingLabel(finding.code)}
            </Typography>
            {resolved ? (
              <Chip size="small" color="success" label="Resuelto" />
            ) : (
              <Chip
                size="small"
                variant="outlined"
                color={finding.severity === "CRITICAL" ? "error" : "warning"}
                label={severityLabel(finding.severity)}
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Detectado {formatIsoDateTime(finding.detectedAt)} · Visto por última
            vez {formatIsoDateTime(finding.lastSeenAt)}
            {resolved && ` · Resuelto ${formatIsoDateTime(finding.resolvedAt)}`}
          </Typography>
        </Box>
      );
    })}
  </Stack>
);

export default CaseFindings;
