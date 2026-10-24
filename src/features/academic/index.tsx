import type { ReactElement } from "react";
import { SchoolYearsResource } from "./resources/school-years";
import { LevelsResource } from "./resources/levels";
import { GradesResource } from "./resources/grades";
import { GradeOfferingsResource } from "./resources/grade-offerings";
import { ClassroomsResource } from "./resources/classrooms";
import { CostsResource } from "./resources/costs";

export const resources = [
  SchoolYearsResource,
  LevelsResource,
  GradesResource,
  GradeOfferingsResource,
  ClassroomsResource,
  CostsResource,
];
export const routes: ReactElement[] = [];
