import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Form } from "react-admin";
import { FormGrid } from "@/shared/components/form-grid";
import {
  useEnrollmentPreview,
  withBillDefault,
} from "@/features/students/hooks/use-enrollment-preview";
import EnrollmentChecks from "./enrollment-checks";
import EnrollmentTermsInputs from "./enrollment-terms-inputs";

export interface ReactivationTerms {
  graceDays: number;
  billEnrollmentMonth: boolean;
}

interface EnrollmentReactivateDialogProps {
  studentId: number;
  /** The enrollment's placement and concept, which the charges are raised on. */
  values: Record<string, unknown>;
  /** Field errors to show on the questions, or nothing. */
  onConfirm: (
    terms: ReactivationTerms,
  ) => Promise<Record<string, string> | undefined>;
  onCancel: () => void;
}

/**
 * The preview tells which question applies and what to check first. Its list
 * of charges is left out: it plans a new enrollment, and a reactivation skips
 * the charges still live.
 */
const ReactivationBody = ({
  studentId,
  saving,
  onCancel,
}: {
  studentId: number;
  saving: boolean;
  onCancel: () => void;
}) => {
  const { data, error, isPending } = useEnrollmentPreview("", studentId);

  return (
    <>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            Se generan los cobros que le faltan a la matrícula, con la fecha de
            hoy. Los que siguen vigentes no se repiten.
          </Typography>
          <FormGrid minColumnWidth={220}>
            <EnrollmentTermsInputs studentId={studentId} />
          </FormGrid>
          {error ? (
            <Alert severity="warning">
              No se pudo verificar si se pregunta por la pensión del mes. Si
              sigues, se cobra la pensión del mes en curso.
            </Alert>
          ) : null}
          {data && (
            <EnrollmentChecks
              eligibility={data.eligibility}
              warnings={data.warnings}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={saving}>
          Volver
        </Button>
        <Button
          variant="contained"
          color="success"
          type="submit"
          disabled={isPending || saving}
        >
          {saving ? "Reactivando…" : "Reactivar"}
        </Button>
      </DialogActions>
    </>
  );
};

/** Bringing a cancelled or withdrawn enrollment back, with the enroll questions. */
const EnrollmentReactivateDialog = ({
  studentId,
  values,
  onConfirm,
  onCancel,
}: EnrollmentReactivateDialogProps) => {
  const [saving, setSaving] = useState(false);

  const submit = async (form: Record<string, unknown>) => {
    setSaving(true);
    try {
      const { billEnrollmentMonth } = withBillDefault(form);
      return await onConfirm({
        graceDays: Number(form.graceDays ?? 0),
        billEnrollmentMonth: billEnrollmentMonth as boolean,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={saving ? undefined : onCancel}
      fullWidth
      maxWidth="sm"
    >
      <Form defaultValues={values} onSubmit={submit}>
        <DialogTitle>Reactivar matrícula</DialogTitle>
        <ReactivationBody
          studentId={studentId}
          saving={saving}
          onCancel={onCancel}
        />
      </Form>
    </Dialog>
  );
};

export default EnrollmentReactivateDialog;
