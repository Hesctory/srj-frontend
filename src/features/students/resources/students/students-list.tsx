import type { Theme } from "@mui/material/styles";
import { List, TextInput } from "react-admin";
import { academicFilterInputs } from "@/shared/components/academic-filter-selector";
import {
  StudentListView,
  studentListSx,
} from "@/features/students/components/student-list-view";

const studentsFilters = [
  ...academicFilterInputs,
  <TextInput key="dni" source="dni" label="DNI" alwaysOn />,
  <TextInput key="fullName" source="fullName" label="Nombre" alwaysOn />,
];

/**
 * Filter bar layout.
 *
 * RA lays its filter inputs out as a wrapping flex row of shrink-to-fit cells,
 * which leaves a ragged tail whenever they don't add up to the row width — and
 * here the count swings between four and seven as the academic cascade opens.
 * A grid of equal auto-filled tracks spreads whatever is on screen across the
 * whole row instead, and re-columns itself at every width, so the bar reads the
 * same with two filters open as with seven.
 */
const filterBarSx = (theme: Theme) => ({
  // Below `sm` RA stacks the toolbar itself (`column-reverse`, filter icon over
  // a Create FAB), where a main-axis basis would be a height, not a width. So
  // the row-mode reflow below is scoped to the widths RA actually lays the
  // toolbar out as a row.
  [theme.breakpoints.up("sm")]: {
    // Create/Exportar sit beside the filters and take a fixed ~330px out of the
    // row. Below roughly 1100px that leaves the grid too narrow to hold the
    // columns it could, so let them drop to a line of their own instead — the
    // filters then use the full width and the bar ends up shorter, not taller.
    "& .RaList-actions": { flexWrap: "wrap", alignItems: "flex-start" },
    "& .RaList-actions > .MuiToolbar-root": { marginLeft: "auto" },
    "& .RaList-actions form": { flex: "1 1 520px" },
  },
  // `.RaList-actions` is a literal class; the filter form's own `RaFilterForm-
  // root` is emotion-generated and never lands in the DOM, so reach the form as
  // the toolbar's child element.
  "& .RaList-actions form": {
    display: "grid",
    // 170px is the narrowest track every control still reads well in; keeping
    // it there rather than wider is what fits the open cascade on two rows at
    // 1366 and on one at 1920, instead of stretching four controls over a row
    // and pushing the rest down.
    gridTemplateColumns: {
      xs: "repeat(auto-fill, minmax(140px, 1fr))",
      sm: "repeat(auto-fill, minmax(170px, 1fr))",
    },
    gap: 1,
    alignItems: "start",
  },
  "& .RaFilterForm-filterFormInput": {
    margin: 0,
    width: "auto",
    // RA sizes each input to its own content; in a track they all fill it.
    "& .MuiFormControl-root": { width: "100%", margin: 0 },
  },
  // A cascade step whose parent isn't chosen yet renders nothing, but RA still
  // wraps it in a cell holding its `&nbsp;` spacer — so the closed steps would
  // hold open empty columns. The spacer is the only tell that a cell is empty,
  // hence `:has`. The clearfix is a flex-row artefact the grid has no use for.
  "& .RaFilterFormInput-spacer, & .RaFilterForm-clearFix": { display: "none" },
  "& .RaFilterForm-filterFormInput:has(> .RaFilterFormInput-spacer:only-child)":
    { display: "none" },
});

export const StudentsList = () => (
  <List
    title="Estudiantes"
    filters={studentsFilters}
    // A section is ~30 students and a grade ~90, so 50 puts a filtered cohort on
    // one page; 10 made even a single section a four-page read.
    perPage={50}
    // RA persists the list params (filters, sort, page size) per store key and
    // replays them over this prop, so anyone who had already opened the list
    // would keep the old 10 forever. The suffix moves the list to a fresh slot
    // once; bump it again if a future default has to reach existing users.
    storeKey="students.listParams.perPage50"
    debounce={500}
    sx={[studentListSx, filterBarSx]}
  >
    <StudentListView />
  </List>
);
