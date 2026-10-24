import { useState } from "react";
import { Button, useRecordContext } from "react-admin";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { EnrollmentsDialog } from "@/features/students/components/enrollments-dialog";

export const ViewEnrollmentsButton = () => {
  const [open, setOpen] = useState(false);
  const record = useRecordContext();

  if (!record) return null;

  return (
    <>
      <Button
        label="Ver matrículas"
        onClick={() => setOpen(true)}
        size="large"
        sx={{
          backgroundColor: "info.main",
          color: "white",
          "&:hover": { backgroundColor: "info.dark" },
        }}
      >
        <ListAltIcon />
      </Button>
      <EnrollmentsDialog
        open={open}
        onClose={() => setOpen(false)}
        studentId={record.id}
      />
    </>
  );
};
