import { Box } from "@mui/material";
import CRUDToolBar from "@/app/layout/crud-toolbar";
import { EnrollButton } from "@/features/students/buttons/enroll-button";
import { ViewEnrollmentsButton } from "@/features/students/buttons/view-enrollments-button";

const StudentEditToolbar = () => (
  <CRUDToolBar save delete>
    <Box display="flex" gap={1}>
      <ViewEnrollmentsButton />
      <EnrollButton />
    </Box>
  </CRUDToolBar>
);

export default StudentEditToolbar;
