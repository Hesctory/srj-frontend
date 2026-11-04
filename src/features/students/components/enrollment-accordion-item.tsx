import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Form, Identifier } from "react-admin";
import { useFormState } from "react-hook-form";
import EnrollmentFormInputs from "./enrollment-form-inputs";
import EnrollmentReactivateDialog, {
  type ReactivationTerms,
} from "./enrollment-reactivate-dialog";
import EnrollmentRepriceDialog from "./enrollment-reprice-dialog";
import EnrollmentWithdrawDialog from "./enrollment-withdraw-dialog";
import { useEnrollmentDetail } from "@/features/students/hooks/use-enrollment-detail";
import {
  ENROLLMENT_STATE,
  changesPrice,
} from "@/features/students/utils/enrollment-update";
import type { EnrollmentSummary, UpdateEnrollment } from "@/types/enrollment";
import type { SettlementRefusal } from "./excess-settlement-fields";

type Values = Record<string, unknown>;

export interface SaveResult {
  saved: boolean;
  /** Messages for the fields the form shows. */
  errors?: Record<string, string>;
  /** Why the settlement asked in the reprice dialog was refused, for it to show. */
  settlementRefusal?: SettlementRefusal;
}

interface EnrollmentAccordionItemProps {
  enrollment: EnrollmentSummary;
  expanded: boolean;
  onExpandChange: (id: Identifier, expanding: boolean) => void;
  onSave: (
    id: Identifier,
    values: Values,
    previousData: Values,
    extra: Partial<UpdateEnrollment>,
    /** Whether the reprice dialog is open to show a refused settlement. */
    inDialog: boolean,
  ) => Promise<SaveResult>;
  onCancel: (id: Identifier, detail: Values) => Promise<void>;
  /** A refusal is thrown back, for the dialog to show. */
  onWithdraw: (
    id: Identifier,
    detail: Values,
    extra: Partial<UpdateEnrollment>,
  ) => Promise<void>;
  onReactivate: (
    id: Identifier,
    detail: Values,
    terms: ReactivationTerms,
  ) => Promise<Record<string, string> | undefined>;
}

/** Annulling and withdrawing act on the saved enrollment, not on the form. */
const UnsavedChangesHint = () => {
  const { isDirty } = useFormState();
  if (!isDirty) return null;
  return (
    <Typography variant="caption" color="text.secondary" sx={{ width: "100%" }}>
      Los cambios sin guardar no se aplican al anular ni al retirar.
    </Typography>
  );
};

export const EnrollmentAccordionItem = ({
  enrollment,
  expanded,
  onExpandChange,
  onSave,
  onCancel,
  onWithdraw,
  onReactivate,
}: EnrollmentAccordionItemProps) => {
  const [pendingDelete, setPendingDelete] = useState(false);
  const [annulling, setAnnulling] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [proposal, setProposal] = useState<Values | null>(null);
  const [saving, setSaving] = useState(false);
  const [settlementRefusal, setSettlementRefusal] = useState<
    SettlementRefusal | undefined
  >();
  // The submit stays pending while staff look at the new prices, so a field
  // error from the save still lands through the form's own return value.
  const decide = useRef<(extra: Partial<UpdateEnrollment> | undefined) => void>(
    () => undefined,
  );
  const { detail, isLoading, fetchDetail, updateDetail } = useEnrollmentDetail(
    enrollment.id,
  );

  useEffect(() => {
    if (expanded) fetchDetail();
    // A question left open must not greet them when the row is opened again.
    else setPendingDelete(false);
  }, [expanded, fetchDetail]);

  const isActive = enrollment.state === ENROLLMENT_STATE.active;
  const isCancelled = enrollment.state === ENROLLMENT_STATE.cancelled;
  const isWithdrawn = enrollment.state === ENROLLMENT_STATE.withdrawn;

  /** How the money given back is settled; `undefined` if they went back. */
  const askSettlement = (values: Values) =>
    new Promise<Partial<UpdateEnrollment> | undefined>((resolve) => {
      decide.current = resolve;
      setProposal(values);
    });

  const handleSave = async (values: Values) => {
    // Anything else is the API's to refuse: only an Activa takes a new price.
    const repricing = isActive && changesPrice(values, detail!);
    try {
      // A refusal on the settlement asks it again, the dialog still open.
      for (;;) {
        const extra = repricing ? await askSettlement(values) : {};
        if (extra === undefined) return;

        setSaving(true);
        setSettlementRefusal(undefined);
        try {
          const result = await onSave(
            enrollment.id,
            values,
            detail!,
            extra,
            repricing,
          );
          if (result.settlementRefusal) {
            setSettlementRefusal(result.settlementRefusal);
            continue;
          }
          if (result.saved) updateDetail({ ...detail, ...values });
          return result.errors;
        } finally {
          setSaving(false);
        }
      }
    } finally {
      setProposal(null);
      setSettlementRefusal(undefined);
    }
  };

  const annul = async () => {
    setAnnulling(true);
    try {
      await onCancel(enrollment.id, detail!);
    } finally {
      setAnnulling(false);
      setPendingDelete(false);
    }
  };

  const closeWithdrawal = () => {
    setWithdrawing(false);
    onExpandChange(enrollment.id, false);
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanding) => onExpandChange(enrollment.id, isExpanding)}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
          <Chip
            label={enrollment.year + " - " + enrollment.state}
            color={isCancelled ? "error" : isWithdrawn ? "warning" : "primary"}
            size="small"
          />
          <Typography
            color={
              isCancelled ? "error" : isWithdrawn ? "warning.main" : "inherit"
            }
          >
            {enrollment.grade} {enrollment.section}, {enrollment.level}{" "}
            {enrollment.shift}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : detail ? (
          <>
            {/* A new state starts from the saved enrollment: an edit left
                unsaved did not go with the change, so it must not stay shown. */}
            <Form
              key={enrollment.state}
              defaultValues={detail}
              onSubmit={handleSave}
            >
              <EnrollmentFormInputs editing />
              <Box
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
                mt={2}
              >
                {isCancelled || isWithdrawn ? (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => setReactivating(true)}
                  >
                    Reactivar
                  </Button>
                ) : pendingDelete ? (
                  <>
                    <Typography variant="body2" color="error">
                      ¿Anular la matrícula? Sus cobros salen de Caja.
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setPendingDelete(false)}
                      disabled={annulling}
                    >
                      No
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={annul}
                      disabled={annulling}
                    >
                      Sí
                    </Button>
                  </>
                ) : (
                  <>
                    {isActive && (
                      <>
                        <UnsavedChangesHint />
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          onClick={() => setPendingDelete(true)}
                          disabled={saving}
                        >
                          Anular
                        </Button>
                        <Button
                          size="small"
                          color="warning"
                          variant="contained"
                          onClick={() => setWithdrawing(true)}
                          disabled={saving}
                        >
                          Retirar
                        </Button>
                      </>
                    )}
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={saving}
                    >
                      Guardar cambios
                    </Button>
                  </>
                )}
              </Box>
            </Form>
            {/* Outside the form: a dialog's events bubble through its portal,
                and its own submit must not reach this form's. */}
            {proposal && (
              <EnrollmentRepriceDialog
                enrollmentId={enrollment.id}
                levelId={Number(proposal.levelId)}
                shiftId={Number(proposal.shiftId)}
                schoolFeeConceptId={Number(proposal.schoolFeeConceptId)}
                saving={saving}
                refusal={settlementRefusal}
                onSettlementChange={() => setSettlementRefusal(undefined)}
                onConfirm={(extra) => decide.current(extra)}
                onCancel={() => decide.current(undefined)}
              />
            )}
            {withdrawing && (
              <EnrollmentWithdrawDialog
                enrollmentId={enrollment.id}
                year={Number(enrollment.year)}
                onConfirm={(extra) => onWithdraw(enrollment.id, detail, extra)}
                onCancel={() => setWithdrawing(false)}
                onDone={closeWithdrawal}
              />
            )}
            {reactivating && (
              <EnrollmentReactivateDialog
                studentId={Number(detail.studentId)}
                values={detail}
                onConfirm={async (terms) => {
                  const errors = await onReactivate(
                    enrollment.id,
                    detail,
                    terms,
                  );
                  if (!errors) setReactivating(false);
                  return errors;
                }}
                onCancel={() => setReactivating(false)}
              />
            )}
          </>
        ) : null}
      </AccordionDetails>
    </Accordion>
  );
};
