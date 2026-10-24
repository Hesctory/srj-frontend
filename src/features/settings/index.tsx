import type { ReactElement } from "react";
import { InstitutionsResource } from "./resources/institutions";
import { AccountingPlanResource } from "./resources/accounting-plan";

export const resources = [InstitutionsResource, AccountingPlanResource];
export const routes: ReactElement[] = [];
