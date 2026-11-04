import { useState } from "react";
import { Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRecordContext } from "react-admin";
import StudentDeleteDialog from "@/features/students/components/student-delete-dialog";

/**
 * "Eliminar" for a student: the API's deletion preview decides what the
 * dialog offers, so a plain RA DeleteButton would not do.
 */
export const StudentDeleteButton = () => {
  const record = useRecordContext();
  const [open, setOpen] = useState(false);
  if (!record) return null;

  return (
    <>
      <Button
        variant="contained"
        color="error"
        size="large"
        startIcon={<DeleteIcon />}
        onClick={() => setOpen(true)}
      >
        Eliminar
      </Button>
      {open && (
        <StudentDeleteDialog student={record} onClose={() => setOpen(false)} />
      )}
    </>
  );
};
