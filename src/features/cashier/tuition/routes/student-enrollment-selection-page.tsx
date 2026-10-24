import { useState } from "react";
import { Box } from "@mui/material";
import { Identifier, ListBase, Title } from "react-admin";
import { useSearchParams } from "react-router-dom";
import EnrollmentPicker from "@/features/cashier/tuition/components/enrollment-picker";
import SelectedStudentCard from "@/features/cashier/tuition/components/selected-student-card";
import StudentResults from "@/features/cashier/tuition/components/student-results";
import StudentSearchBar from "@/features/cashier/tuition/components/student-search-bar";

/**
 * Step 1 of the payment flow: pick the student *and* the matrícula.
 *
 * This used to be two pages (the student search, then
 * `/:studentId/enrollments`). They are one now because the second one only
 * ever asked a single question — which year — and a cashier working from a
 * DNI paid a full page transition for it.
 *
 * The picked student lives in the query string rather than in state alone, so
 * a refresh, a bookmark, or the back button from the account statement all
 * land on the same student instead of an empty search.
 */
const SelectionLayout = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const studentParam = searchParams.get("studentId");
  // Number, not the raw string: the enrollments filter is compared against a
  // numeric id server-side, and `Number("")`/`Number("abc")` would otherwise
  // send a NaN through as a filter value.
  const parsed = studentParam ? Number(studentParam) : NaN;
  const studentId: Identifier | undefined = Number.isFinite(parsed)
    ? parsed
    : undefined;

  // Opened by touching any filter, closed by picking someone. With nobody
  // picked yet the results are the whole page and cannot be closed.
  const [searching, setSearching] = useState(!studentId);
  const showResults = !studentId || searching;

  const pick = (id: Identifier) => {
    setSearchParams({ studentId: String(id) }, { replace: true });
    setSearching(false);
  };

  return (
    <Box width="100%" maxWidth={1040} mx="auto" pb={3}>
      <Title title="Pensiones" />
      <StudentSearchBar onSearch={() => setSearching(true)} />

      {studentId && (
        <SelectedStudentCard
          studentId={studentId}
          highlighted={showResults}
          onClick={() => setSearching(false)}
        />
      )}

      {showResults ? (
        <StudentResults onPick={pick} />
      ) : (
        <EnrollmentPicker studentId={studentId!} />
      )}
    </Box>
  );
};

export const StudentEnrollmentSelectionPage = () => (
  <ListBase resource="students" debounce={500} disableSyncWithLocation>
    <SelectionLayout />
  </ListBase>
);
