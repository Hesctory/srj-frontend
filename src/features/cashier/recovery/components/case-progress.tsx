import { Box, Stack, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import type {
  PaymentRecoveryCase,
  PlannedStep,
} from "@/types/payment-recovery";
import {
  statusLabel,
  stepLabel,
} from "@/features/cashier/recovery/utils/labels";

const DOT = 28;

const StepDot = ({
  state,
  index,
}: {
  state: PlannedStep["state"];
  index: number;
}) => (
  <Box
    aria-hidden
    sx={{
      width: DOT,
      height: DOT,
      borderRadius: "50%",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.75rem",
      fontWeight: 700,
      border: 2,
      borderColor:
        state === "DONE" || state === "CURRENT" ? "primary.main" : "divider",
      bgcolor: state === "DONE" ? "primary.main" : "background.paper",
      color:
        state === "DONE"
          ? "primary.contrastText"
          : state === "CURRENT"
            ? "primary.main"
            : "text.secondary",
      opacity: state === "SKIPPED" ? 0.5 : 1,
    }}
  >
    {state === "DONE" ? <CheckIcon sx={{ fontSize: 16 }} /> : index + 1}
  </Box>
);

const STATE_TEXT: Record<PlannedStep["state"], string> = {
  DONE: "Hecho",
  CURRENT: "En curso",
  PENDING: "Pendiente",
  SKIPPED: "No aplica",
};

/**
 * The path this case follows. The backend decides the steps and their order
 * (`plannedSteps`); this only draws them. While the backend does not send them
 * yet, it says where the case is now, in plain words, and invents no path.
 */
export const CaseProgress = ({ record }: { record: PaymentRecoveryCase }) => {
  const steps = record.plannedSteps;

  if (!steps?.length) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          Estado
        </Typography>
        <Typography fontWeight={600}>{statusLabel(record.status)}</Typography>
        {record.currentStep && (
          <Typography variant="body2" color="text.secondary">
            Paso actual: {stepLabel(record.currentStep)}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Stack component="ol" spacing={0} sx={{ listStyle: "none", m: 0, p: 0 }}>
      {steps.map((step, index) => (
        <Box
          component="li"
          key={`${step.step}-${index}`}
          aria-current={step.state === "CURRENT" ? "step" : undefined}
          sx={{
            display: "flex",
            gap: 1.5,
            pb: index < steps.length - 1 ? 2 : 0,
          }}
        >
          <StepDot state={step.state} index={index} />
          <Box minWidth={0}>
            <Typography
              fontWeight={step.state === "CURRENT" ? 700 : 500}
              color={step.state === "PENDING" ? "text.secondary" : undefined}
              sx={{
                textDecoration:
                  step.state === "SKIPPED" ? "line-through" : undefined,
              }}
            >
              {stepLabel(step.step)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {STATE_TEXT[step.state] ?? step.state}
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

export default CaseProgress;
