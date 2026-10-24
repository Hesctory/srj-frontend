import { Route } from "react-router-dom";
import { StudentEnrollmentSelectionPage } from "./routes/student-enrollment-selection-page";
import { DebtsPage } from "./routes/debts-page";

export const tuitionRoutes = [
  <Route
    key="/cashier/tuition"
    path="/cashier/tuition"
    element={<StudentEnrollmentSelectionPage />}
  />,
  <Route
    key="/cashier/tuition/:studentId/:enrollmentId/debts"
    path="/cashier/tuition/:studentId/:enrollmentId/debts"
    element={<DebtsPage />}
  />,
];
