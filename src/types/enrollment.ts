import { Identifier } from "react-admin";

export interface EnrollmentSummary {
  id: Identifier;
  year: string | number;
  level: string;
  grade: string;
  shift: string;
  section: string;
  state: string;
}

/** Catalog item from `GET /required-documents` — the school-owned document list. */
export interface RequiredDocument {
  id: number;
  name: string;
}

/** Per-enrollment submission state for a single required document. */
export interface EnrollmentDocument {
  requiredDocumentId: number;
  submitted: boolean;
}
