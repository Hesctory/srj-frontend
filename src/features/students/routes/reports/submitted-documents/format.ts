export type SubmittedDocument = {
  requiredDocumentId: number;
  name: string;
  submitted: boolean;
};

export type SubmittedDocumentsRow = {
  id: number;
  fullName: string;
  level: string;
  gradeYear: string;
  section: string | null;
  shift: string;
  documents: SubmittedDocument[];
};

/** Grade · shift · section · level collapsed into one column, skipping blanks. */
export const formatAcademic = (r: SubmittedDocumentsRow): string => {
  const parts = [
    r.gradeYear != null && r.gradeYear !== "" ? `${r.gradeYear}°` : null,
    r.shift,
    r.section,
    r.level,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
};

/** Column headers, taken from the first row — every row repeats the whole
 *  catalogue in the same order, so any row describes the columns. */
export const documentHeaders = (rows: SubmittedDocumentsRow[]): string[] =>
  rows.length > 0 ? rows[0].documents.map((d) => d.name) : [];
