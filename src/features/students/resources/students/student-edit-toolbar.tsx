import { Box } from "@mui/material";
import CRUDToolBar from "@/app/layout/crud-toolbar";
import { EnrollButton } from "@/features/students/buttons/enroll-button";
import { StudentDeleteButton } from "@/features/students/buttons/student-delete-button";
import { ViewEnrollmentsButton } from "@/features/students/buttons/view-enrollments-button";

// Deleting a student follows the API's deletion preview, so the toolbar's
// plain delete is replaced by the student's own button, in the same place.
const StudentEditToolbar = () => (
  <CRUDToolBar save>
    <Box display="flex" gap={1}>
      <ViewEnrollmentsButton />
      <EnrollButton />
    </Box>
    <Box>
      <StudentDeleteButton />
    </Box>
  </CRUDToolBar>
);

export default StudentEditToolbar;
