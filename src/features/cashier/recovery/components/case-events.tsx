import { Box, Typography } from "@mui/material";
import type { RecoveryEvent } from "@/types/payment-recovery";
import { formatIsoDateTime } from "@/utils/money";
import {
  eventTypeLabel,
  stepLabel,
} from "@/features/cashier/recovery/utils/labels";
import TechnicalDetail from "./technical-detail";

/** Newest first. The raw message hides behind "Detalle técnico". */
export const CaseEvents = ({ events }: { events: RecoveryEvent[] }) => {
  const ordered = [...events].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return (
    <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {ordered.map((event) => (
        <Box
          component="li"
          key={event.id}
          sx={{ py: 1.25, borderTop: 1, borderColor: "divider" }}
        >
          <Typography fontWeight={600} variant="body2">
            {eventTypeLabel(event.eventType)}
            {event.step && (
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                {" "}
                · {stepLabel(event.step)}
              </Typography>
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatIsoDateTime(event.createdAt)}
          </Typography>
          <TechnicalDetail text={event.message} />
        </Box>
      ))}
    </Box>
  );
};

export default CaseEvents;
