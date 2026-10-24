import { useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BoltIcon from "@mui/icons-material/Bolt";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { Title, useGetList, useGetOne } from "react-admin";
import { useNavigate, useParams } from "react-router-dom";
import ChargeRow from "@/features/cashier/tuition/components/charge-row";
import ChargeSummaryTiles from "@/features/cashier/tuition/components/charge-summary-tiles";
import PaymentDrawer from "@/features/cashier/tuition/components/payment-drawer";
import usePaymentDrawer from "@/features/cashier/tuition/hooks/use-payment-drawer";
import {
  CHARGE_FILTERS,
  ChargeFilterKey,
  chargeLabel,
  formatIsoDate,
  groupByChargeType,
  isPayable,
  matchesFilter,
  outstandingOf,
  totalsOf,
} from "@/features/cashier/tuition/utils/charges";
import { EnrollmentCharge } from "@/types/enrollment-charge";

/**
 * Estado de cuenta of a single enrollment.
 *
 * Reads `GET /api/enrollment-charges` scoped by `enrollmentId` (the endpoint
 * rejects an unscoped query). One enrollment is at most a couple dozen rows, so
 * the page fetches them once and does its filtering and totals in memory —
 * server-side status filters would silently drop the fully-waived rows, which
 * are exactly the ones the cashier needs to see explained.
 */
export const DebtsPage = () => {
  const { studentId: studentIdParam, enrollmentId: enrollmentIdParam } =
    useParams<{ studentId: string; enrollmentId: string }>();
  const studentId = studentIdParam ? Number(studentIdParam) : undefined;
  const enrollmentId = enrollmentIdParam
    ? Number(enrollmentIdParam)
    : undefined;
  const navigate = useNavigate();

  const [filter, setFilter] = useState<ChargeFilterKey>("all");

  const { drawerState, openPay, openDetails, closeDrawer, clearContent } =
    usePaymentDrawer();

  const { data: student, isLoading: loadingStudent } = useGetOne(
    "students",
    { id: studentId! },
    { enabled: !!studentId },
  );

  const { data: enrollment, isLoading: loadingEnrollment } = useGetOne(
    "enrollments",
    { id: enrollmentId! },
    { enabled: !!enrollmentId },
  );

  const {
    data: charges,
    isLoading: loadingCharges,
    error: chargesError,
  } = useGetList<EnrollmentCharge>(
    "enrollment-charges",
    {
      filter: { enrollmentId },
      sort: { field: "duedate", order: "ASC" },
      pagination: { page: 1, perPage: 200 },
    },
    { enabled: !!enrollmentId },
  );

  const rows = useMemo(() => charges ?? [], [charges]);
  const totals = useMemo(() => totalsOf(rows), [rows]);
  const visibleGroups = useMemo(
    () => groupByChargeType(rows.filter((row) => matchesFilter(row, filter))),
    [rows, filter],
  );

  // Every row carries the same server evaluation date.
  const asOf = rows[0]?.asOf ?? null;

  // Rendered as chips beside the student. Kept out of the JSX so the whole
  // strip can be dropped when the enrollment carries none of them — an empty
  // <Stack> still spends its top margin.
  const enrollmentTags = [
    enrollment?.year,
    enrollment?.level,
    enrollment?.grade,
    enrollment?.section,
    enrollment?.shift,
  ].filter(Boolean);

  /**
   * Payments settle **obligations**, not charges. Naming the obligation is also
   * the only way to reach a charge that is not yet effective — the oldest-first
   * allocation the enrollment scope uses would skip it.
   */
  const payCharge = (charge: EnrollmentCharge) => {
    if (!isPayable(charge)) return;
    // No `hint`: the row they just clicked already showed the due date and the
    // days overdue. Quick pay keeps its hint because the allocation order it
    // describes is not visible anywhere else.
    openPay({
      label: chargeLabel(charge),
      outstanding: outstandingOf(charge),
      obligationIds: [charge.obligationId as number],
    });
  };

  /** No obligations named: the server allocates across the enrollment, oldest due date first. */
  const payEverything = () =>
    openPay({
      label: "Todos los cargos pendientes de la matrícula",
      hint: "Se aplica al cargo más antiguo primero",
      outstanding: totals.outstanding,
    });

  if (loadingStudent || loadingEnrollment || loadingCharges) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Title title="Pensiones" />
      {/* `width: 100%` is load-bearing: <main> is a flex column, and `mx: auto`
          on a flex item cancels the default stretch — without it the Box
          shrink-wraps its content and never reaches `maxWidth`. */}
      <Box width="100%" maxWidth={1600} mx="auto" pb={3}>
        {/* Header */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              minWidth={0}
            >
              <Tooltip title="Volver">
                <IconButton
                  aria-label="Volver"
                  onClick={() =>
                    navigate(`/cashier/tuition?studentId=${studentId}`)
                  }
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>

              <Box minWidth={0}>
                <Typography variant="h5">{student?.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  DNI: {student?.dni ?? student?.idDocumentNumber ?? "—"}
                  {student?.studentCode
                    ? ` · Código: ${student.studentCode}`
                    : ""}
                </Typography>
                {enrollmentTags.length > 0 && (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1 }}
                    flexWrap="wrap"
                  >
                    {enrollmentTags.map((item) => (
                      <Chip
                        key={String(item)}
                        label={String(item)}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={<BoltIcon />}
              onClick={payEverything}
              disabled={totals.outstanding <= 0}
            >
              Pago rápido
            </Button>
          </Box>
        </Paper>

        <ChargeSummaryTiles totals={totals} />

        {/* Filters */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
          mt={2}
          mb={2}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filter}
            onChange={(_, value) =>
              value && setFilter(value as ChargeFilterKey)
            }
          >
            {CHARGE_FILTERS.map((option) => (
              <ToggleButton key={option.key} value={option.key}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {asOf && (
            <Typography variant="caption" color="text.secondary">
              Información al {formatIsoDate(asOf)}
            </Typography>
          )}
        </Box>

        {/* Charges */}
        {chargesError ? (
          <Alert severity="error">
            No se pudo cargar el estado de cuenta de esta matrícula.
          </Alert>
        ) : rows.length === 0 ? (
          <Alert severity="info">
            Esta matrícula no tiene cargos registrados.
          </Alert>
        ) : visibleGroups.length === 0 ? (
          <Alert severity="info">
            Ningún cargo coincide con el filtro seleccionado.
          </Alert>
        ) : (
          <Stack spacing={3}>
            {visibleGroups.map((group) => (
              <Box key={group.chargeTypeId}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ display: "block", letterSpacing: "0.08em", mb: 1 }}
                >
                  {group.name}
                </Typography>
                <Stack spacing={1.5}>
                  {group.rows.map((charge) => (
                    <ChargeRow
                      key={charge.id}
                      charge={charge}
                      onPay={payCharge}
                      onDetails={openDetails}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <PaymentDrawer
        state={drawerState}
        enrollmentId={enrollmentId!}
        asOf={asOf}
        onClose={closeDrawer}
        onExited={clearContent}
      />
    </>
  );
};
