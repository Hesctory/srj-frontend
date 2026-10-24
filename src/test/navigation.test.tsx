import { describe, expect, it } from "vitest";
import { menuLeaves } from "@/app/navigation";
import { appResources, appRoutes } from "@/features";

/**
 * The menu and the registered pages must describe the same app.
 *
 * The old menu linked to fourteen placeholder pages, and two finished
 * resources sat unregistered with no way to reach them. Both directions are
 * checked here so neither can come back silently.
 */

/** Pages a user can land on: resources with a list, and every custom route. */
const listResourcePaths = appResources
  .filter((resource) => resource.props.list)
  .map((resource) => `/${resource.props.name}`);
const routePaths = appRoutes.map((route) => route.props.path);

const menuPaths = menuLeaves.map((leaf) => leaf.path);

/** True when `path` is a menu entry or nested under one (hub cards, details). */
const reachable = (path: string) =>
  menuPaths.some(
    (menuPath) => path === menuPath || path.startsWith(`${menuPath}/`),
  );

describe("navigation", () => {
  it("every menu entry opens a registered page", () => {
    const registered = new Set([...listResourcePaths, ...routePaths]);
    const dangling = menuPaths.filter((path) => !registered.has(path));

    expect(
      dangling,
      "These menu entries in src/app/navigation.tsx point at nothing. " +
        "Register the page in its feature barrel (`resources` or `routes` in " +
        "src/features/<feature>/index.tsx), or remove the entry. Do not add a " +
        "placeholder page: a screen without an API contract has no menu entry.",
    ).toEqual([]);
  });

  it("every registered page is reachable from the menu", () => {
    const orphans = [...listResourcePaths, ...routePaths].filter(
      (path) => !reachable(path),
    );

    expect(
      orphans,
      "These pages are registered but no menu entry leads to them. Add a " +
        "leaf to src/app/navigation.tsx, or nest the route under an existing " +
        "entry's path (as hub cards do: /students/reports/<report>).",
    ).toEqual([]);
  });

  it("menu entries are unique", () => {
    const duplicates = menuPaths.filter(
      (path, index) => menuPaths.indexOf(path) !== index,
    );

    expect(
      duplicates,
      "Each page appears once in the menu. Remove the repeated entries.",
    ).toEqual([]);
  });
});
