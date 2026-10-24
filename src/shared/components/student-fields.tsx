import { Box, Chip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import NightsStayOutlinedIcon from "@mui/icons-material/NightsStayOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import WbTwilightOutlinedIcon from "@mui/icons-material/WbTwilightOutlined";
import { useRecordContext } from "react-admin";
import type { AcademicPalette, AcademicTint } from "@/app/theme";
import type { StudentListItem } from "@/types/student";

/**
 * Presentational cells for the student lists.
 *
 * Each one reads the record from RA's context, so the same component works
 * inside a `<DataTable.Col>` and inside the mobile card without a second code
 * path. Header label, `column-<source>` class and sorting belong to the
 * `DataTable.Col` that wraps the field, not to the field itself.
 */

/** Strips accents so "Mañana"/"manana" and "Inicial"/"INICIAL" both resolve. */
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const LEVEL_TINTS: Record<string, keyof AcademicPalette> = {
  inicial: "inicial",
  primaria: "primaria",
  secundaria: "secundaria",
};

const SHIFT_TINTS: Record<string, keyof AcademicPalette> = {
  manana: "morning",
  tarde: "afternoon",
  noche: "evening",
};

const SHIFT_ICONS: Record<string, typeof WbSunnyOutlinedIcon> = {
  manana: WbSunnyOutlinedIcon,
  tarde: WbTwilightOutlinedIcon,
  noche: NightsStayOutlinedIcon,
};

const tintOf = (
  theme: Theme,
  map: Record<string, keyof AcademicPalette>,
  value: string,
): AcademicTint => theme.palette.academic[map[normalize(value)] ?? "neutral"];

/**
 * Placeholder for a student with no enrollment yet — keeps columns aligned.
 * `text.secondary`, not `text.disabled`: "has no placement" is information the
 * reader needs, and the disabled token only reaches 2.4:1 on a light row.
 */
export const EmptyValue = () => (
  <Typography component="span" variant="body2" color="text.secondary">
    —
  </Typography>
);

/** Digits read as a column when they share a width; names stay proportional. */
const numericSx: SxProps<Theme> = {
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "0.01em",
};

export const StudentNameField = () => {
  const record = useRecordContext<StudentListItem>();
  if (!record) return null;
  return (
    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
      {record.fullName}
    </Typography>
  );
};

export const StudentDniField = () => {
  const record = useRecordContext<StudentListItem>();
  if (!record?.dni) return <EmptyValue />;
  return (
    <Typography variant="body2" sx={{ ...numericSx, fontWeight: 500 }}>
      {record.dni}
    </Typography>
  );
};

export const StudentEnrollmentCodeField = () => {
  const record = useRecordContext<StudentListItem>();
  if (!record?.enrollmentCode) return <EmptyValue />;
  return (
    <Typography variant="body2" sx={{ ...numericSx, color: "text.secondary" }}>
      {record.enrollmentCode}
    </Typography>
  );
};

/** The strongest categorical signal on the row, so it carries the filled chip. */
export const StudentLevelField = () => {
  const record = useRecordContext<StudentListItem>();
  if (!record?.level) return <EmptyValue />;
  return (
    <Chip
      size="small"
      label={record.level}
      sx={(theme) => {
        const tint = tintOf(theme, LEVEL_TINTS, record.level!);
        return {
          height: 22,
          fontWeight: 600,
          fontSize: "0.75rem",
          backgroundColor: tint.bg,
          color: tint.fg,
          border: `1px solid ${tint.border}`,
          "& .MuiChip-label": { px: 0.9 },
        };
      }}
    />
  );
};

export const StudentGradeField = () => {
  const record = useRecordContext<StudentListItem>();
  if (!record?.grade) return <EmptyValue />;
  return <Typography variant="body2">{record.grade}</Typography>;
};

/** A single letter, so a square badge reads faster than a word-shaped chip. */
export const StudentSectionField = () => {
  const record = useRecordContext<StudentListItem>();
  if (!record?.section) return <EmptyValue />;
  return (
    <Box
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 24,
        height: 24,
        px: 0.5,
        borderRadius: 1,
        fontSize: "0.75rem",
        fontWeight: 700,
        lineHeight: 1,
        backgroundColor: theme.palette.academic.neutral.bg,
        color: theme.palette.academic.neutral.fg,
        border: `1px solid ${theme.palette.academic.neutral.border}`,
      })}
    >
      {record.section}
    </Box>
  );
};

/**
 * Icon + tinted label rather than a second filled chip: the level chip already
 * owns the row's color weight, so the shift stays legible without competing.
 */
export const StudentShiftField = () => {
  const record = useRecordContext<StudentListItem>();
  if (!record?.shift) return <EmptyValue />;
  const Icon = SHIFT_ICONS[normalize(record.shift)] ?? WbSunnyOutlinedIcon;
  return (
    <Box
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        color: tintOf(theme, SHIFT_TINTS, record.shift!).fg,
      })}
    >
      <Icon sx={{ fontSize: 16 }} />
      <Typography variant="body2" sx={{ fontWeight: 600, color: "inherit" }}>
        {record.shift}
      </Typography>
    </Box>
  );
};
