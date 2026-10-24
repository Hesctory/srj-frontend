import type { ReactElement } from "react";
import { tuitionRoutes } from "./tuition";

// Caja: everything that takes money at the counter. Each counter workflow is
// its own sub-area (tuition today; sales, payments and recovery next).
export const resources: ReactElement[] = [];
export const routes = [...tuitionRoutes];
