import { Chip } from "@mui/material";
import {
  SUNAT_STATUS_COLOR,
  type SunatStatusCode,
} from "@/types/payment-document";

/**
 * The status chip, driven by a bare code rather than a record.
 *
 * `SunatStatusChip` reads from the RA record context, which is right inside a
 * DataTable and useless in a dialog that is holding a freshly-POSTed document.
 * This is the same visual for that case.
 */
const SunatStatusPill = ({ code, label }: { code: string; label: string }) => (
  <Chip
    size="small"
    label={label}
    color={SUNAT_STATUS_COLOR[code as SunatStatusCode] ?? "default"}
    variant={code === "NOT_APPLICABLE" ? "outlined" : "filled"}
  />
);

export default SunatStatusPill;
