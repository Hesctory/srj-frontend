import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Avatar, Box, Paper, Skeleton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Identifier, useGetOne } from "react-admin";

/**
 * The chosen student, pinned above whatever the page is showing.
 *
 * It never disappears — while the results are open it stays as the answer to
 * "who am I charging?" and doubles as the way back to that student's
 * matrículas, which is why there is no separate "cambiar" button.
 *
 * Reads the *detail* endpoint rather than the list row: a deep link
 * (`?studentId=42`) can name a student the current filters exclude, so the
 * list has no row to borrow. `idDocumentNumber`/`studentCode` are the detail
 * record's field names, matching what the debts page already displays.
 */
interface SelectedStudentCardProps {
  studentId: Identifier;
  /** True while the results are open: the card turns into the way back. */
  highlighted: boolean;
  onClick: () => void;
}

const initialsOf = (fullName: string) =>
  fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const SelectedStudentCard = ({
  studentId,
  highlighted,
  onClick,
}: SelectedStudentCardProps) => {
  const { data: student, isLoading } = useGetOne("students", { id: studentId });

  if (isLoading || !student) {
    return <Skeleton variant="rounded" height={76} sx={{ mb: 2.5 }} />;
  }

  const code = student.studentCode ?? student.enrollmentCode;

  return (
    <Paper
      variant="outlined"
      onClick={highlighted ? onClick : undefined}
      sx={(theme) => ({
        p: 2,
        mb: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        cursor: highlighted ? "pointer" : "default",
        borderColor: highlighted ? "primary.main" : "divider",
        backgroundColor: highlighted
          ? alpha(theme.palette.primary.main, 0.06)
          : "background.paper",
        transition: "background-color 120ms ease, border-color 120ms ease",
        "&:hover": highlighted
          ? { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
          : undefined,
      })}
    >
      <Avatar
        sx={(theme) => ({
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          color: "primary.main",
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.5),
          fontWeight: 700,
          fontSize: "0.95rem",
        })}
      >
        {initialsOf(student.fullName ?? "")}
      </Avatar>

      <Box flex={1} minWidth={0}>
        {highlighted && (
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ display: "block", letterSpacing: "0.08em", lineHeight: 1.6 }}
          >
            Seleccionado
          </Typography>
        )}
        <Typography variant="h5" noWrap>
          {student.fullName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          DNI: {student.dni ?? student.idDocumentNumber ?? "—"}
          {code ? ` · Código: ${code}` : ""}
        </Typography>
      </Box>

      {highlighted && (
        <Box
          display="flex"
          alignItems="center"
          gap={0.5}
          color="primary.main"
          flexShrink={0}
        >
          <Typography variant="body2" fontWeight={600} color="inherit">
            Ver sus matrículas
          </Typography>
          <ChevronRightIcon fontSize="small" />
        </Box>
      )}
    </Paper>
  );
};

export default SelectedStudentCard;
