import { useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DescriptionIcon from "@mui/icons-material/Description";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import { useGetList } from "react-admin";
import type { PaymentMethod } from "@/types/payment";
import { IssueDocumentDialog } from "@/features/billing";
import ChargeDetailsPanel from "./charge-details-panel";
import PaymentPlanReview from "./payment-plan-review";
import PaymentReceipt from "./payment-receipt";
import TenderLinesEditor from "./tender-lines-editor";
import useCountdown from "@/features/cashier/tuition/hooks/use-countdown";
import usePaymentDraft from "@/features/cashier/tuition/hooks/use-payment-draft";
import type { PaymentDrawerState } from "@/features/cashier/tuition/hooks/use-payment-drawer";
import usePaymentFlow from "@/features/cashier/tuition/hooks/use-payment-flow";

interface PaymentDrawerProps {
  state: PaymentDrawerState;
  /** Scope when the target names no obligations — the server allocates oldest-first. */
  enrollmentId: number;
  /** The statement's `asOf`: the server's today, and the default operative date. */
  asOf: string | null;
  onClose: () => void;
  /** Fired once the drawer has finished sliding out. */
  onExited: () => void;
}

const TITLE_ID = "payment-drawer-title";

/**
 * The payment panel: charge details, or the two-step collect flow.
 *
 * Everything lives in one drawer rather than a drawer plus a modal. Registering
 * a payment is `preview → confirm`, and stacking a dialog on top of a drawer to
 * show the plan means two focus traps, two escape targets and a review step the
 * cashier cannot walk back from without losing the form.
 */
const PaymentDrawer = ({
  state,
  enrollmentId,
  asOf,
  onClose,
  onExited,
}: PaymentDrawerProps) => (
  <Drawer
    anchor="right"
    open={state.open}
    onClose={onClose}
    SlideProps={{ onExited }}
    PaperProps={{
      role: "dialog",
      "aria-modal": true,
      "aria-labelledby": TITLE_ID,
      sx: {
        width: { xs: "100%", sm: 480, lg: 560 },
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
      },
    }}
  >
    {state.mode && (
      <PaymentDrawerBody
        key={state.openId}
        state={state}
        enrollmentId={enrollmentId}
        asOf={asOf}
        onClose={onClose}
      />
    )}
  </Drawer>
);

/**
 * Mounted fresh on every opening (keyed by `openId`), so the draft, the plan
 * and any error die with the drawer instead of leaking into the next charge.
 */
const PaymentDrawerBody = ({
  state,
  enrollmentId,
  asOf,
  onClose,
}: Omit<PaymentDrawerProps, "onExited">) => {
  const { mode, target, charge } = state;
  const [showErrors, setShowErrors] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);

  const draft = usePaymentDraft(target?.outstanding ?? 0, asOf ?? "");
  const flow = usePaymentFlow(
    target?.obligationIds
      ? { obligationIds: target.obligationIds }
      : { enrollmentId },
  );
  const secondsLeft = useCountdown(flow.preview?.expiresAt ?? null);
  const expired = flow.step === "review" && secondsLeft === 0;

  // The catalogue order puts Efectivo first, which is the order a cashier
  // reaches for; alphabetical would bury it under "Plin" and "Transferencia".
  const { data: methods, isLoading: loadingMethods } =
    useGetList<PaymentMethod>("payment-methods", {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "id", order: "ASC" },
    });

  const handlePreview = () => {
    if (!draft.lines) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    flow.runPreview({ date: draft.date || undefined, lines: draft.lines });
  };

  const title =
    mode === "details"
      ? "Detalle del cargo"
      : flow.step === "review"
        ? "Revisar el plan de pago"
        : flow.step === "done"
          ? "Pago registrado"
          : "Registrar pago";

  const stepHint =
    mode !== "pay" || flow.step === "done"
      ? null
      : flow.step === "compose"
        ? // "Datos del cobro" only restated the title above it. The step-2 half
          // stays: that nothing is written yet is the opposite of obvious.
          "Paso 1 de 2"
        : "Paso 2 de 2 · Nada se ha registrado todavía";

  return (
    <>
      <Box
        component="header"
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box flex={1} minWidth={0}>
          <Typography id={TITLE_ID} variant="h6" component="h2">
            {title}
          </Typography>
          {stepHint && (
            <Typography variant="caption" color="text.secondary">
              {stepHint}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          aria-label="Cerrar el panel"
          disabled={flow.isConfirming}
          sx={{ p: 1.25 }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          px: { xs: 2, sm: 3 },
          py: 3,
        }}
      >
        {flow.error && (
          <Alert
            severity={flow.error.isStale ? "warning" : "error"}
            onClose={flow.dismissError}
            sx={{ mb: 3 }}
          >
            <AlertTitle>No se pudo continuar</AlertTitle>
            {flow.error.message}
            {Object.entries(flow.error.fieldErrors).length > 0 && (
              <Box component="ul" sx={{ pl: 2.5, m: 0, mt: 1 }}>
                {Object.entries(flow.error.fieldErrors).map(
                  ([field, message]) => (
                    <li key={field}>{message}</li>
                  ),
                )}
              </Box>
            )}
          </Alert>
        )}

        {mode === "details" && charge && <ChargeDetailsPanel charge={charge} />}

        {mode === "pay" && target && flow.step === "compose" && (
          <TenderLinesEditor
            draft={draft}
            target={target}
            methods={methods ?? []}
            loadingMethods={loadingMethods}
            showErrors={showErrors}
          />
        )}

        {mode === "pay" && flow.step === "review" && flow.preview && (
          <PaymentPlanReview preview={flow.preview} secondsLeft={secondsLeft} />
        )}

        {mode === "pay" && flow.step === "done" && flow.receipt && (
          <PaymentReceipt receipt={flow.receipt} />
        )}
      </Box>

      <Box
        component="footer"
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        {mode === "details" && (
          <Button variant="contained" onClick={onClose}>
            Cerrar
          </Button>
        )}

        {mode === "pay" && flow.step === "compose" && (
          <>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handlePreview}
              disabled={flow.isPreviewing || loadingMethods}
              startIcon={
                flow.isPreviewing ? <CircularProgress size={16} /> : null
              }
            >
              Calcular plan
            </Button>
          </>
        )}

        {mode === "pay" && flow.step === "review" && (
          <>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={flow.editDraft}
              disabled={flow.isConfirming}
            >
              Volver a editar
            </Button>
            <Button
              variant="contained"
              onClick={flow.confirm}
              disabled={flow.isConfirming || expired}
              startIcon={
                flow.isConfirming ? (
                  <CircularProgress size={16} />
                ) : (
                  <ReceiptLongIcon />
                )
              }
            >
              Confirmar pago
            </Button>
          </>
        )}

        {/* The loop closes here when it can. Issuing needs no picker — the
            payment is already known — so this is one click, and the wording of
            the secondary button says what walking away costs. When the payment
            owes no comprobante there is nothing to ask, so only "Cerrar"
            remains. */}
        {mode === "pay" && flow.step === "done" && flow.receipt && (
          <>
            {flow.receipt.requiresPaymentDocument ? (
              <>
                <Button onClick={onClose}>Cerrar sin emitir</Button>
                <Button
                  variant="contained"
                  startIcon={<DescriptionIcon />}
                  onClick={() => setIssueOpen(true)}
                >
                  Emitir comprobante
                </Button>
              </>
            ) : (
              <Button variant="contained" onClick={onClose}>
                Cerrar
              </Button>
            )}
          </>
        )}
      </Box>

      {flow.receipt && (
        <IssueDocumentDialog
          open={issueOpen}
          onClose={() => setIssueOpen(false)}
          paymentId={flow.receipt.id}
        />
      )}
    </>
  );
};

export default PaymentDrawer;
