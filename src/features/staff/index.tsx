import type { ReactElement } from "react";
import { StaffMembersResource } from "./resources/staff-members";
import { WorkAreasResource } from "./resources/work-areas";
import { JobPositionsResource } from "./resources/job-positions";

export const resources = [
  StaffMembersResource,
  WorkAreasResource,
  JobPositionsResource,
];
export const routes: ReactElement[] = [];
