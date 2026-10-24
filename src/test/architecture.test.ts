// @vitest-environment node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Structural tests: CLAUDE.md conventions that span files, which a per-file
 * lint rule cannot see. Each failure message says how to fix it.
 *
 * LEGACY lists hold violations that predate a check. They are debt, not
 * precedent: never copy those files' patterns, never add an entry without the
 * user's approval, and delete the entry once the file is fixed.
 */

const ROOT = resolve(__dirname, "../..");
const SRC = join(ROOT, "src");

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? [path, ...walk(path)] : [path];
  });

const entries = walk(SRC);
const dirs = entries.filter((path) => statSync(path).isDirectory());
const sourceFiles = entries.filter(
  (path) => /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path),
);
const rel = (path: string) => relative(ROOT, path);
const read = (path: string) => readFileSync(path, "utf8");

/** Names imported from react-admin by a file. */
const reactAdminImports = (source: string) =>
  [...source.matchAll(/import\s*{([^}]*)}\s*from\s*"react-admin"/g)].flatMap(
    ([, names]) => names.split(",").map((name) => name.trim()),
  );

/** Screens that render a React Admin <Create> or <Edit>. */
const formScreens = sourceFiles.filter((path) => {
  const source = read(path);
  const imports = reactAdminImports(source);
  return (
    (imports.includes("Create") && /<Create[\s>]/.test(source)) ||
    (imports.includes("Edit") && /<Edit[\s>]/.test(source))
  );
});

/** Resolves an import specifier the way Vite does (`@/` alias or `./`). */
const resolveImport = (fromFile: string, specifier: string) => {
  const base = specifier.startsWith("@/")
    ? join(SRC, specifier.slice(2))
    : resolve(dirname(fromFile), specifier);
  return [".tsx", ".ts", "/index.tsx", "/index.ts"]
    .map((ext) => base + ext)
    .find((candidate) => existsSync(candidate));
};

const LEGACY_API_FOLDERS = [
  // TODO: move these endpoints into src/app/data-provider.ts.
  "src/features/cashier/tuition/api",
  "src/features/billing/api",
];

const LEGACY_WITHOUT_CRUD_TOOLBAR: string[] = [];

const LEGACY_FLEX_FORM_LAYOUT: string[] = [];

describe("architecture", () => {
  it("features never own an HTTP layer (no api/ folders)", () => {
    const offenders = dirs
      .filter((dir) => /\/src\/features\/.+\/api$/.test(dir))
      .map(rel)
      .filter((dir) => !LEGACY_API_FOLDERS.includes(dir));

    expect(
      offenders,
      "Only src/app/data-provider.ts talks to the backend. Add the endpoint as " +
        "a dataProvider method (or URL mapping) and call it through " +
        "useDataProvider() inside useQuery/useMutation.",
    ).toEqual([]);
  });

  it("file and folder names are kebab-case", () => {
    const offenders = entries
      .filter((path) => rel(path) !== "src/app/App.tsx")
      .filter((path) => {
        const name = path.slice(path.lastIndexOf("/") + 1);
        return statSync(path).isDirectory()
          ? !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)
          : !/^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+)+$/.test(name);
      })
      .map(rel);

    expect(
      offenders,
      "Rename to kebab-case, e.g. staff-members-list.tsx (CLAUDE.md → Naming).",
    ).toEqual([]);
  });

  it("src/utils is the only shared utils folder", () => {
    // A feature (or a sub-area of one, e.g. cashier/tuition) may keep its own
    // utils/; code shared across features may not.
    const offenders = dirs
      .filter((dir) => dir.endsWith("/utils"))
      .map(rel)
      .filter(
        (dir) =>
          dir !== "src/utils" &&
          !/^src\/features\/[^/]+(\/[^/]+)?\/utils$/.test(dir),
      );

    expect(
      offenders,
      "Move shared helpers into src/utils/ (CLAUDE.md → Data layer).",
    ).toEqual([]);
  });

  it("every Create/Edit form uses CRUDToolBar", () => {
    const usesCrudToolbar = (path: string) => {
      const source = read(path);
      if (source.includes("CRUDToolBar")) return true;
      // A screen may pass its own toolbar component that wraps CRUDToolBar.
      return [...source.matchAll(/toolbar=\{<(\w+)/g)].some(([, name]) => {
        const specifier = source.match(
          new RegExp(`import\\s+${name}\\s+from\\s+"([^"]+)"`),
        )?.[1];
        const file = specifier && resolveImport(path, specifier);
        return !!file && read(file).includes("CRUDToolBar");
      });
    };

    const offenders = formScreens
      .filter((path) => !usesCrudToolbar(path))
      .map(rel)
      .filter((path) => !LEGACY_WITHOUT_CRUD_TOOLBAR.includes(path));

    expect(
      offenders,
      "Pass toolbar={<CRUDToolBar save />} (add `delete` when the record can " +
        "be deleted; extra actions go as children). See " +
        "src/app/layout/crud-toolbar.tsx.",
    ).toEqual([]);
  });

  it("every Create is pessimistic", () => {
    const offenders = formScreens
      .filter((path) => /<Create[\s>]/.test(read(path)))
      .filter((path) => {
        const create = read(path).match(/<Create[\s>][^>]*>/s)?.[0] ?? "";
        return !create.includes('mutationMode="pessimistic"');
      })
      .map(rel);

    expect(
      offenders,
      'Add mutationMode="pessimistic" to <Create> (CLAUDE.md → React Admin conventions).',
    ).toEqual([]);
  });

  it("every filtered List debounces", () => {
    const offenders = sourceFiles
      .filter((path) => reactAdminImports(read(path)).includes("List"))
      .filter((path) => {
        const lists = read(path).match(/<List[\s>][^>]*>/gs) ?? [];
        return lists.some(
          (list) => list.includes("filters=") && !list.includes("debounce="),
        );
      })
      .map(rel);

    expect(
      offenders,
      "Add debounce={500} to every <List> that has filters.",
    ).toEqual([]);
  });

  it("form screens lay fields out with FormGrid, not flex rows", () => {
    const offenders = formScreens
      .filter((path) => /display="flex"|display: "flex"/.test(read(path)))
      .map(rel)
      .filter((path) => !LEGACY_FLEX_FORM_LAYOUT.includes(path));

    expect(
      offenders,
      "Use FormGrid / FormSection / InlineFields from " +
        '@/shared/components/form-grid instead of <Box display="flex"> rows. ' +
        "They wrap and reflow at every target resolution.",
    ).toEqual([]);
  });

  it("legacy lists only name things that still exist", () => {
    const stale = [
      ...LEGACY_API_FOLDERS,
      ...LEGACY_WITHOUT_CRUD_TOOLBAR,
      ...LEGACY_FLEX_FORM_LAYOUT,
    ].filter((path) => !existsSync(join(ROOT, path)));

    expect(
      stale,
      "The debt is paid: delete these entries from the LEGACY lists.",
    ).toEqual([]);
  });
});
