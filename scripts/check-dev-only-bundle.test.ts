// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findWorkbenchMarkers } from "./check-dev-only-bundle.mjs";

let dir: string;

const bundle = (files: Record<string, string>) => {
  dir = mkdtempSync(join(tmpdir(), "srj-bundle-"));
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, content);
  }
  return dir;
};

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("check-dev-only-bundle", () => {
  it("passes a bundle without workbench markers", () => {
    expect(
      findWorkbenchMarkers(
        bundle({ "index.html": "<html></html>", "assets/app.js": "x=1" }),
      ),
    ).toEqual([]);
  });

  it("finds the workbench URL and the marker constant in any file", () => {
    expect(
      findWorkbenchMarkers(
        bundle({
          "assets/app.js": 'fetch("http://127.0.0.1:4100/api/status")',
          "assets/nested/chunk.js": 'data-x="SRJ_WORKBENCH_DEV_ONLY"',
          "assets/clean.js": "ok",
        }),
      ).sort((a: { file: string }, b: { file: string }) =>
        a.file.localeCompare(b.file),
      ),
    ).toEqual([
      { file: join("assets", "app.js"), markers: ["127.0.0.1:4100"] },
      {
        file: join("assets", "nested", "chunk.js"),
        markers: ["SRJ_WORKBENCH_DEV_ONLY"],
      },
    ]);
  });
});
