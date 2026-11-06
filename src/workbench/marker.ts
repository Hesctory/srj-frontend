/**
 * The workbench is a development tool. It must never reach the production
 * bundle: it is mounted only behind `import.meta.env.DEV` with a dynamic
 * import, and `scripts/check-dev-only-bundle.mjs` (run by `npm run verify`)
 * fails the build when this string or the workbench URL shows up in `dist/`.
 *
 * The constant is rendered as a data attribute by every workbench surface, so
 * the minifier cannot drop it: if the code ships, the marker ships with it.
 */
export const SRJ_WORKBENCH_DEV_ONLY = "SRJ_WORKBENCH_DEV_ONLY";

/** Fixed: the workbench host binds here and nowhere else. */
export const WORKBENCH_ORIGIN = "http://127.0.0.1:4100";
