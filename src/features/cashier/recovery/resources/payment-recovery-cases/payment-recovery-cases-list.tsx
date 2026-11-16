import { useState } from "react";
import {
  DataTable,
  FilterButton,
  List,
  TopToolbar,
  useListContext,
  useRecordContext,
} from "react-admin";
import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import type { PaymentRecoveryCase } from "@/types/payment-recovery";
import { formatAge } from "@/utils/money";
import CaseStatusChip from "@/features/cashier/recovery/components/case-status-chip";
import {
  ScanBanner,
  ScanButton,
} from "@/features/cashier/recovery/components/scan-panel";
import { useScanRecoveryCases } from "@/features/cashier/recovery/hooks/use-recovery-mutations";
import {
  actionLabel,
  causeLabel,
  originLabel,
  stepLabel,
} from "@/features/cashier/recovery/utils/labels";
import {
  RECOVERY_TABS,
  tabByKey,
  type RecoveryTabKey,
} from "@/features/cashier/recovery/utils/tabs";
import { recoveryCaseFilters } from "./filters";

/**
 * Correcciones — every correction of a payment or comprobante, and what the
 * scanner found. The tab strip is a lens on one list (it presets `status`); the
 * filter bar narrows within it. CANCELLED never appears: even «Todos» names the
 * statuses it shows.
 */
export const PaymentRecoveryCasesList = () => {
  const [tabKey, setTabKey] = useState<RecoveryTabKey>("review");
  const scan = useScanRecoveryCases();
  const [dismissed, setDismissed] = useState(false);
  const tab = tabByKey(tabKey);

  const runScan = () => {
    setDismissed(false);
    scan.mutate();
  };

  return (
    <>
      <Stack spacing={1.5} sx={{ mb: 1 }}>
        {!dismissed && (
          <ScanBanner
            result={scan.data ?? null}
            error={scan.error}
            onClose={() => setDismissed(true)}
          />
        )}
      </Stack>
      <Tabs
        value={tabKey}
        onChange={(_, value) => setTabKey(value as RecoveryTabKey)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: "divider", minHeight: 44 }}
      >
        {RECOVERY_TABS.map((entry) => (
          <Tab key={entry.key} value={entry.key} label={entry.label} />
        ))}
      </Tabs>

      <List
        debounce={500}
        filter={{ status: tab.status }}
        filters={recoveryCaseFilters}
        sort={{ field: "id", order: "DESC" }}
        actions={
          <TopToolbar>
            <FilterButton />
            <ScanButton onScan={runScan} scanning={scan.isPending} />
          </TopToolbar>
        }
        empty={false}
        error={<ListFailed />}
      >
        <DataTable
          rowClick="show"
          bulkActionButtons={false}
          empty={<NothingHere tabKey={tabKey} />}
        >
          <DataTable.Col source="id" label="Caso">
            <CaseNumber />
          </DataTable.Col>
          <DataTable.Col source="action" label="Acción" sx={{ width: "100%" }}>
            <ActionCell />
          </DataTable.Col>
          <DataTable.Col label="Comprobante · Pago">
            <TargetCell />
          </DataTable.Col>
          <DataTable.Col source="status" label="Estado">
            <StatusCell />
          </DataTable.Col>
          <DataTable.Col source="currentStep" label="Paso">
            <StepCell />
          </DataTable.Col>
          <DataTable.Col source="attemptCount" label="Intentos" align="right">
            <AttemptsCell />
          </DataTable.Col>
          <DataTable.Col source="updatedAt" label="Actualizado">
            <UpdatedCell />
          </DataTable.Col>
        </DataTable>
      </List>
    </>
  );
};

const useCase = () => useRecordContext<PaymentRecoveryCase>();

const CaseNumber = () => {
  const record = useCase();
  return record ? (
    <Typography fontWeight={600} sx={{ fontVariantNumeric: "tabular-nums" }}>
      #{record.id}
    </Typography>
  ) : null;
};

const ActionCell = () => {
  const record = useCase();
  if (!record) return null;
  return (
    <Box minWidth={0}>
      <Typography fontWeight={600}>{actionLabel(record.action)}</Typography>
      <Typography variant="caption" color="text.secondary">
        {originLabel(record.origin)} · {causeLabel(record.cause)}
      </Typography>
    </Box>
  );
};

const TargetCell = () => {
  const record = useCase();
  if (!record) return null;
  const parts = [
    record.documentId !== null ? `Comprobante ${record.documentId}` : null,
    record.paymentId !== null ? `Pago ${record.paymentId}` : null,
  ].filter(Boolean);
  return <Typography variant="body2">{parts.join(" · ") || "—"}</Typography>;
};

const StatusCell = () => {
  const record = useCase();
  return record ? <CaseStatusChip status={record.status} /> : null;
};

const StepCell = () => {
  const record = useCase();
  if (!record) return null;
  return (
    <Typography variant="body2">
      {record.status === "COMPLETED" ? "—" : stepLabel(record.currentStep)}
    </Typography>
  );
};

const AttemptsCell = () => {
  const record = useCase();
  return record ? <>{record.attemptCount}</> : null;
};

const UpdatedCell = () => {
  const record = useCase();
  return record ? (
    <Typography variant="body2" color="text.secondary" noWrap>
      {formatAge(record.updatedAt)}
    </Typography>
  ) : null;
};

/** "Nothing exists" reads differently from "nothing matches". */
const NothingHere = ({ tabKey }: { tabKey: RecoveryTabKey }) => {
  const { filterValues, setFilters } = useListContext();
  const narrowed = Object.values(filterValues).some(
    (v) => v != null && v !== "",
  );

  let text =
    "Aún no hay correcciones. Aparecerán aquí cuando se anule o reemplace un pago o comprobante, o cuando el escáner encuentre algo.";
  if (narrowed) text = "Ningún caso coincide con estos filtros.";
  else if (tabKey === "review") text = "No hay casos que requieran revisión.";
  else if (tabKey !== "all") text = "No hay casos en este estado.";

  return (
    <Stack alignItems="flex-start" spacing={1} sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
      {narrowed && (
        <Button size="small" onClick={() => setFilters({}, {})}>
          Quitar filtros
        </Button>
      )}
    </Stack>
  );
};

const ListFailed = () => {
  const { refetch } = useListContext();
  return (
    <Stack alignItems="flex-start" spacing={1} sx={{ p: 2 }} role="alert">
      <Typography color="error">
        No se pudo cargar la lista de casos.
      </Typography>
      <Button size="small" onClick={() => void refetch()}>
        Reintentar
      </Button>
    </Stack>
  );
};
