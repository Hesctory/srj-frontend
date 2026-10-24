import { Identifier } from "react-admin";

export interface EmploymentContractSummary {
  id: Identifier;
  schoolYear: string | number;
  jobPosition: string;
  institution: string;
  startDate: string;
  endDate: string | null;
}

export interface EmploymentContractDetail {
  id: Identifier;
  staffMemberId: Identifier;
  institutionId: number;
  schoolYearId: number;
  jobPositionId: number;
  areaId: number | null;
  startDate: string;
  endDate: string | null;
  salary: number | null;
}
