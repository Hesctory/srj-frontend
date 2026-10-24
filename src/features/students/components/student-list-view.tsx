import {
  Alert,
  Box,
  Card,
  CardActionArea,
  Checkbox,
  LinearProgress,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  DataTable,
  RecordContextProvider,
  useCreatePath,
  useListContext,
  useRecordContext,
  useResourceContext,
} from "react-admin";
import { Link as RouterLink } from "react-router-dom";
import type { StudentListItem } from "@/types/student";
import {
  StudentDniField,
  StudentEnrollmentCodeField,
  StudentGradeField,
  StudentLevelField,
  StudentNameField,
  StudentSectionField,
  StudentShiftField,
} from "@/shared/components/student-fields";

/**
 * The one student list rendering used everywhere a student is browsed or picked.
 *
 * Two renderings behind a single breakpoint switch:
 *  - below md, stacked cards. The dark rail is permanent in this shell, so it
 *    keeps its 248px even on a tablet: a 820px viewport leaves ~525px of table,
 *    which clips the last column. Cards sidestep the budget entirely and read
 *    better under a thumb.
 *  - md and up, a table whose columns appear as space allows (see
 *    `COLUMN_BREAKPOINTS`).
 *
 * Both renderings share the same field components, so a student reads the same
 * on a phone and on a 1440p monitor.
 */

/** Below this the table cannot hold its columns; cards take over. */
const TABLE_FROM = "md" as const;

/**
 * Spread into `<List sx>` wherever `<StudentListView>` is the child.
 *
 * At card widths RA's own chrome fights the layout twice: `RaList-content` is a
 * Card, so the student cards render as boxes inside a box with a 1px gutter,
 * and RA paints the filter toolbar solid white with zero padding, so the inputs
 * touch its edges. Flatten both — the cards and the filter inputs then sit
 * directly on the page canvas, exactly as they do at table widths.
 *
 * Scoped to the card breakpoint so the table keeps its card container.
 */
export const studentListSx = (theme: Theme) => ({
  [theme.breakpoints.down(TABLE_FROM)]: {
    // The toolbar row and the Create/Export toolbar inside it are both painted
    // solid white by RA at this size. `.MuiToolbar-root` rather than
    // `.RaTopToolbar-root`: RA styles that slot through emotion, so no literal
    // `RaTopToolbar-root` class lands in the DOM to hook.
    "& .RaList-actions, & .RaList-actions .MuiToolbar-root": {
      backgroundColor: "transparent",
    },
    "& .RaList-content": {
      backgroundColor: "transparent",
      border: 0,
      borderRadius: 0,
      boxShadow: "none",
    },
  },
});

export interface StudentListViewProps {
  /**
   * `false` (default) — a row opens the student's edit page.
   * `true` — a row toggles its checkbox, for flows that act on a hand-picked
   * set of students (e.g. printing registration cards).
   */
  selectable?: boolean;
}

/**
 * Where each optional column earns its space. Usable width is the viewport
 * minus the 248px rail and the page padding, and the non-name columns need
 * ~615px together:
 *  - md (900px → ~600px usable): name, DNI, level, grade, section. "Tercero"
 *    alone is ambiguous — it exists in both Primaria and Secundaria — so the
 *    level chip stays, while the enrollment code (redundant with the DNI for
 *    telling two rows apart) and the shift wait for room.
 *  - lg (1200px → ~900px usable, and so 1366x768, 1920x1080 and 2560x1440):
 *    all seven columns.
 * Columns with no entry here are shown at every table width.
 */
const COLUMN_BREAKPOINTS = {
  enrollmentCode: "lg",
  shift: "lg",
} as const;

const shownFrom = (breakpoint: "sm" | "md" | "lg") => ({
  display: { xs: "none", [breakpoint]: "table-cell" },
});

const dataTableSx = (theme: Theme) => ({
  "& .RaDataTable-headerCell": { whiteSpace: "nowrap" },
  // The theme squeezes small cells to 4px; chips and badges need a little more.
  "& .RaDataTable-rowCell": { py: 0.75 },
  // The short columns never wrap, so the name column absorbs the slack and is
  // the only one that reflows as the window grows.
  "& .column-fullName": { minWidth: 180, width: "40%" },
  "& .column-dni, & .column-enrollmentCode, & .column-grade, & .column-shift": {
    whiteSpace: "nowrap",
  },
  ...Object.fromEntries(
    Object.entries(COLUMN_BREAKPOINTS).map(([column, breakpoint]) => [
      `& .column-${column}`,
      shownFrom(breakpoint),
    ]),
  ),
  // Zebra + hover: long filtered lists are scanned across, and a tinted row
  // keeps the eye on one student while it travels to the shift column.
  "& .RaDataTable-row": {
    cursor: "pointer",
    transition: "background-color 120ms ease",
  },
  "& .RaDataTable-rowEven": {
    backgroundColor: alpha(theme.palette.text.primary, 0.02),
  },
  "& .RaDataTable-row:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
});

const StudentDataTable = ({ selectable }: Required<StudentListViewProps>) => (
  <DataTable
    sx={dataTableSx}
    // An empty fragment keeps RA's selection column while dropping the default
    // bulk delete — the picking flows act on the selection themselves.
    bulkActionButtons={selectable ? <></> : false}
    rowClick={selectable ? "toggleSelection" : undefined}
  >
    <DataTable.Col source="fullName" label="Nombre Completo">
      <StudentNameField />
    </DataTable.Col>
    <DataTable.Col source="dni" label="DNI">
      <StudentDniField />
    </DataTable.Col>
    {/* The academic columns are derived from the current enrollment; they are
        not sortable until the backend accepts them as sort fields. */}
    <DataTable.Col source="enrollmentCode" label="Código" disableSort>
      <StudentEnrollmentCodeField />
    </DataTable.Col>
    <DataTable.Col source="level" label="Nivel" disableSort>
      <StudentLevelField />
    </DataTable.Col>
    <DataTable.Col source="grade" label="Grado" disableSort>
      <StudentGradeField />
    </DataTable.Col>
    <DataTable.Col source="section" label="Sección" disableSort>
      <StudentSectionField />
    </DataTable.Col>
    <DataTable.Col source="shift" label="Turno" disableSort>
      <StudentShiftField />
    </DataTable.Col>
  </DataTable>
);

const StudentCard = ({ selectable }: Required<StudentListViewProps>) => {
  const record = useRecordContext<StudentListItem>();
  const resource = useResourceContext();
  const createPath = useCreatePath();
  const { selectedIds, onToggleItem } = useListContext();

  if (!record || !resource) return null;

  // RA keeps `selectedIds` per resource, so a selection made on the
  // registration-card page survives into this list. Only honour it where the
  // list is actually a picker, otherwise browsing shows a phantom highlight.
  const selected = selectable && selectedIds.includes(record.id);
  const isEnrolled = Boolean(
    record.level || record.grade || record.section || record.shift,
  );

  const body = (
    <>
      {selectable && (
        <Checkbox
          checked={selected}
          size="small"
          tabIndex={-1}
          sx={{ p: 0.5, mt: -0.5, ml: -0.5 }}
        />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <StudentNameField />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            mt: 0.25,
            color: "text.secondary",
          }}
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
        {/* A card has room for a sentence, so an unenrolled student says so
            once instead of repeating the table's four "—" placeholders. */}
        {isEnrolled ? (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
              mt: 1,
            }}
          >
            <StudentLevelField />
            <StudentGradeField />
            <StudentSectionField />
            <StudentShiftField />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Sin matrícula
          </Typography>
        )}
      </Box>
      {!selectable && (
        <ChevronRightIcon fontSize="small" sx={{ color: "text.disabled" }} />
      )}
    </>
  );

  const actionSx = {
    p: 1.5,
    display: "flex",
    alignItems: "flex-start",
    gap: 1,
    textAlign: "left" as const,
  };

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        // The theme gives every Card a shadow, which `variant="outlined"` does
        // not undo. Drop it: these are list rows, and a floating card reads as
        // a second surface when the list itself sits on a panel (the
        // registration-card report) rather than on the page canvas.
        boxShadow: "none",
        borderColor: selected
          ? theme.palette.primary.main
          : theme.palette.divider,
        backgroundColor: selected
          ? alpha(theme.palette.primary.main, 0.06)
          : theme.palette.background.paper,
      })}
    >
      {selectable ? (
        <CardActionArea onClick={() => onToggleItem(record.id)} sx={actionSx}>
          {body}
        </CardActionArea>
      ) : (
        <CardActionArea
          component={RouterLink}
          to={createPath({ resource, id: record.id, type: "edit" })}
          sx={actionSx}
        >
          {body}
        </CardActionArea>
      )}
    </Card>
  );
};

const StudentCardList = ({ selectable }: Required<StudentListViewProps>) => {
  const { data, error, isPending } = useListContext<StudentListItem>();

  if (isPending) return <LinearProgress sx={{ my: 2 }} />;
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        No se pudo cargar la lista de estudiantes.
      </Alert>
    );
  }
  if (!data?.length) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ py: 3, textAlign: "center" }}
      >
        Sin resultados
      </Typography>
    );
  }

  return (
    <Stack spacing={1} sx={{ py: 1 }}>
      {data.map((record) => (
        <RecordContextProvider key={record.id} value={record}>
          <StudentCard selectable={selectable} />
        </RecordContextProvider>
      ))}
    </Stack>
  );
};

export const StudentListView = ({
  selectable = false,
}: StudentListViewProps) => {
  const isCompact = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down(TABLE_FROM),
  );

  return isCompact ? (
    <StudentCardList selectable={selectable} />
  ) : (
    <StudentDataTable selectable={selectable} />
  );
};
