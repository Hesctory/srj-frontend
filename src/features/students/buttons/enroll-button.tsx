import { useState } from "react";
import { Button, useRecordContext } from "react-admin";
import SchoolIcon from "@mui/icons-material/School";
import { useFormContext } from "react-hook-form";
import { EnrollDialog } from "@/features/students/components/enroll-dialog";

export const EnrollButton = () => {
  const [open, setOpen] = useState(false);
  const [studentData, setStudentData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const { trigger, getValues } = useFormContext();
  const record = useRecordContext();
  const isEditMode = !!record?.id;

  const handleClick = async () => {
    if (isEditMode) {
      setOpen(true);
      return;
    }
    const isValid = await trigger();
    if (!isValid) return;
    setStudentData(getValues());
    setOpen(true);
  };

  return (
    <>
      <Button
        label="Matricular"
        onClick={handleClick}
        size="large"
        sx={{
          backgroundColor: "success.main",
          color: "white",
          "&:hover": { backgroundColor: "success.dark" },
        }}
      >
        <SchoolIcon />
      </Button>
      <EnrollDialog
        open={open}
        onClose={() => setOpen(false)}
        studentData={isEditMode ? null : studentData}
        studentId={isEditMode ? record.id : null}
      />
    </>
  );
};
