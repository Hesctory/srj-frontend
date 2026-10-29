import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import {
  Form,
  useDataProvider,
  useNotify,
  useRedirect,
  Identifier,
} from "react-admin";
import { useFormState } from "react-hook-form";
import {
  fieldErrors,
  serverErrorMessage,
} from "@/features/students/hooks/use-enrollment-preview";
import EnrollmentFormInputs from "./enrollment-form-inputs";

interface EnrollDialogProps {
  open: boolean;
  onClose: () => void;
  studentData: Record<string, unknown> | null;
  studentId: Identifier | null;
}

/** Disabled while the enrollment is being written: one click, one enrollment. */
const EnrollSubmitButton = () => {
  const { isSubmitting } = useFormState();
  return (
    <Button
      variant="contained"
      color="success"
      type="submit"
      disabled={isSubmitting}
    >
      {isSubmitting ? "Matriculando…" : "Matricular"}
    </Button>
  );
};

export const EnrollDialog = ({
  open,
  onClose,
  studentData,
  studentId,
}: EnrollDialogProps) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();

  // Resolving with the 422's field errors puts each message on its field;
  // anything else (409 already enrolled, 404 no fees) is a notification.
  const handleSubmit = async (enrollmentData: Record<string, unknown>) => {
    try {
      if (studentId) {
        const payload = { studentId: studentId, ...enrollmentData };
        await dataProvider.create("enrollments", { data: payload });
      } else if (studentData) {
        const payload = { ...studentData, enrollment: enrollmentData };
        await dataProvider.create("students", { data: payload });
      }
      notify("Estudiante matriculado exitosamente", { type: "success" });
      redirect("list", "students");
    } catch (error) {
      const errors = fieldErrors(error);
      if (errors) return errors;
      notify(
        serverErrorMessage(error, "No se pudo matricular al estudiante."),
        { type: "error" },
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
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
          <Button onClick={onClose}>Cancelar</Button>
          <EnrollSubmitButton />
        </DialogActions>
      </Form>
    </Dialog>
  );
};
