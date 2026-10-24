import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Identifier, RecordContextProvider, useListContext } from "react-admin";
import {
  StudentDniField,
  StudentEnrollmentCodeField,
  StudentGradeField,
  StudentLevelField,
  StudentNameField,
  StudentSectionField,
  StudentShiftField,
} from "@/shared/components/student-fields";
import type { StudentListItem } from "@/types/student";

/**
 * The search results of the merged selection page.
 *
 * Cards at every width rather than `StudentListView`'s table: the row is a
 * *pick*, not a link to the student's file, and a card gives the placement
 * chips room to sit under the name where they read as confirmation ("yes,
 * this is the Quispe in Cuarto B") instead of as columns to scan.
 */
interface StudentResultsProps {
  onPick: (id: Identifier) => void;
}

const StudentResults = ({ onPick }: StudentResultsProps) => {
  const { data, error, isPending, total } = useListContext<StudentListItem>();

  if (isPending) return <LinearProgress sx={{ my: 2 }} />;

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        No se pudo cargar la lista de estudiantes.
      </Alert>
    );
  }

  return (
    <Box minHeight={0} display="flex" flexDirection="column" gap={1}>
      <Box
        display="flex"
        alignItems="baseline"
        justifyContent="space-between"
        px={0.5}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: "0.08em" }}
        >
          Resultados
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {total === 1 ? "1 estudiante" : `${total ?? 0} estudiantes`}
        </Typography>
      </Box>

      {!data?.length ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 4, textAlign: "center" }}
        >
          Sin resultados
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ overflow: "auto", pb: 0.5 }}>
          {data.map((record) => (
            <RecordContextProvider key={String(record.id)} value={record}>
              <Card variant="outlined" sx={{ boxShadow: "none" }}>
                <CardActionArea
                  onClick={() => onPick(record.id)}
                  sx={{
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    textAlign: "left",
                  }}
                >
                  <Box flex={1} minWidth={0}>
                    <StudentNameField />
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={0.75}
                      mt={0.25}
                      color="text.secondary"
                    >
                      <StudentDniField />
                      {record.enrollmentCode && (
                        <>
                          <Box component="span" sx={{ opacity: 0.4 }}>
                            ·
                          </Box>
                          <StudentEnrollmentCodeField />
                        </>
                      )}
                    </Box>
                    <Box
                      display="flex"
                      flexWrap="wrap"
                      alignItems="center"
                      gap={1}
                      mt={1}
                    >
                      <StudentLevelField />
                      <StudentGradeField />
                      <StudentSectionField />
                      <StudentShiftField />
                    </Box>
                  </Box>
                  <ChevronRightIcon
                    fontSize="small"
                    sx={{ color: "text.disabled" }}
                  />
                </CardActionArea>
              </Card>
            </RecordContextProvider>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default StudentResults;
