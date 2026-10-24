import { Identifier } from "react-admin";

/**
 * Row shape returned by `GET /students` (the list endpoint).
 *
 * The academic fields are the student's *current* enrollment placement, already
 * resolved to display names by the backend — lists render them directly instead
 * of joining the levels/grades/shifts/sections catalogs client-side.
 *
 * They are nullable on purpose: a student created but not yet enrolled has no
 * placement, so every list must render a placeholder rather than an empty cell.
 * The detail endpoint (`GET /students/:id`) returns the full record used by the
 * create/edit forms and is intentionally not modelled here.
 */
export interface StudentListItem {
  id: Identifier;
  fullName: string;
  dni: string;
  enrollmentCode: string | null;
  level: string | null;
  grade: string | null;
  shift: string | null;
  section: string | null;
}
