import type { ReactElement } from "react";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CakeIcon from "@mui/icons-material/Cake";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { BirthdaysPage } from "./birthdays/birthdays-page";
import { EnrolledStudentsPage } from "./enrolled-students/enrolled-students-page";
import { RegistrationCardPage } from "./registration-card/registration-card-page";
import { SubmittedDocumentsPage } from "./submitted-documents/submitted-documents-page";
import { WithdrawnStudentsPage } from "./withdrawn-students/withdrawn-students-page";

export interface ReportRoute {
  /** URL the hub card links to and the route registers. */
  path: string;
  /** Card title shown on the hub. */
  title: string;
  /** Card description shown on the hub. */
  description: string;
  /** Icon shown on the hub card. */
  icon: ReactElement;
  /** Accent color for the card's icon panel. Pick a distinct, stable color per
   *  report — heavy users learn to find each one by color, so never reuse or
   *  reshuffle these. */
  color: string;
  /** Component rendered at `path`. Lives next to the URL — no separate lookup. */
  element: ReactElement;
}

/**
 * Single source of truth for the student-report hub.
 *
 * Each entry binds a URL, its hub-card copy, and the component the URL renders
 * in one place. The hub (`StudentReports`) builds its buttons from this array,
 * and the app registers its <Route>s from the same array, so a card can never
 * point at a URL that has no component (or vice versa).
 */
export const studentReportRoutes: ReportRoute[] = [
  {
    path: "/students/reports/enrolled",
    title: "Estudiantes Matriculados",
    description:
      "Consulta el listado de estudiantes actualmente matriculados, con sus datos de grado y sección.",
    icon: <HowToRegIcon />,
    color: "#0d9488",
    element: <EnrolledStudentsPage />,
  },
  {
    path: "/students/reports/registration-card",
    title: "Ficha de Matrícula",
    description:
      "Genera e imprime la ficha de inscripción oficial de un estudiante con todos sus datos personales.",
    icon: <AssignmentIndIcon />,
    color: "#7c3aed",
    element: <RegistrationCardPage />,
  },
  {
    path: "/students/reports/birthdays",
    title: "Cumpleaños",
    description:
      "Lista los cumpleaños de los estudiantes (día y mes), ordenados por fecha.",
    icon: <CakeIcon />,
    color: "#db2777",
    element: <BirthdaysPage />,
  },
  {
    path: "/students/reports/withdrawn",
    title: "Estudiantes Retirados",
    description:
      "Tabla de estudiantes retirados con su código de matrícula, nivel académico y fechas de matrícula y retiro.",
    icon: <PersonRemoveIcon />,
    color: "#ea580c",
    element: <WithdrawnStudentsPage />,
  },
  {
    path: "/students/reports/submitted-documents",
    title: "Documentos Entregados",
    description:
      "Listado de estudiantes con los documentos de matrícula que han entregado, según el catálogo de requisitos.",
    icon: <FactCheckIcon />,
    color: "#2563eb",
    element: <SubmittedDocumentsPage />,
  },
];
