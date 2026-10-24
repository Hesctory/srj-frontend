export type WithdrawnStudent = {
  id: number;
  enrollmentCode: string;
  fullName: string;
  level: string;
  gradeYear: string;
  section: string;
  shift: string;
  enrollmentDate: string;
  withdrawalDate: string;
};

/** Grade · shift · section · level collapsed into one column, skipping blanks. */
export const formatAcademic = (s: WithdrawnStudent): string => {
  const parts = [
    s.gradeYear != null && s.gradeYear !== "" ? `${s.gradeYear}°` : null,
    s.shift,
    s.section,
    s.level,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
};

/** Read "YYYY-MM-DD" straight from the string to avoid the timezone drift a
 *  bare `new Date("YYYY-MM-DD")` introduces; fall back to Date parsing. */
export const formatDate = (value?: string): string => {
  if (!value) return "—";
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-PE");
};
