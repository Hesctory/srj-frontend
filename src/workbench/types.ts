/** Shapes of the workbench host's JSON API (tools/Workbench in the backend). */

export type NubefactMode = "off" | "simulated" | "real";
export type SendHistory = "none" | "simulated" | "real";

export interface WorkspaceStatus {
  businessDate: string;
  followingToday: boolean;
  mode: NubefactMode;
  history: SendHistory;
  counts: {
    students: number;
    relatives: number;
    enrollments: number;
    payments: number;
    documents: number;
  };
  snapshotCount: number;
  snapshotCap: number;
  snapshotBytes: number;
  backendRunning: boolean;
  realAvailable: boolean;
  realAccount: string | null;
  busy: boolean;
  workspaceExists: boolean;
  frontendUrl: string;
  backendUrl: string;
  realSendsEver: boolean;
  realUnavailableReason: string | null;
  /** SUNAT voucher code ("03") → last number the Nubefact account holds. */
  realHighWater: Record<string, number>;
}

export interface WorkbenchOptions {
  schoolYears: { id: number; year: number; active: boolean }[];
  grades: { id: number; name: string; levelId: number; levelName: string }[];
  shifts: {
    schoolYearId: number;
    gradeId: number;
    shiftId: number;
    name: string;
  }[];
  feeConcepts: { id: number; name: string }[];
  paymentMethods: { id: number; name: string }[];
  enrollments:
    | {
        id: number;
        schoolYearId: number;
        year: number;
        gradeId: number;
        gradeName: string;
        enrollmentDate: string;
      }[]
    | null;
  charges:
    | {
        id: number;
        obligationId: number;
        type: string;
        chargeTypeId: number;
        month: number | null;
        monthName: string | null;
        outstanding: number;
        dueDate: string;
        status: string;
      }[]
    | null;
}

export interface StudentMatch {
  id: number;
  fullName: string;
  dni: string | null;
}

export interface CreatedRecord {
  kind: string;
  id: number;
  label: string;
  frontendLink: string | null;
  apiLink: string | null;
}

export interface ActionResult {
  ok: boolean;
  committed: boolean;
  refusal: string | null;
  created: CreatedRecord[];
  steps: string[];
}

export interface OperationResult {
  message: string;
  warnings: string[];
}

export interface LogEntry {
  timeUtc: string;
  kind: "action" | "workspace";
  name: string;
  inputs: unknown;
  result: "ok" | "refused" | "failed";
  message: string | null;
  created: CreatedRecord[];
  businessDate: string;
}

export interface SnapshotRecord {
  id: string;
  name: string;
  database: string;
  createdUtc: string;
  businessDate: string;
  wasFollowingToday: boolean;
  state: { mode: NubefactMode };
}

export interface RestorePreview {
  snapshotId: string;
  name: string;
  snapshotBusinessDate: string;
  snapshotMode: NubefactMode;
  actionsThatWillBeLost: LogEntry[];
  warnings: string[];
}

export type ActionName =
  | "generate-students"
  | "prepare-enrollment"
  | "prepare-payments";

export interface GenerateStudentsInput {
  count: number;
  schoolYearId: number;
  gradeId: number;
  shiftId: number;
  schoolFeeConceptId: number;
  enrollmentDate: string;
}

export interface PrepareEnrollmentInput {
  studentId: number | null;
  schoolYearId: number;
  gradeId: number;
  shiftId: number;
  schoolFeeConceptId: number;
  enrollmentDate: string;
}

export type PaymentPlanKind = "firstMonths" | "chosenMonths" | "partialAmounts";

export interface PreparePaymentsInput {
  enrollmentId: number;
  kind: PaymentPlanKind;
  monthCount?: number;
  months?: { month: number; date: string | null }[];
  partials?: { amount: number; date: string }[];
  includeEnrollmentCharges: boolean;
  paymentMethodId: number;
  issueDocuments: boolean;
}
