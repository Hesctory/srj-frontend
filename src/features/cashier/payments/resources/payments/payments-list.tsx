import {
  DataTable,
  FilterButton,
  List,
  TopToolbar,
  useCreatePath,
  useListContext,
  useRecordContext,
} from "react-admin";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import type { Payment } from "@/types/payment";
import { formatIsoDate, formatMoney } from "@/utils/money";
import OpenCaseLink from "@/features/cashier/recovery/components/open-case-link";
import {
  partyTypeLabel,
  tendersSummary,
} from "@/features/cashier/payments/utils/labels";
import { paymentFilters } from "./filters";

/**
 * Pagos — every payment taken at the counter, newest first, with who it was
 * for, how it was paid, its comprobante and whether a correction is open.
 */
export const PaymentsList = () => (
  <List
    debounce={500}
    filters={paymentFilters}
    sort={{ field: "id", order: "DESC" }}
    actions={
      <TopToolbar>
        <FilterButton />
      </TopToolbar>
    }
    empty={false}
    error={<ListFailed />}
  >
    <DataTable
      rowClick="show"
      bulkActionButtons={false}
      empty={<NothingHere />}
      rowSx={(record: Payment) => (record?.isVoided ? { opacity: 0.55 } : {})}
    >
      <DataTable.Col source="id" label="N.º">
        <Cell render={(p) => `${p.id}`} />
      </DataTable.Col>
      <DataTable.Col source="date" label="Fecha">
        <Cell render={(p) => formatIsoDate(p.date)} />
      </DataTable.Col>
      <DataTable.Col label="Pagador" sx={{ width: "100%" }}>
        <PartyCell />
      </DataTable.Col>
      <DataTable.Col source="amount" label="Monto" align="right">
        <Cell render={(p) => formatMoney(p.amount)} />
      </DataTable.Col>
      <DataTable.Col label="Medios de pago">
        <Cell render={(p) => tendersSummary(p.tenders) || "—"} />
      </DataTable.Col>
      <DataTable.Col label="Comprobante">
        <DocumentCell />
      </DataTable.Col>
      <DataTable.Col label="Estado">
        <StatusCell />
      </DataTable.Col>
      <DataTable.Col label="Corrección">
        <OpenCaseCell />
      </DataTable.Col>
    </DataTable>
  </List>
);

const Cell = ({ render }: { render: (payment: Payment) => string }) => {
  const record = useRecordContext<Payment>();
  return record ? (
    <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
      {render(record)}
    </Typography>
  ) : null;
};

const PartyCell = () => {
  const record = useRecordContext<Payment>();
  if (!record) return null;
  return record.partyName ? (
    <Box minWidth={0}>
      <Typography variant="body2" fontWeight={600}>
        {record.partyName}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {partyTypeLabel(record.partyTypeCode)}
      </Typography>
    </Box>
  ) : (
    <Typography variant="body2" color="text.disabled" fontStyle="italic">
      Sin nombre registrado
    </Typography>
  );
};

const DocumentCell = () => {
  const record = useRecordContext<Payment>();
  const createPath = useCreatePath();
  if (!record) return null;
  if (record.activeDocumentId === null)
    return (
      <Typography variant="body2" color="text.disabled">
        Sin comprobante
      </Typography>
    );
  return (
    <MuiLink
      component={Link}
      variant="body2"
      to={createPath({
        resource: "payment-documents",
        type: "show",
        id: record.activeDocumentId,
      })}
      onClick={(event: React.MouseEvent) => event.stopPropagation()}
    >
      {record.activeDocumentNumber ?? `N.º ${record.activeDocumentId}`}
    </MuiLink>
  );
};

const StatusCell = () => {
  const record = useRecordContext<Payment>();
  if (!record) return null;
  return (
    <Chip
      size="small"
      variant="outlined"
      color={record.isVoided ? "default" : "success"}
      label={record.isVoided ? "Anulado" : "Vigente"}
    />
  );
};

const OpenCaseCell = () => {
  const record = useRecordContext<Payment>();
  return record ? <OpenCaseLink caseId={record.openRecoveryCaseId} /> : null;
};

/** "Nothing exists" reads differently from "nothing matches". */
const NothingHere = () => {
  const { filterValues, setFilters } = useListContext();
  const narrowed = Object.values(filterValues).some(
    (v) => v != null && v !== "",
  );
  return (
    <Stack alignItems="flex-start" spacing={1} sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {narrowed
          ? "Ningún pago coincide con estos filtros."
          : "Aún no hay pagos registrados."}
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
        No se pudo cargar la lista de pagos.
      </Typography>
      <Button size="small" onClick={() => void refetch()}>
        Reintentar
      </Button>
    </Stack>
  );
};
