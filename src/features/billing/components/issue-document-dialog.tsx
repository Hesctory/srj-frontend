import { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Radio,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";
import type { PendingPaymentDocument } from "@/types/payment";
import {
  PAYER_RELATIONSHIPS,
  PAYER_RELATIONSHIP_LABEL,
  type PayerRelationship,
} from "@/types/payment-document";
import { daysSince, formatAge, formatMoney } from "@/utils/money";
import { usePendingPayments } from "@/features/billing/hooks/use-pending-payments";
import useIssueDocument from "@/features/billing/hooks/use-issue-document";
import SunatStatusPill from "./sunat-status-pill";

/**
 * Issuing a comprobante, start to finish, in one dialog.
 *
 * There is no confirmation step between picking a payment and generating: apart
 * from the optional payer note, the request accepts nothing but a `paymentId`,
 * so a review screen would have had nothing on it to review. Choosing *is*
 * confirming.
 *
 * `paymentId` skips the picker entirely — that is the path from the payment
 * receipt, where the payment is already known.
 */

interface IssueDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  /** Known payment: generate straight away, no list. */
  paymentId?: number;
  /** Shown alongside the number when the caller knows it. */
  payerName?: string | null;
}

/** Past this many days waiting, the row starts arguing for itself. */
const STALE_DAYS = 3;

const IssueDocumentDialog = ({
  open,
  onClose,
  paymentId,
  payerName,
}: IssueDocumentDialogProps) => {
  const preselected = paymentId !== undefined;
  const navigate = useNavigate();

  const {
    rows,
    isLoading,
    error: loadError,
  } = usePendingPayments(open && !preselected);
  const [picked, setPicked] = useState<number | null>(paymentId ?? null);
  // `""` is "no payer note" — the field is optional, so nothing is preselected.
  const [relationship, setRelationship] = useState<PayerRelationship | "">("");
  const [otherPayerName, setOtherPayerName] = useState("");
  const flow = useIssueDocument();

  // Each opening starts clean: a document generated last time must not greet
  // the next payment, and neither must last time's payer note.
  useEffect(() => {
    if (open) {
      flow.reset();
      setPicked(paymentId ?? null);
      setRelationship("");
      setOtherPayerName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paymentId]);

  const document = flow.detail?.document ?? null;

  /** «Otro» is the one relationship that does not name itself. */
  const missingPayerName =
    relationship === "OTRO" && otherPayerName.trim() === "";

  const handleGenerate = () => {
    if (picked === null || missingPayerName) return;
    void flow.generate({
      paymentId: picked,
      payerRelationship: relationship || undefined,
      payerName: otherPayerName,
    });
  };

  const title = document ? "Comprobante generado" : "Generar comprobante";

  return (
    <Dialog
      open={open}
      onClose={flow.isGenerating || flow.isIssuing ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="h6" component="span">
          {title}
        </Typography>
        {!document && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {preselected
              ? "La serie, el correlativo, el adquirente y las líneas los determina el sistema a partir del pago."
              : "Elige el pago que se va a facturar."}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {flow.error && (
          <Alert
            severity={flow.error.isConflict ? "warning" : "error"}
            onClose={flow.dismissError}
            sx={{ mb: 2 }}
          >
            <AlertTitle>No se pudo continuar</AlertTitle>
            {flow.error.message}
          </Alert>
        )}

        {document ? (
          <GeneratedDocument
            number={document.number}
            voucherTypeName={document.voucherTypeName}
            acquirerFullName={document.acquirerFullName}
            amount={document.amount}
            sunatStatusName={document.sunatStatusName}
            sunatStatusCode={document.sunatStatusCode}
          />
        ) : preselected ? (
          <PreselectedPayment paymentId={paymentId!} payerName={payerName} />
        ) : (
          <PendingList
            rows={rows}
            isLoading={isLoading}
            hasError={Boolean(loadError)}
            picked={picked}
            onPick={setPicked}
          />
        )}

        {/* Only once there is a payment to annotate — never over the empty state. */}
        {!document && picked !== null && (
          <PayerNote
            relationship={relationship}
            name={otherPayerName}
            onRelationshipChange={setRelationship}
            onNameChange={setOtherPayerName}
            disabled={flow.isGenerating}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {document ? (
          <>
            <Button onClick={onClose} disabled={flow.isIssuing}>
              Cerrar
            </Button>
            <Button
              variant="outlined"
              disabled={flow.isIssuing}
              onClick={() => {
                onClose();
                navigate(`/payment-documents/${document.id}/show`);
              }}
            >
              Ver el comprobante
            </Button>
            {/* A recibo interno is never declared, so there is nothing to send. */}
            {document.sunatStatusCode !== "NOT_APPLICABLE" && (
              <Button
                variant="contained"
                disabled={flow.isIssuing}
                startIcon={
                  flow.isIssuing ? <CircularProgress size={16} /> : null
                }
                onClick={() => void flow.issue(document.id)}
              >
                Enviar a SUNAT
              </Button>
            )}
          </>
        ) : (
          <>
            <Button onClick={onClose} disabled={flow.isGenerating}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={
                picked === null || missingPayerName || flow.isGenerating
              }
              startIcon={
                flow.isGenerating ? <CircularProgress size={16} /> : null
              }
            >
              Generar comprobante
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ---- steps -----------------------------------------------------------------

const PreselectedPayment = ({
  paymentId,
  payerName,
}: {
  paymentId: number;
  payerName?: string | null;
}) => (
  <Alert severity="info" icon={false}>
    <AlertTitle sx={{ mb: 0.25 }}>Pago N.º {paymentId}</AlertTitle>
    {payerName ?? "Sin nombre registrado"}
  </Alert>
);

/**
 * Who paid, as an observation on the comprobante. Optional throughout: the
 * select opens on «Sin indicar», which sends no note at all.
 *
 * Only «Otro» reveals the name field, and only then is a name required — the
 * other three relationships already say who paid.
 */
const PayerNote = ({
  relationship,
  name,
  onRelationshipChange,
  onNameChange,
  disabled,
}: {
  relationship: PayerRelationship | "";
  name: string;
  onRelationshipChange: (value: PayerRelationship | "") => void;
  onNameChange: (value: string) => void;
  disabled: boolean;
}) => (
  <Box mt={2.5}>
    <Typography variant="subtitle2">Quién pagó (opcional)</Typography>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: "block", mb: 1.5 }}
    >
      Se registra como observación en el comprobante. No cambia el adquirente.
    </Typography>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
      <TextField
        select
        size="small"
        label="Pagó"
        value={relationship}
        onChange={(event) =>
          onRelationshipChange(event.target.value as PayerRelationship | "")
        }
        disabled={disabled}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">Sin indicar</MenuItem>
        {PAYER_RELATIONSHIPS.map((value) => (
          <MenuItem key={value} value={value}>
            {PAYER_RELATIONSHIP_LABEL[value]}
          </MenuItem>
        ))}
      </TextField>
      {relationship === "OTRO" && (
        <TextField
          size="small"
          fullWidth
          required
          label="Nombre de quien pagó"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          disabled={disabled}
          helperText="Obligatorio con «Otro». Se escribe tal cual en el comprobante."
        />
      )}
    </Stack>
  </Box>
);

const PendingList = ({
  rows,
  isLoading,
  hasError,
  picked,
  onPick,
}: {
  rows: PendingPaymentDocument[];
  isLoading: boolean;
  hasError: boolean;
  picked: number | null;
  onPick: (id: number) => void;
}) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (hasError) {
    return (
      <Alert severity="error">
        No se pudo cargar la lista de pagos pendientes.
      </Alert>
    );
  }

  if (rows.length === 0) {
    return (
      <Box textAlign="center" py={5} px={3}>
        <CheckCircleIcon color="success" sx={{ fontSize: 44 }} />
        <Typography variant="h6" sx={{ mt: 1 }}>
          No hay pagos por facturar
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, mx: "auto", maxWidth: 420 }}
        >
          Todos los pagos registrados ya tienen su comprobante. Este es el
          estado normal: los comprobantes se emiten al cobrar.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 1 }}
      >
        Solo aparecen los pagos que todavía no tienen comprobante. Los más
        antiguos van primero.
      </Typography>
      <Stack
        divider={<Divider flexItem />}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {rows.map((row) => {
          const stale = daysSince(row.createdAt) >= STALE_DAYS;
          const selected = picked === row.paymentId;
          return (
            <Box
              key={row.paymentId}
              onClick={() => onPick(row.paymentId)}
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "36px 1fr",
                  sm: "36px 92px minmax(0, 1fr) 110px 140px",
                },
                alignItems: "center",
                gap: 1.5,
                px: 1.5,
                py: 1,
                cursor: "pointer",
                backgroundColor: selected ? "action.selected" : undefined,
                "&:hover": { backgroundColor: "action.hover" },
              }}
            >
              <Radio size="small" checked={selected} sx={{ p: 0.5 }} />
              <Typography variant="body2" fontWeight={600} noWrap>
                N.º {row.paymentId}
              </Typography>
              <Typography
                variant="body2"
                noWrap
                color={row.payerName ? "text.primary" : "text.disabled"}
                fontStyle={row.payerName ? undefined : "italic"}
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {row.payerName ?? "Sin nombre registrado"}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                textAlign="right"
                sx={{
                  fontVariantNumeric: "tabular-nums",
                  display: { xs: "none", sm: "block" },
                }}
              >
                {formatMoney(row.amount)}
              </Typography>
              <Typography
                variant="body2"
                textAlign="right"
                color={stale ? "error.main" : "text.secondary"}
                fontWeight={stale ? 600 : 400}
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {formatAge(row.createdAt)}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </>
  );
};

const GeneratedDocument = ({
  number,
  voucherTypeName,
  acquirerFullName,
  amount,
  sunatStatusName,
  sunatStatusCode,
}: {
  number: string;
  voucherTypeName: string;
  acquirerFullName: string | null;
  amount: number;
  sunatStatusName: string;
  sunatStatusCode: string;
}) => (
  <Box display="flex" gap={2} alignItems="flex-start" py={1}>
    <CheckCircleIcon color="success" sx={{ fontSize: 28 }} />
    <Box minWidth={0}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
      >
        {number}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
        {voucherTypeName} · {acquirerFullName ?? "Sin adquirente registrado"} ·{" "}
        {formatMoney(amount)}
      </Typography>
      <Box mt={1.5}>
        <SunatStatusPill code={sunatStatusCode} label={sunatStatusName} />
      </Box>
      {sunatStatusCode !== "NOT_APPLICABLE" && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1.5, lineHeight: 1.5 }}
        >
          Falta declararlo. Si cierras, queda en la pestaña «Observados» y se
          puede enviar desde ahí sin volver a generarlo.
        </Typography>
      )}
    </Box>
  </Box>
);

export default IssueDocumentDialog;
