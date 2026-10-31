import type { ReactElement } from "react";
import { SchoolYearsResource } from "./resources/school-years";
import { LevelsResource } from "./resources/levels";
import { GradesResource } from "./resources/grades";
import { GradeOfferingsResource } from "./resources/grade-offerings";
import { ClassroomsResource } from "./resources/classrooms";
import { SchoolFeesResource } from "./resources/school-fees";
import { SchoolFeeConceptsResource } from "./resources/school-fee-concepts";

export const resources = [
  SchoolYearsResource,
  LevelsResource,
  GradesResource,
  GradeOfferingsResource,
  ClassroomsResource,
  SchoolFeesResource,
  SchoolFeeConceptsResource,
];
export const routes: ReactElement[] = [];
