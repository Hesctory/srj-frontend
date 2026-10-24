import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import GridOnIcon from "@mui/icons-material/GridOn";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useMemo, useState } from "react";
import { Form, Title, useDataProvider, useNotify } from "react-admin";
import { useFormContext, useWatch } from "react-hook-form";
import type { AppDataProvider } from "@/app/data-provider";
import AcademicFormSelector from "@/features/students/components/academic-form-selector";
import {
  loadReportFilters,
  ReportFiltersPersistence,
} from "@/shared/hooks/use-report-filters";
import { downloadBlob, openBlobInTab } from "@/utils/blob-file";

const PDF_FILENAME = "Estudiantes-Matriculados.pdf";
const XLSX_FILENAME = "Estudiantes-Matriculados.xlsx";
const REPORT_KEY = "enrolled-students";

// Inner component — must live inside <Form> to access the form context.
// Reads current field values via useWatch and requests the backend-generated
// file (PDF/Excel) for opening in a new tab or downloading.
const GenerateActions = () => {
  const dataProvider = useDataProvider<AppDataProvider>();
  const notify = useNotify();
  const { handleSubmit } = useFormContext();
  const [busy, setBusy] = useState<"open" | "download" | "excel" | null>(null);

  const schoolYearId = useWatch({ name: "schoolYearId" });
  const levelId = useWatch({ name: "levelId" });
  const gradeId = useWatch({ name: "gradeId" });
  const shiftId = useWatch({ name: "shiftId" });
  const sectionId = useWatch({ name: "sectionId" });

  const buildFilter = () => {
    const filter: Record<string, unknown> = {};
    if (schoolYearId != null) filter.schoolYearId = schoolYearId;
    if (levelId != null) filter.levelId = levelId;
    if (gradeId != null) filter.gradeId = gradeId;
    if (shiftId != null) filter.shiftId = shiftId;
    if (sectionId != null) filter.sectionId = sectionId;
    return filter;
  };

  // Open the tab synchronously (inside the click gesture) so the popup
  // blocker doesn't kill it after the async file fetch.
  const openInNewTab = () => {
    const win = window.open("", "_blank");
    handleSubmit(async () => {
      setBusy("open");
      try {
        const { data: blob } = await dataProvider.exportReport({
          report: "enrolled",
          format: "pdf",
          filter: buildFilter(),
        });
        if (!blob) {
          win?.close();
          notify("Sin resultados para estos filtros", { type: "warning" });
          return;
        }
        openBlobInTab(win, blob);
      } catch (err) {
        win?.close();
        notify("No se pudo generar el reporte", { type: "error" });
        throw err;
      } finally {
        setBusy(null);
      }
    })();
  };

  const download = (format: "pdf" | "xlsx") =>
    handleSubmit(async () => {
      setBusy(format === "pdf" ? "download" : "excel");
      try {
        const { data: blob } = await dataProvider.exportReport({
          report: "enrolled",
          format,
          filter: buildFilter(),
        });
        if (!blob) {
          notify("Sin resultados para estos filtros", { type: "warning" });
          return;
        }
        downloadBlob(blob, format === "pdf" ? PDF_FILENAME : XLSX_FILENAME);
      } catch (err) {
        notify("No se pudo generar el reporte", { type: "error" });
        throw err;
      } finally {
        setBusy(null);
      }
    })();

  return (
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
      <Button
        variant="contained"
        startIcon={
          busy === "open" ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <VisibilityIcon />
          )
        }
        onClick={openInNewTab}
        disabled={busy !== null}
      >
        Ver PDF
      </Button>
      <Button
        variant="outlined"
        startIcon={
          busy === "download" ? (
            <CircularProgress size={18} />
          ) : (
            <PictureAsPdfIcon />
          )
        }
        onClick={() => download("pdf")}
        disabled={busy !== null}
      >
        PDF
      </Button>
      <Button
        variant="outlined"
        startIcon={
          busy === "excel" ? <CircularProgress size={18} /> : <GridOnIcon />
        }
        onClick={() => download("xlsx")}
        disabled={busy !== null}
      >
        Excel
      </Button>
    </Box>
  );
};

export const EnrolledStudentsPage = () => {
  // Seed the form once per mount; restored values survive RA's initial reset.
  const defaultValues = useMemo(() => loadReportFilters(REPORT_KEY), []);

  return (
    <>
      <Title title="Reporte: Estudiantes Matriculados" />
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Form defaultValues={defaultValues}>
            <ReportFiltersPersistence reportKey={REPORT_KEY} />
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                mt: 1,
                // Override RA/MUI defaults: make inputs compact and horizontal
                "& .MuiFormControl-root": {
                  flex: "1 1 160px",
                  mt: 0,
                  mb: 0,
                },
              }}
            >
              <AcademicFormSelector
                required={false}
                requireYear
                defaultCurrentYear
              />
            </Box>
            <Box sx={{ mt: 3 }}>
              <GenerateActions />
            </Box>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};
