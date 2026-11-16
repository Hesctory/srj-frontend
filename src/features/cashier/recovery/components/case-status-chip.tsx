import { Chip, type ChipProps } from "@mui/material";
import { statusLabel } from "@/features/cashier/recovery/utils/labels";

const COLOR: Record<string, ChipProps["color"]> = {
  QUEUED: "info",
  WAITING_EXTERNAL: "info",
  NEEDS_REVIEW: "warning",
  COMPLETED: "success",
};

export const CaseStatusChip = ({
  status,
  size = "small",
}: {
  status: string | null | undefined;
  size?: ChipProps["size"];
}) => (
  <Chip
    size={size}
    label={statusLabel(status)}
    color={(status && COLOR[status]) || "default"}
    variant={status === "COMPLETED" ? "filled" : "outlined"}
    sx={{ fontWeight: 600 }}
  />
);

export default CaseStatusChip;
