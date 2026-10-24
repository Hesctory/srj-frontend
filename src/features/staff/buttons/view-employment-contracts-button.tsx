import { useState } from "react";
import { Button, useRecordContext } from "react-admin";
import WorkIcon from "@mui/icons-material/Work";
import { EmploymentContractsDialog } from "@/features/staff/components/employment-contracts-dialog";

export const ViewEmploymentContractsButton = () => {
  const [open, setOpen] = useState(false);
  const record = useRecordContext();

  if (!record) return null;

  return (
    <>
      <Button
        label="Contratos"
        onClick={() => setOpen(true)}
        size="large"
        sx={{
          backgroundColor: "info.main",
          color: "white",
          "&:hover": { backgroundColor: "info.dark" },
        }}
      >
        <WorkIcon />
      </Button>
      <EmploymentContractsDialog
        open={open}
        onClose={() => setOpen(false)}
        staffMemberId={record.id}
      />
    </>
  );
};
