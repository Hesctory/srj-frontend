import { Route } from "react-router-dom";
import { StudentsResource } from "./resources/students";
import { StudentReports } from "./routes/reports/student-reports";
import { studentReportRoutes } from "./routes/reports/routes";

export const resources = [StudentsResource];

/**
 * All custom (non-CRUD) routes for the students feature: the report hub plus
 * one route per hub card, both derived from `studentReportRoutes`.
 */
export const routes = [
  <Route
    key="/students/reports"
    path="/students/reports"
    element={<StudentReports />}
  />,
  ...studentReportRoutes.map((route) => (
    <Route key={route.path} path={route.path} element={route.element} />
  )),
];
