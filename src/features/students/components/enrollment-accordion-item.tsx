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
import { EnrollmentSummary } from "@/types/enrollment";

type Values = Record<string, unknown>;

export interface SaveResult {
  saved: boolean;
  /** Messages for the fields the form shows. */
  errors?: Record<string, string>;
}

interface EnrollmentAccordionItemProps {
  enrollment: EnrollmentSummary;
  expanded: boolean;
  onExpandChange: (id: Identifier, expanding: boolean) => void;
  onSave: (
    id: Identifier,
    values: Values,
    previousData: Values,
    repriceFromMonth: number | null,
  ) => Promise<SaveResult>;
  onCancel: (id: Identifier, detail: Values) => Promise<void>;
  /** A refusal is thrown back, for the dialog to show. */
  onWithdraw: (
    id: Identifier,
    detail: Values,
    withdrawalDate: string,
  ) => Promise<void>;
  onReactivate: (
    id: Identifier,
    detail: Values,
    terms: ReactivationTerms,
  ) => Promise<Record<string, string> | undefined>;
}

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
  // The submit stays pending while staff choose the month, so a field error
  // from the save still lands through the form's own return value.
  const decide = useRef<(month: number | null | undefined) => void>(
    () => undefined,
  );
  const { detail, isLoading, fetchDetail, updateDetail } = useEnrollmentDetail(
    enrollment.id,
  );

  useEffect(() => {
    if (expanded) fetchDetail();
  }, [expanded, fetchDetail]);

  const isActive = enrollment.state === ENROLLMENT_STATE.active;
  const isCancelled = enrollment.state === ENROLLMENT_STATE.cancelled;
  const isWithdrawn = enrollment.state === ENROLLMENT_STATE.withdrawn;

  /** The month the new price starts from; `undefined` if they went back. */
  const askMonth = (values: Values) =>
    new Promise<number | null | undefined>((resolve) => {
      decide.current = resolve;
      setProposal(values);
    });

  const handleSave = async (values: Values) => {
    let repriceFromMonth: number | null = null;
    // Anything else is the API's to refuse: only an Activa takes a new price.
    if (isActive && changesPrice(values, detail!)) {
      const month = await askMonth(values);
      if (month === undefined) {
        setProposal(null);
        return;
      }
      repriceFromMonth = month;
    }

    setSaving(true);
    try {
      const { saved, errors } = await onSave(
        enrollment.id,
        values,
        detail!,
        repriceFromMonth,
      );
      if (saved) updateDetail({ ...detail, ...values });
      return errors;
    } finally {
      setSaving(false);
      setProposal(null);
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
            <Form defaultValues={detail} onSubmit={handleSave}>
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
                    {isCancelled ? "Reactivar" : "Restaurar"}
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
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          onClick={() => setPendingDelete(true)}
                        >
                          Anular
                        </Button>
                        <Button
                          size="small"
                          color="warning"
                          variant="contained"
                          onClick={() => setWithdrawing(true)}
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
                onConfirm={(month) => decide.current(month)}
                onCancel={() => decide.current(undefined)}
              />
            )}
            {withdrawing && (
              <EnrollmentWithdrawDialog
                enrollmentId={enrollment.id}
                year={Number(enrollment.year)}
                onConfirm={(date) => onWithdraw(enrollment.id, detail, date)}
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
