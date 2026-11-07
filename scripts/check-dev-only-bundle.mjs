#!/usr/bin/env node
// Sensor: the development-only workbench (src/workbench) must never ship.
// It is loaded only behind `import.meta.env.DEV` with a dynamic import(), which
// `vite build` drops; this script proves it by searching the built bundle for
// the workbench's URL and its marker constant. `npm run verify` runs it after
// the build, so CI fails the moment an ungated import lets the code through.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const WORKBENCH_MARKERS = ["127.0.0.1:4100", "SRJ_WORKBENCH_DEV_ONLY"];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

/** Every file in `dir` that contains a marker, with the markers it contains. */
export const findWorkbenchMarkers = (dir) =>
  walk(dir).flatMap((file) => {
    const text = readFileSync(file, "latin1");
    const found = WORKBENCH_MARKERS.filter((marker) => text.includes(marker));
    return found.length ? [{ file: relative(dir, file), markers: found }] : [];
  });

const main = () => {
  const dist = resolve(process.argv[2] ?? "dist");
  let hits;
  try {
    hits = findWorkbenchMarkers(dist);
  } catch (error) {
    console.error(
      `check-dev-only-bundle: cannot read ${dist} (${error.message}). Run \`vite build\` first.`,
    );
    process.exit(1);
  }
  if (hits.length) {
    console.error(
      "check-dev-only-bundle: the development-only workbench reached the production bundle:",
    );
    for (const hit of hits)
      console.error(`  ${hit.file}: ${hit.markers.join(", ")}`);
    console.error(
      "Load src/workbench only through src/shared/components/dev-workbench.tsx " +
        "(a dynamic import() behind `import.meta.env.DEV`). Look for a static " +
        "import of @/workbench, or a workbench URL or marker used outside it.",
    );
    process.exit(1);
  }
  console.log(
    `check-dev-only-bundle: no workbench markers in ${relative(process.cwd(), dist) || "."}.`,
  );
};

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();
