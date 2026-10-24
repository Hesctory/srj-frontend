import { useMemo, useState } from "react";
import { Box, Button, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SendIcon from "@mui/icons-material/Send";
import ReplayIcon from "@mui/icons-material/Replay";
import {
  DataTable,
  DateField,
  List,
  NumberField,
  TextField,
  useRecordContext,
} from "react-admin";
import type { PaymentDocument } from "@/types/payment-document";
import { isDeclarable } from "@/types/payment-document";
import { usePendingPaymentsCount } from "@/features/billing/hooks/use-pending-payments";
import useIssueDocument from "@/features/billing/hooks/use-issue-document";
import IssueDocumentDialog from "@/features/billing/components/issue-document-dialog";
import SunatStatusChip from "@/features/billing/components/sunat-status-chip";
import AcquirerField from "@/features/billing/components/acquirer-field";
import { paymentDocumentFilters } from "./filters";
import PaymentDocumentsListToolbar from "./payment-documents-list-toolbar";
import {
  PAYMENT_DOCUMENT_TABS,
  tabByKey,
  type PaymentDocumentTabKey,
} from "./tabs";

/**
 * Comprobantes de Pago — the whole collection, school receipts and electronic
 * vouchers alike, on one page.
 *
 * The two kinds differ by one field, not by endpoint, so splitting them across
 * two routes would have bought two filter states, two paginations and one
 * detail page with two parents. Instead the tab strip presets
 * `sunatStatusCode` (an array in the contract, so all four presets are
 * server-side) and each tab decides which columns are worth their width.
 *
 * The tab lives in component state rather than the URL because it is a lens on
 * one list, not a different list; RA keeps the user's own filters across tab
 * changes, which is the point.
 */
export const PaymentDocumentsList = () => {
  const [tabKey, setTabKey] = useState<PaymentDocumentTabKey>("all");
  const [issueOpen, setIssueOpen] = useState(false);
  const pendingCount = usePendingPaymentsCount();

  const tab = useMemo(() => tabByKey(tabKey), [tabKey]);

  return (
    <>
      <Tabs
        value={tabKey}
        onChange={(_, value) => setTabKey(value as PaymentDocumentTabKey)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: "divider", minHeight: 44 }}
      >
        {PAYMENT_DOCUMENT_TABS.map((entry) => (
          <Tab key={entry.key} value={entry.key} label={entry.label} />
        ))}
      </Tabs>

      <List
        debounce={500}
        // `filter` is the tab's contribution; whatever the user picks in the
        // filter bar is merged on top of it by React Admin.
        filter={
          tab.sunatStatusCode ? { sunatStatusCode: tab.sunatStatusCode } : {}
        }
        filters={paymentDocumentFilters}
        filterDefaultValues={{ includeVoided: false }}
        sort={{ field: "issueDate", order: "DESC" }}
        actions={
          <PaymentDocumentsListToolbar
            pendingCount={pendingCount}
            onIssueClick={() => setIssueOpen(true)}
          />
        }
        empty={false}
      >
        <DataTable rowClick="show" rowSx={rowSx}>
          <DataTable.Col source="number" label="Número">
            <DocumentNumberField />
          </DataTable.Col>
          {/* «Boleta de Venta Electrónica» was wrapping onto three lines and
              tripling every row's height while the table had space to spare.
              Left wrapping on `xs`, where the table scrolls sideways anyway and
              a longer row only means more scrolling. */}
          <DataTable.Col
            source="voucherTypeCode"
            label="Tipo"
            sx={{ whiteSpace: { xs: "normal", sm: "nowrap" } }}
          >
            <TextField source="voucherTypeName" />
          </DataTable.Col>
          <DataTable.Col source="issueDate" label="Emisión">
            <DateField source="issueDate" />
          </DataTable.Col>
          {/* The one free-text column, so it takes the slack a wide monitor
              leaves over instead of the table trailing off to the left. */}
          <DataTable.Col
            source="acquirerFullName"
            label="Adquirente"
            sx={{ width: "100%" }}
          >
            <AcquirerField />
          </DataTable.Col>
          <DataTable.Col source="amount" label="Importe" align="right">
            <NumberField
              source="amount"
              options={{ style: "currency", currency: "PEN" }}
            />
          </DataTable.Col>
          {tab.showSunat && (
            <DataTable.Col source="sunatStatusCode" label="SUNAT">
              <SunatStatusChip />
            </DataTable.Col>
          )}
          {tab.showReason && (
            <DataTable.Col label="Motivo">
              <SunatReasonField />
            </DataTable.Col>
          )}
          <DataTable.Col source="paymentId" label="Pago">
            <PaymentReferenceField />
          </DataTable.Col>
          {/* `width: 1` here read as `100%` in MUI's system, which handed the
              empty action column every spare pixel on a wide screen. `1px`
              makes it hug its button instead. */}
          {tab.showSunat && (
            <DataTable.Col
              label=""
              align="right"
              sx={{ width: "1px", whiteSpace: "nowrap" }}
            >
              <RowActions />
            </DataTable.Col>
          )}
        </DataTable>
      </List>

      <IssueDocumentDialog
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
      />
    </>
  );
};

/** A voided document stays readable but stops looking live. */
const rowSx = (record: PaymentDocument) =>
  record?.isVoided ? { opacity: 0.55 } : {};

const DocumentNumberField = () => {
  const record = useRecordContext<PaymentDocument>();
  if (!record) return null;
  return (
    <Box minWidth={0}>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{
          fontVariantNumeric: "tabular-nums",
          textDecoration: record.isVoided ? "line-through" : undefined,
        }}
        noWrap
      >
        {record.number}
      </Typography>
      {record.isVoided && (
        <Typography variant="caption" color="text.secondary">
          Anulado
        </Typography>
      )}
    </Box>
  );
};

/**
 * SUNAT's own words, verbatim and monospaced. Paraphrasing would break the one
 * thing a person does with it: searching the error code.
 */
const SunatReasonField = () => {
  const record = useRecordContext<PaymentDocument>();
  if (!record) return null;

  if (!record.sunatMessage) {
    return (
      <Typography variant="body2" color="text.disabled" fontStyle="italic">
        {record.sunatStatusCode === "PENDING"
          ? "Todavía no se ha enviado"
          : "—"}
      </Typography>
    );
  }

  return (
    <Tooltip title={record.sunatMessage}>
      <Typography
        variant="caption"
        color="error.main"
        sx={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          lineHeight: 1.4,
        }}
      >
        {record.sunatMessage}
      </Typography>
    </Tooltip>
  );
};

/**
 * Plain text, not a link: the backend exposes no way to browse or open a single
 * payment, so there is nothing to navigate to. It still earns its column —
 * it is how a document is tied back to the money for reconciliation.
 */
const PaymentReferenceField = () => {
  const record = useRecordContext<PaymentDocument>();
  if (!record) return null;
  return record.paymentId === null ? (
    <Typography variant="body2" color="text.disabled">
      —
    </Typography>
  ) : (
    <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
      N.º {record.paymentId}
    </Typography>
  );
};

/**
 * One action per row, chosen by status: file it, retry it, or open it in
 * Nubefact. Anything else — accepted with no link, voided, internal — gets no
 * button rather than a disabled one.
 */
const RowActions = () => {
  const record = useRecordContext<PaymentDocument>();
  const flow = useIssueDocument();
  if (!record) return null;

  if (isDeclarable(record)) {
    const isRetry = record.sunatStatusCode === "REJECTED";
    return (
      <Button
        size="small"
        variant="outlined"
        color={isRetry ? "error" : "primary"}
        startIcon={isRetry ? <ReplayIcon /> : <SendIcon />}
        disabled={flow.isIssuing}
        onClick={(event) => {
          // The row itself navigates to the document; this button must not.
          event.stopPropagation();
          void flow.issue(record.id);
        }}
      >
        {isRetry ? "Reintentar" : "Enviar a SUNAT"}
      </Button>
    );
  }

  if (record.link) {
    return (
      <Button
        size="small"
        startIcon={<OpenInNewIcon />}
        href={record.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        Ver en Nubefact
      </Button>
    );
  }

  return null;
};
