import { Show, Title, useCreatePath, useRecordContext } from "react-admin";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { Payment } from "@/types/payment";
import { formatIsoDate, formatIsoDateTime, formatMoney } from "@/utils/money";
import CorrectButton from "@/features/cashier/recovery/components/correct-button";
import { partyTypeLabel } from "@/features/cashier/payments/utils/labels";

/**
 * One payment: who it was for, how it was paid, what it settled, its
 * comprobante and, when something is wrong, the way to correct it.
 *
 * `component="div"` drops Show's full-bleed Card (the page is built from cards).
 */
export const PaymentShow = () => (
  <Show actions={false} emptyWhileLoading component="div">
    <PaymentBody />
  </Show>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card variant="outlined" sx={{ p: 2.5 }}>
    <Typography variant="h6" component="h2" sx={{ fontSize: "1rem", mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Card>
);

const KeyValue = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <Box display="flex" justifyContent="space-between" gap={2} py={0.75}>
    <Typography variant="body2" color="text.secondary" flexShrink={0}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      textAlign="right"
      sx={{ overflowWrap: "anywhere" }}
    >
      {value}
    </Typography>
  </Box>
);

const Line = ({
  title,
  detail,
  amount,
  muted,
}: {
  title: string;
  detail?: string;
  amount: number;
  muted?: boolean;
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      gap: 2,
      border: 1,
      borderColor: "divider",
      borderRadius: 1.5,
      px: 1.5,
      py: 1,
      opacity: muted ? 0.55 : 1,
    }}
  >
    <Box minWidth={0}>
      <Typography
        variant="body2"
        sx={{ textDecoration: muted ? "line-through" : undefined }}
      >
        {title}
      </Typography>
      {detail && (
        <Typography variant="caption" color="text.secondary">
          {detail}
        </Typography>
      )}
    </Box>
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
    >
      {formatMoney(amount)}
    </Typography>
  </Box>
);

const PaymentBody = () => {
  const record = useRecordContext<Payment>();
  const navigate = useNavigate();
  const createPath = useCreatePath();
  if (!record) return null;

  const casePath =
    typeof record.openRecoveryCaseId === "number"
      ? createPath({
          resource: "payment-recovery-cases",
          type: "show",
          id: record.openRecoveryCaseId,
        })
      : null;

  return (
    <Box width="100%" maxWidth={1280} mx="auto" pb={3}>
      <Title title={`Pago N.º ${record.id}`} />

      <Card
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          minWidth={0}
          sx={{ flex: "1 1 320px" }}
        >
          <Button
            onClick={() => navigate("/payments")}
            startIcon={<ArrowBackIcon />}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            Volver
          </Button>
          <Box minWidth={0}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Pago N.º {record.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatIsoDate(record.date)} · {formatMoney(record.amount)}
            </Typography>
          </Box>
        </Stack>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
        >
          <Chip
            variant="outlined"
            color={record.isVoided ? "default" : "success"}
            label={record.isVoided ? "Anulado" : "Vigente"}
          />
          {!record.isVoided && (
            <CorrectButton
              documentId={record.activeDocumentId}
              paymentId={record.id}
              documentNumber={record.activeDocumentNumber}
              openRecoveryCaseId={record.openRecoveryCaseId}
            />
          )}
        </Stack>
      </Card>

      {casePath && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" component={Link} to={casePath}>
              Ver el caso
            </Button>
          }
        >
          Hay una corrección en curso sobre este pago. Hasta que termine no se
          puede abrir otra.
        </Alert>
      )}

      {record.isVoided && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Pago anulado
          {record.voidedAt ? ` el ${formatIsoDateTime(record.voidedAt)}` : ""}.
          {record.voidReason ? ` Motivo: ${record.voidReason}` : ""}
        </Alert>
      )}

      <Box
        display="grid"
        gap={2}
        gridTemplateColumns={{
          xs: "minmax(0, 1fr)",
          lg: "minmax(0, 3fr) minmax(0, 2fr)",
        }}
        alignItems="start"
      >
        <Stack spacing={2} minWidth={0}>
          <Section title="Medios de pago">
            <Stack spacing={1}>
              {record.tenders.map((tender) => (
                <Line
                  key={tender.id}
                  title={tender.paymentMethodName ?? "Medio de pago"}
                  detail={[
                    tender.cashAccountName,
                    tender.reference ? `Ref. ${tender.reference}` : null,
                    tender.isVoided ? "Anulado" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  amount={tender.amount}
                  muted={tender.isVoided}
                />
              ))}
            </Stack>
          </Section>
          <Section title="Qué cubrió">
            {record.allocations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Este pago no tiene cuotas aplicadas.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {record.allocations.map((allocation) => (
                  <Line
                    key={allocation.id}
                    title={
                      allocation.description ??
                      `Obligación N.º ${allocation.obligationId}`
                    }
                    detail={allocation.isVoided ? "Deshecho" : undefined}
                    amount={allocation.amountApplied}
                    muted={allocation.isVoided}
                  />
                ))}
              </Stack>
            )}
          </Section>
        </Stack>

        <Stack spacing={2} minWidth={0}>
          <Section title="Resumen">
            <KeyValue
              label="Pagador"
              value={
                record.partyName
                  ? `${record.partyName}${record.partyTypeCode ? ` (${partyTypeLabel(record.partyTypeCode)})` : ""}`
                  : "Sin nombre registrado"
              }
            />
            <Divider />
            <KeyValue label="Cobrado" value={formatMoney(record.amount)} />
            <KeyValue
              label="Aplicado"
              value={formatMoney(record.totalAllocated)}
            />
            <KeyValue
              label="Llegó a las cuentas"
              value={formatMoney(record.totalToAccounts)}
            />
            <Divider />
            <KeyValue
              label="Registrado"
              value={formatIsoDateTime(record.createdAt)}
            />
          </Section>
          <Section title="Comprobante">
            {record.activeDocumentId != null ? (
              <MuiLink
                component={Link}
                to={createPath({
                  resource: "payment-documents",
                  type: "show",
                  id: record.activeDocumentId,
                })}
                fontWeight={600}
              >
                {record.activeDocumentNumber ??
                  `N.º ${record.activeDocumentId}`}
              </MuiLink>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Este pago no tiene un comprobante vigente.
              </Typography>
            )}
          </Section>
        </Stack>
      </Box>
    </Box>
  );
};
