import { beforeEach, describe, expect, it, vi } from "vitest";

// A circular import between two feature barrels only fails (ReferenceError,
// TDZ) when the cycle is entered from a particular barrel, so each barrel is
// evaluated first in a fresh module graph.
const barrels = [
  "academic",
  "billing",
  "cashier",
  "cashier/recovery",
  "products",
  "settings",
  "staff",
  "students",
];

describe("feature registry", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it.each(barrels)(
    "evaluates the %s barrel as the entry point",
    async (name) => {
      const barrel = await import(
        /* @vite-ignore */ `@/features/${name}/index`
      );

      const resources = barrel.resources ?? barrel.recoveryResources;
      expect(resources.length).toBeGreaterThan(0);
      for (const resource of resources) expect(resource).toBeDefined();
      for (const route of barrel.routes ?? barrel.recoveryRoutes) {
        expect(route).toBeDefined();
      }
    },
  );

  it("registers every resource and route in the app", async () => {
    const { appResources, appRoutes, AppCustomRoutes } =
      await import("@/features");

    expect(appResources.length).toBeGreaterThan(0);
    for (const resource of appResources) {
      expect(resource.props.name).toBeTruthy();
    }
    for (const route of appRoutes) expect(route.props.path).toBeTruthy();
    expect(AppCustomRoutes).toBeDefined();
  });
});
