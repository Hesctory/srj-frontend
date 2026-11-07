import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// The suite runs in many parallel workers; a loaded machine renders slowly,
// so `findBy*`/`waitFor` wait longer than the 1s default before giving up.
configure({ asyncUtilTimeout: 5000 });

// Globals are off, so Testing Library cannot register its own cleanup.
afterEach(() => {
  cleanup();
  // Absent in the node environment used by the structural tests.
  globalThis.localStorage?.clear();
});
