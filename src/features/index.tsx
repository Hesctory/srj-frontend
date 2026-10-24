import { cloneElement, type ReactElement } from "react";
import { CustomRoutes } from "react-admin";

import * as academic from "./academic";
import * as billing from "./billing";
import * as cashier from "./cashier";
import * as products from "./products";
import * as settings from "./settings";
import * as staff from "./staff";
import * as students from "./students";

// Every feature barrel exports the same two lists, so registering a feature is
// one line here and nothing in App.
const features = [
  cashier,
  billing,
  students,
  products,
  staff,
  academic,
  settings,
];

/** Every CRUD resource, keyed by name so App can render the list directly. */
export const appResources: ReactElement<{ name: string; list?: unknown }>[] =
  features.flatMap((feature) =>
    (feature.resources as ReactElement<{ name: string }>[]).map((resource) =>
      cloneElement(resource, { key: resource.props.name }),
    ),
  );

/** Every non-CRUD route. Each <Route> already carries its path as key. */
export const appRoutes: ReactElement<{ path: string }>[] = features.flatMap(
  (feature) => feature.routes as ReactElement<{ path: string }>[],
);

export const AppCustomRoutes = <CustomRoutes>{appRoutes}</CustomRoutes>;
