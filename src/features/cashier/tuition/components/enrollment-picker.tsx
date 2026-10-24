import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  Chip,
  LinearProgress,
  Typography,
} from "@mui/material";
import { Identifier, RecordContextProvider, useGetList } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  StudentGradeField,
  StudentLevelField,
  StudentSectionField,
  StudentShiftField,
} from "@/shared/components/student-fields";
import { EnrollmentSummary } from "@/types/enrollment";

const STATE_COLOR: Record<string, "success" | "error" | "warning" | "default"> =
  {
    Activa: "success",
    Cancelada: "error",
    Retirada: "warning",
  };

/**
 * Step 1b: which year's account statement to open.
 *
 * The placement fields are rendered with the same components the student rows
 * use — an enrollment carries exactly the level/grade/section/shift a student
 * row does, so a 2024 card reads the same as the row that led here instead of
 * inventing a second way to show "Primaria — Cuarto — B — Mañana".
 */
interface EnrollmentPickerProps {
  studentId: Identifier;
}

const EnrollmentPicker = ({ studentId }: EnrollmentPickerProps) => {
  const navigate = useNavigate();

  const {
    data: enrollments,
    isPending,
    error,
  } = useGetList<EnrollmentSummary>("enrollments", {
    filter: { studentId },
    sort: { field: "year", order: "DESC" },
    pagination: { page: 1, perPage: 100 },
  });

  if (isPending) return <LinearProgress sx={{ my: 2 }} />;

  if (error) {
    return (
      <Alert severity="error">
        No se pudieron cargar las matrículas de este estudiante.
      </Alert>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <Alert severity="info">
        Este estudiante no tiene matrículas registradas.
      </Alert>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ letterSpacing: "0.08em", px: 0.5 }}
      >
        Elige la matrícula
      </Typography>

      <Box
        display="grid"
        gap={2}
        gridTemplateColumns={{
          xs: "repeat(1, minmax(0, 1fr))",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
        }}
      >
        {enrollments.map((enrollment) => (
          <RecordContextProvider key={String(enrollment.id)} value={enrollment}>
            <Card variant="outlined">
              <CardActionArea
                onClick={() =>
                  navigate(
                    `/cashier/tuition/${studentId}/${enrollment.id}/debts`,
                  )
                }
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                }}
              >
                <Box
                  width="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                >
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
                  >
                    {enrollment.year}
                  </Typography>
                  <Chip
                    label={enrollment.state}
                    color={STATE_COLOR[enrollment.state] ?? "default"}
                    size="small"
                  />
                </Box>

                <Box
                  width="100%"
                  display="flex"
                  flexWrap="wrap"
                  alignItems="center"
                  gap={1}
                >
                  <StudentLevelField />
                  <StudentGradeField />
                  <StudentSectionField />
                  <StudentShiftField />
                </Box>

                <Box
                  width="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                  pt={1.25}
                  borderTop={1}
                  borderColor="divider"
                  color="primary.main"
                >
                  <Typography variant="body2" fontWeight={600} color="inherit">
                    Estado de cuenta
                  </Typography>
                  <ArrowForwardIcon fontSize="small" />
                </Box>
              </CardActionArea>
            </Card>
          </RecordContextProvider>
        ))}
      </Box>
    </Box>
  );
};

export default EnrollmentPicker;
