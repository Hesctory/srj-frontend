import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HubButton,
  HubButtonDescription,
  HubButtonTitle,
} from "@/features/students/components/hub-button";
import { HubLayout } from "@/features/students/components/hub-layout";
import { studentReportRoutes } from "./routes";

export const StudentReports = () => {
  const navigate = useNavigate();

  // Press 1–9 to open the matching card. Cards keep a stable order, so the
  // digit + the card's color become fixed muscle memory for daily users.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      const index = Number(e.key) - 1;
      const route = studentReportRoutes[index];
      if (route) {
        e.preventDefault();
        navigate(route.path);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return (
    <HubLayout title="Reportes de Estudiantes">
      {studentReportRoutes.map((route, index) => (
        <HubButton
          key={route.path}
          icon={route.icon}
          url={route.path}
          color={route.color}
          hotkey={index + 1}
        >
          <HubButtonTitle>{route.title}</HubButtonTitle>
          <HubButtonDescription>{route.description}</HubButtonDescription>
        </HubButton>
      ))}
    </HubLayout>
  );
};
