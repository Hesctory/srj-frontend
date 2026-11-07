import type { ReactElement } from "react";
import { tuitionRoutes } from "./tuition";
import { recoveryResources, recoveryRoutes } from "./recovery";
import { paymentsResources } from "./payments";

// Caja: everything that takes money at the counter. Each counter workflow is
// its own sub-area (tuition, payments and recovery today; sales next).
export const resources: ReactElement[] = [
  ...paymentsResources,
  ...recoveryResources,
];
export const routes = [...tuitionRoutes, ...recoveryRoutes];
