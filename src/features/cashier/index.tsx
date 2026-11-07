import type { ReactElement } from "react";
import { tuitionRoutes } from "./tuition";
import { recoveryResources, recoveryRoutes } from "./recovery";

// Caja: everything that takes money at the counter. Each counter workflow is
// its own sub-area (tuition and recovery today; sales and payments next).
export const resources: ReactElement[] = [...recoveryResources];
export const routes = [...tuitionRoutes, ...recoveryRoutes];
