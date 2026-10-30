import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { useState } from "react";
import {
  Form,
  useDataProvider,
  useNotify,
  useRedirect,
  Identifier,
} from "react-admin";
import { withBillDefault } from "@/features/students/hooks/use-enrollment-preview";
import {
  fieldErrors,
  serverErrorMessage,
  splitFieldErrors,
} from "@/features/students/utils/server-errors";
import EnrollmentFormInputs from "./enrollment-form-inputs";

interface EnrollDialogProps {
  open: boolean;
  onClose: () => void;
  studentData: Record<string, unknown> | null;
  studentId: Identifier | null;
}

/** Values the form keeps without showing an input for them. */
const NOT_SHOWN = new Set(["studentId", "documents"]);

export const EnrollDialog = ({
  open,
  onClose,
  studentData,
  studentId,
}: EnrollDialogProps) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();
  // One click, one enrollment: while it is written, neither Matricular nor
  // Cancelar, Escape or the backdrop can act.
  const [saving, setSaving] = useState(false);

  // A 422's messages go on the fields the form shows; the rest (409 already
  // enrolled, 404 no fees, a key with no visible input) are a notification.
  const handleSubmit = async (enrollmentData: Record<string, unknown>) => {
    setSaving(true);
    try {
      const enrollment = withBillDefault(enrollmentData);
      if (studentId) {
        const payload = { studentId: studentId, ...enrollment };
        await dataProvider.create("enrollments", { data: payload });
      } else if (studentData) {
        const payload = { ...studentData, enrollment };
        await dataProvider.create("students", { data: payload });
      }
      notify("Estudiante matriculado exitosamente", { type: "success" });
      redirect("list", "students");
    } catch (error) {
      const errors = fieldErrors(error);
      const { onFields, elsewhere } = errors
        ? splitFieldErrors(
            errors,
            (field) =>
              !NOT_SHOWN.has(field) && enrollmentData[field] !== undefined,
          )
        : { onFields: {}, elsewhere: "" };
      if (!errors || elsewhere) {
        notify(
          elsewhere ||
            serverErrorMessage(error, "No se pudo matricular al estudiante."),
          { type: "error" },
        );
      }
      if (Object.keys(onFields).length > 0) return onFields;
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      // The <form> sits between the paper and its parts; making it the flex
      // column lets only the content scroll, so the title and Matricular stay
      // in view however many pensiones the preview lists.
      sx={{
        "& .MuiDialog-paper > form": {
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        },
      }}
    >
      <Form onSubmit={handleSubmit}>
        <DialogTitle>Matricular Estudiante</DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <EnrollmentFormInputs
              studentId={studentId === null ? null : Number(studentId)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            type="submit"
            disabled={saving}
          >
            {saving ? "Matriculando…" : "Matricular"}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
};
