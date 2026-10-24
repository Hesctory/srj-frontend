import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SendIcon from "@mui/icons-material/Send";
import ReplayIcon from "@mui/icons-material/Replay";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Show, Title, useRecordContext } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  ACQUIRER_DOCUMENT_TYPE_LABEL,
  isDeclarable,
  isInternalReceipt,
  type PaymentDocumentLine,
  type PaymentDocumentRecord,
} from "@/types/payment-document";
import { formatIsoDate, formatIsoDateTime, formatMoney } from "@/utils/money";
import useIssueDocument from "@/features/billing/hooks/use-issue-document";
import SunatStatusPill from "@/features/billing/components/sunat-status-pill";

/**
 * One comprobante: its lines on the left, its identity and acquirer on the
 * right, and whatever SUNAT has to say about it across the top.
 *
 * The dataProvider flattens `{ document, lines }` into a single record (see
 * `data-provider.ts`), so everything here reads off one object.
 *
 * `component="div"` drops the Card that `<Show>` wraps around its children by
 * default. This page is already built out of cards, and that outer one is
 * full-bleed: on a wide monitor it became a white sheet several hundred pixels
 * wider than its own content, with the real cards stranded in the middle of it.
 * Without it the cards sit on the app canvas and the page ends where the
 * content ends.
 */
export const PaymentDocumentShow = () => (
  <Show actions={false} emptyWhileLoading component="div">
    <PaymentDocumentBody />
  </Show>
);

const PaymentDocumentBody = () => {
  const record = useRecordContext<PaymentDocumentRecord>();
  const navigate = useNavigate();
  const flow = useIssueDocument();

  if (!record) return null;

  // A filing done from this page replaces what the record context holds.
  const document = flow.detail?.document ?? record;
  const lines = flow.detail?.lines ?? record.lines ?? [];
  const internal = isInternalReceipt(document);
  const rejected = document.sunatStatusCode === "REJECTED";

  const total = lines.reduce((sum, line) => sum + line.subtotal, 0);

  return (
    <Box width="100%" maxWidth={1280} mx="auto" pb={3}>
      <Title title={document.number} />

      {/* Header */}
      <Box
        component={Card}
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
        {/* `1 1 320px` so the identity block takes the whole row rather than
            being squeezed to a word per line once the actions no longer fit. */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          minWidth={0}
          sx={{ flex: "1 1 320px" }}
        >
          <Button
            onClick={() => navigate("/payment-documents")}
            startIcon={<ArrowBackIcon />}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            Volver
          </Button>
          <Box minWidth={0}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                textDecoration: document.isVoided ? "line-through" : undefined,
              }}
            >
              {document.number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {document.voucherTypeName} · Emitido el{" "}
              {formatIsoDate(document.issueDate)} ·{" "}
              {formatMoney(document.amount)}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
        >
          {document.isVoided ? (
            <SunatStatusPill code="NOT_APPLICABLE" label="Anulado" />
          ) : (
            <SunatStatusPill
              code={document.sunatStatusCode}
              label={document.sunatStatusName}
            />
          )}

          {isDeclarable(document) && (
            <Button
              variant="contained"
              color={rejected ? "error" : "primary"}
              startIcon={
                flow.isIssuing ? (
                  <CircularProgress size={16} color="inherit" />
                ) : rejected ? (
                  <ReplayIcon />
                ) : (
                  <SendIcon />
                )
              }
              disabled={flow.isIssuing}
              onClick={() => void flow.issue(document.id)}
            >
              {rejected ? "Reintentar envío" : "Enviar a SUNAT"}
            </Button>
          )}

          {document.link && (
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              href={document.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver en Nubefact
            </Button>
          )}
        </Stack>
      </Box>

      {flow.error && (
        <Alert severity="error" onClose={flow.dismissError} sx={{ mb: 2 }}>
          <AlertTitle>No se pudo enviar</AlertTitle>
          {flow.error.message}
        </Alert>
      )}

      {/* SUNAT's own words, verbatim. */}
      {rejected && document.sunatMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>SUNAT rechazó este comprobante</AlertTitle>
          <Box
            component="code"
            sx={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.8125rem",
              display: "block",
              mb: 0.75,
            }}
          >
            {document.sunatMessage}
          </Box>
          Es el texto que devolvió SUNAT, tal cual. Corregido el dato en origen,
          se reenvía sin generar un comprobante nuevo.
        </Alert>
      )}

      {/* Two columns only from `lg`. At `md` the sidebar plus a 380px aside
          left the lines barely 200px wide — narrower than they are stacked. */}
      <Box
        display="grid"
        gap={3}
        gridTemplateColumns={{
          xs: "minmax(0, 1fr)",
          lg: "minmax(0, 1fr) minmax(300px, 360px)",
        }}
        alignItems="start"
      >
        {/* Lines */}
        <Box component="section" minWidth={0}>
          <SectionHeading>Detalle del comprobante</SectionHeading>
          <DocumentLines lines={lines} total={total} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1.5, lineHeight: 1.5 }}
          >
            Los descuentos son líneas propias, en negativo, y repiten la
            obligación que reducen: el mismo N.º de obligación aparece dos veces
            a propósito. El total del comprobante no tiene por qué igualar lo
            cobrado al pagador — la comisión de tarjeta no forma parte del
            documento.
          </Typography>
        </Box>

        {/* Identity + acquirer */}
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <SectionHeading>Datos del comprobante</SectionHeading>
              <KeyValue label="Tipo" value={document.voucherTypeName} />
              <KeyValue
                label="Serie · correlativo"
                value={`${document.series} · ${document.correlative}`}
              />
              {!internal && (
                <KeyValue
                  label="Código SUNAT"
                  value={document.sunatVoucherCode ?? "—"}
                />
              )}
              <KeyValue
                label="Forma de pago"
                value={
                  document.paymentForm === "credito"
                    ? "Crédito"
                    : document.paymentForm === "contado"
                      ? "Contado"
                      : "—"
                }
              />
              <KeyValue
                label="Emisión"
                value={formatIsoDate(document.issueDate)}
              />
              <KeyValue
                label="Vencimiento"
                value={formatIsoDate(document.dueDate)}
              />
              <KeyValue
                label="Pago de origen"
                value={
                  document.paymentId === null
                    ? "—"
                    : `N.º ${document.paymentId}`
                }
              />
              <KeyValue
                label="Registrado"
                value={formatIsoDateTime(document.createdAt)}
                last
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <SectionHeading>Adquirente</SectionHeading>
              {document.acquirerFullName || document.acquirerDocumentNumber ? (
                <>
                  <KeyValue
                    label="Documento"
                    value={
                      document.acquirerDocumentType !== null &&
                      document.acquirerDocumentNumber
                        ? `${ACQUIRER_DOCUMENT_TYPE_LABEL[document.acquirerDocumentType] ?? "Doc."} ${document.acquirerDocumentNumber}`
                        : "—"
                    }
                  />
                  <KeyValue
                    label="Nombre"
                    value={document.acquirerFullName ?? "—"}
                    last
                  />
                </>
              ) : (
                <Typography
                  variant="body2"
                  color="text.disabled"
                  fontStyle="italic"
                >
                  Sin adquirente registrado
                </Typography>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1, lineHeight: 1.5 }}
              >
                Un comprobante sin adquirente es la causa más común de un
                rechazo de SUNAT.
              </Typography>
            </CardContent>
          </Card>

          {internal && (
            <Card>
              <CardContent>
                <SectionHeading>Sin relación con SUNAT</SectionHeading>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  lineHeight={1.6}
                >
                  Un recibo interno no se declara ni tiene enlace a Nubefact: es
                  un documento de la institución. Por eso esta ficha no muestra
                  código SUNAT, ni estado, ni acción de envío.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

// ---- lines -----------------------------------------------------------------

/** Fixed columns, kept lean enough to survive the two-column layout at `lg`. */
const LINE_GRID = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 56px 100px 116px",
  gap: 1.5,
  px: 2,
} as const;

/**
 * The lines of the comprobante.
 *
 * Four columns is the right shape for the data and the wrong shape for a phone:
 * 272px of fixed numeric columns leaves the description a word per line and
 * still pushes «Importe» off the screen. Below `sm` the same three numbers are
 * restated as one line of prose under the description, with only the subtotal
 * kept in its own column — the number people actually scan down.
 */
const DocumentLines = ({
  lines,
  total,
}: {
  lines: PaymentDocumentLine[];
  total: number;
}) => {
  const compact = useMediaQuery<Theme>((theme) => theme.breakpoints.down("sm"));

  return (
    <Card>
      {!compact && (
        <Box
          sx={{
            ...LINE_GRID,
            py: 1,
            backgroundColor: "action.hover",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <ColumnLabel>Descripción</ColumnLabel>
          <ColumnLabel align="right">Cant.</ColumnLabel>
          <ColumnLabel align="right">P. unitario</ColumnLabel>
          <ColumnLabel align="right">Importe</ColumnLabel>
        </Box>
      )}

      {lines.map((line) => (
        <Box
          key={line.id}
          sx={{
            ...(compact
              ? {
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 1.5,
                  px: 2,
                }
              : LINE_GRID),
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box minWidth={0}>
            <Typography variant="body2">{line.description}</Typography>
            {line.obligationId !== null && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                Obligación N.º {line.obligationId}
              </Typography>
            )}
            {compact && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {line.quantity} × {formatMoney(line.unitPrice)}
              </Typography>
            )}
          </Box>
          {!compact && <Money value={line.quantity} raw />}
          {!compact && <Money value={line.unitPrice} />}
          <Money value={line.subtotal} />
        </Box>
      ))}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          px: 2,
          py: 1.5,
          backgroundColor: "action.hover",
        }}
      >
        <Typography variant="subtitle2">Total</Typography>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
        >
          {formatMoney(total)}
        </Typography>
      </Box>
    </Card>
  );
};

// ---- small pieces ----------------------------------------------------------

const SectionHeading = ({ children }: { children: string }) => (
  <Typography
    variant="overline"
    component="h3"
    color="text.secondary"
    sx={{ display: "block", letterSpacing: "0.08em", mb: 1 }}
  >
    {children}
  </Typography>
);

const ColumnLabel = ({
  children,
  align,
}: {
  children: string;
  align?: "right";
}) => (
  <Typography
    variant="caption"
    color="text.secondary"
    fontWeight={600}
    textAlign={align}
  >
    {children}
  </Typography>
);

/** Discount lines are negative; they read in red so the sign is not the only cue. */
const Money = ({ value, raw }: { value: number; raw?: boolean }) => (
  <Typography
    variant="body2"
    textAlign="right"
    color={value < 0 ? "error.main" : undefined}
    sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
  >
    {raw ? value : formatMoney(value)}
  </Typography>
);

const KeyValue = ({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => (
  <>
    <Box display="flex" justifyContent="space-between" gap={2} py={0.75}>
      <Typography variant="body2" color="text.secondary" flexShrink={0}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        textAlign="right"
        sx={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </Typography>
    </Box>
    {!last && <Divider />}
  </>
);
