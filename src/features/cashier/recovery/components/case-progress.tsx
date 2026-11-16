import { Box, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import type { PaymentRecoveryCase } from "@/types/payment-recovery";
import {
  statusLabel,
  stepLabel,
} from "@/features/cashier/recovery/utils/labels";

type StepState = "DONE" | "CURRENT" | "WAITING" | "ATTENTION" | "PENDING";

const DOT = 28;

/** What a case parked at a step is waiting on, read from the step itself. */
export const waitingText = (step: string | null): string => {
  switch (step) {
    case "RECONCILE_DOCUMENT":
      return "Esperando a SUNAT: el comprobante";
    case "FILE_CREDIT_NOTE":
      return "Esperando a SUNAT: la nota de crédito";
    default:
      return "Esperando a SUNAT";
  }
};

const stateText = (state: StepState, step: string): string => {
  switch (state) {
    case "DONE":
      return "Hecho";
    case "CURRENT":
      return "En curso";
    case "WAITING":
      return waitingText(step);
    case "ATTENTION":
      return "Requiere revisión";
    default:
      return "Pendiente";
  }
};

/**
 * Where each step of the path stands. Steps before `currentStep` are done;
 * `COMPLETED` finishes them all. A `currentStep` the path does not contain
 * (the path can shrink between polls) leaves every step pending rather than
 * guessing.
 */
export const stepStates = (record: PaymentRecoveryCase): StepState[] => {
  const steps = record.plannedSteps ?? [];
  if (record.status === "COMPLETED") return steps.map(() => "DONE");
  const current = record.currentStep ? steps.indexOf(record.currentStep) : -1;
  return steps.map((_, index) => {
    if (current < 0 || index > current) return "PENDING";
    if (index < current) return "DONE";
    if (record.status === "NEEDS_REVIEW") return "ATTENTION";
    if (record.status === "WAITING_EXTERNAL") return "WAITING";
    return "CURRENT";
  });
};

const StepDot = ({ state, index }: { state: StepState; index: number }) => {
  const filled = state === "DONE";
  const color =
    state === "ATTENTION"
      ? "error"
      : state === "WAITING"
        ? "warning"
        : "primary";
  const active = state !== "PENDING";
  return (
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
        borderColor: active ? `${color}.main` : "divider",
        bgcolor: filled ? "primary.main" : "background.paper",
        color: filled
          ? "primary.contrastText"
          : active
            ? `${color}.main`
            : "text.secondary",
      }}
    >
      {state === "DONE" ? (
        <CheckIcon sx={{ fontSize: 16 }} />
      ) : state === "ATTENTION" ? (
        <PriorityHighIcon sx={{ fontSize: 16 }} />
      ) : state === "WAITING" ? (
        <HourglassEmptyIcon sx={{ fontSize: 16 }} />
      ) : (
        index + 1
      )}
    </Box>
  );
};

/**
 * The path this case follows. The backend decides the steps and their order
 * (`plannedSteps`); this only draws them: a column on phones, a row from `sm`.
 * Without a path it says where the case is now and invents none.
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

  const states = stepStates(record);

  return (
    <Box
      component="ol"
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 2, sm: 1.5 },
      }}
    >
      {steps.map((step, index) => {
        const state = states[index];
        const emphasised = state !== "PENDING" && state !== "DONE";
        return (
          <Box
            component="li"
            key={`${step}-${index}`}
            aria-current={emphasised ? "step" : undefined}
            sx={{
              display: "flex",
              flexDirection: { xs: "row", sm: "column" },
              alignItems: { xs: "flex-start", sm: "flex-start" },
              gap: 1.5,
              flex: { sm: 1 },
              minWidth: 0,
            }}
          >
            <StepDot state={state} index={index} />
            <Box minWidth={0}>
              <Typography
                fontWeight={emphasised ? 700 : 500}
                color={state === "PENDING" ? "text.secondary" : undefined}
                sx={{ overflowWrap: "anywhere" }}
              >
                {stepLabel(step)}
              </Typography>
              <Typography
                variant="caption"
                color={
                  state === "ATTENTION"
                    ? "error.main"
                    : state === "WAITING"
                      ? "warning.main"
                      : "text.secondary"
                }
                sx={{ overflowWrap: "anywhere" }}
              >
                {stateText(state, step)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default CaseProgress;
