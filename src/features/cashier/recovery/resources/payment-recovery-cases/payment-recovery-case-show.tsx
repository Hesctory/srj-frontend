import { useState } from "react";
import { Show, Title, useRecordContext } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReplayIcon from "@mui/icons-material/Replay";
import type { PaymentRecoveryCase } from "@/types/payment-recovery";
import { formatIsoDateTime } from "@/utils/money";
import CaseEvents from "@/features/cashier/recovery/components/case-events";
import CaseFindings from "@/features/cashier/recovery/components/case-findings";
import CaseProgress from "@/features/cashier/recovery/components/case-progress";
import CaseStatusChip from "@/features/cashier/recovery/components/case-status-chip";
import CaseSummary from "@/features/cashier/recovery/components/case-summary";
import DocumentsChain from "@/features/cashier/recovery/components/documents-chain";
import IssueReplacementDocument from "@/features/cashier/recovery/components/issue-replacement-document";
import ResolutionForm from "@/features/cashier/recovery/components/resolution-form";
import TechnicalDetail from "@/features/cashier/recovery/components/technical-detail";
import { useResumeRecoveryCase } from "@/features/cashier/recovery/hooks/use-recovery-mutations";
import {
  actionLabel,
  originLabel,
} from "@/features/cashier/recovery/utils/labels";
import { isAutoRunning } from "@/features/cashier/recovery/utils/tabs";

/** How often a case the backend is still working on is reloaded. */
export const POLL_INTERVAL_MS = 15_000;

/** Reload only while the backend itself is still moving the case along. */
export const pollIntervalFor = (status: string | null | undefined) =>
  isAutoRunning(status) ? POLL_INTERVAL_MS : false;

/**
 * One correction: where it stands, what it touches, and the buttons the
 * backend allows right now.
 *
 * `component="div"` drops Show's full-bleed Card (the page is built from cards).
 * A case the backend still advances by itself is reloaded every 15 seconds.
 */
export const PaymentRecoveryCaseShow = () => (
  <Show
    actions={false}
    emptyWhileLoading
    component="div"
    queryOptions={{
      refetchInterval: (query) =>
        pollIntervalFor(
          (query.state.data as PaymentRecoveryCase | undefined)?.status,
        ),
    }}
  >
    <CaseBody />
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

const CaseBody = () => {
  const record = useRecordContext<PaymentRecoveryCase>();
  const navigate = useNavigate();
  const resume = useResumeRecoveryCase();
  const [dirty, setDirty] = useState(false);
  const [resolved, setResolved] = useState(false);

  if (!record) return null;

  const actions = record.availableActions ?? [];
  const canResume = actions.includes("RESUME");
  const canResolve = actions.includes("RESOLVE");
  const back = () => {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Salir igual?"))
      return;
    navigate("/payment-recovery-cases");
  };

  return (
    <Box width="100%" maxWidth={1280} mx="auto" pb={3}>
      <Title title={`Caso #${record.id}`} />

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
            onClick={back}
            startIcon={<ArrowBackIcon />}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            Volver
          </Button>
          <Box minWidth={0}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Caso #{record.id} · {actionLabel(record.action)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Abierto el {formatIsoDateTime(record.createdAt)} · Origen:{" "}
              {originLabel(record.origin).toLowerCase()}
            </Typography>
          </Box>
        </Stack>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
        >
          <CaseStatusChip status={record.status} size="medium" />
          {canResume && (
            <Button
              variant="contained"
              disabled={resume.isPending}
              startIcon={
                resume.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <ReplayIcon />
                )
              }
              onClick={() => resume.mutate(record.id)}
            >
              Reanudar
            </Button>
          )}
        </Stack>
      </Card>

      {resume.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {resume.error.message}
        </Alert>
      )}
      {resolved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Resolución guardada. El caso volvió a la cola y seguirá solo; puedes
          seguirlo desde esta página.
        </Alert>
      )}
      {record.lastError && !canResolve && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>El último intento falló</AlertTitle>
          {record.nextAttemptAt
            ? `El sistema lo reintentará solo (próximo intento: ${formatIsoDateTime(record.nextAttemptAt)}).`
            : "Queda pendiente de un nuevo intento."}
          <TechnicalDetail text={record.lastError} />
        </Alert>
      )}
      {record.status === "COMPLETED" &&
        record.replacementPaymentId !== null && (
          <IssueReplacementDocument paymentId={record.replacementPaymentId} />
        )}
      {canResolve && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Este caso necesita que alguien decida</AlertTitle>
          El sistema no puede continuar solo. Resuélvelo abajo.
          <TechnicalDetail text={record.lastError} />
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
          {canResolve && (
            <Section title="Cómo resolverlo">
              <ResolutionForm
                key={record.version}
                record={record}
                onDirtyChange={setDirty}
                onResolved={() => setResolved(true)}
              />
            </Section>
          )}
          <Section title="Progreso">
            <CaseProgress record={record} />
          </Section>
          {record.findings.length > 0 && (
            <Section title="Lo que encontró el escáner">
              <CaseFindings findings={record.findings} />
            </Section>
          )}
          <Section title="Historial">
            <CaseEvents events={record.events} />
          </Section>
        </Stack>
        <Stack spacing={2} minWidth={0}>
          <Section title="Resumen">
            <CaseSummary record={record} />
          </Section>
          <Section title="Documentos involucrados">
            <DocumentsChain record={record} />
          </Section>
        </Stack>
      </Box>
    </Box>
  );
};
