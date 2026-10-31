import {
  Alert,
  AlertTitle,
  Box,
  LinearProgress,
  Skeleton,
  Typography,
} from "@mui/material";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import {
  MONTH_NAMES,
  useEnrollmentPreview,
} from "@/features/students/hooks/use-enrollment-preview";
import { serverErrorMessage } from "@/features/students/utils/server-errors";
import EnrollmentChecks from "./enrollment-checks";
import type { EnrollmentPreviewCharge } from "@/types/enrollment";
import { formatIsoDate, formatMoney } from "@/utils/money";

interface EnrollmentChargesPreviewProps {
  sourcePrefix?: string;
  /** Null on the new-student form, where there is no student to check yet. */
  studentId: number | null;
}

/** "S/ 445.00 − S/ 20.00 de descuento", or nothing when there is none. */
const discountLine = (charge: EnrollmentPreviewCharge) =>
  charge.discountAmount > 0
    ? `${formatMoney(charge.amount)} − ${formatMoney(charge.discountAmount)} de descuento`
    : null;

const ChargeRow = ({ charge }: { charge: EnrollmentPreviewCharge }) => {
  const discount = discountLine(charge);
  return (
    <Box
      component="li"
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        columnGap: 2,
        py: 0.75,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="body2">{charge.description}</Typography>
      <Typography
        variant="body2"
        sx={{ fontVariantNumeric: "tabular-nums", textAlign: "right" }}
      >
        {formatMoney(charge.netAmount)}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ gridColumn: "1 / -1" }}
      >
        {`Vence ${formatIsoDate(charge.dueDate)}`}
        {discount && ` · ${discount}`}
      </Typography>
    </Box>
  );
};

/**
 * Every charge the enrollment would raise today, with its gross amount,
 * discount, net amount and due date, and what staff should check first.
 * Warnings inform; they never stop the enrollment.
 */
const EnrollmentChargesPreview = ({
  sourcePrefix,
  studentId,
}: EnrollmentChargesPreviewProps) => {
  const base = sourcePrefix ? `${sourcePrefix}.` : "";
  const {
    data,
    error,
    isPending,
    isFetching,
    complete,
    choiceMonth,
    awaitingAnswer,
  } = useEnrollmentPreview(base, studentId);

  const body = () => {
    if (!complete) {
      return (
        <Typography variant="body2" color="text.secondary">
          Elige año, nivel, grado, turno y concepto para ver los cobros.
        </Typography>
      );
    }
    if (error) {
      return (
        <Alert severity="error">
          <AlertTitle>No se pueden calcular los cobros</AlertTitle>
          {serverErrorMessage(
            error,
            "No se pudo calcular los cobros. Inténtalo de nuevo.",
          )}
        </Alert>
      );
    }
    if (isPending || !data) {
      return <Skeleton variant="rounded" height={120} />;
    }

    // The charges depend on the answer: until it is given, listing the ones
    // for "yes" would read as if it had been decided.
    if (awaitingAnswer && choiceMonth !== null) {
      return (
        <>
          <Box sx={{ mb: 1.5 }}>
            <EnrollmentChecks
              eligibility={data.eligibility}
              warnings={data.warnings}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Indica si se cobra la pensión de {MONTH_NAMES[choiceMonth - 1]} para
            ver los cobros.
          </Typography>
        </>
      );
    }

    const reasons = [
      ...new Set(data.charges.map((c) => c.discountReason).filter(Boolean)),
    ];
    const total = data.charges.reduce((sum, c) => sum + c.netAmount, 0);

    return (
      <>
        <Box sx={{ mb: 1.5 }}>
          <EnrollmentChecks
            eligibility={data.eligibility}
            warnings={data.warnings}
          />
        </Box>
        <Box
          component="ul"
          aria-label="Cobros de la matrícula"
          sx={{ listStyle: "none", m: 0, p: 0 }}
        >
          {data.charges.map((charge) => (
            <ChargeRow
              key={`${charge.chargeTypeId}-${charge.month ?? 0}`}
              charge={charge}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            columnGap: 2,
            pt: 1,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Total
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatMoney(total)}
          </Typography>
        </Box>
        {reasons.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {reasons.join(" · ")}
          </Typography>
        )}
      </>
    );
  };

  return (
    <Box
      component="section"
      aria-label="Cobros que se generarán"
      sx={{
        borderWidth: { xs: 0, sm: 1 },
        borderStyle: "solid",
        borderColor: "divider",
        borderRadius: 1,
        p: { xs: 0, sm: 2 },
        width: "100%",
        // A charge and its amount read as one line only so far apart: on a
        // wide column the list keeps a receipt's width.
        maxWidth: 640,
      }}
    >
      <Typography sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <ReceiptLongOutlinedIcon fontSize="small" color="action" />
        Cobros que se generarán
      </Typography>
      {/* Reserved height: a refetch does not shift the panel. */}
      <Box sx={{ height: 4, mb: 1 }}>
        {complete && isFetching && <LinearProgress />}
      </Box>
      {body()}
    </Box>
  );
};

export default EnrollmentChargesPreview;
