import { lazy, Suspense, type ComponentType } from "react";

/**
 * The only door into src/workbench, the development-only console that drives
 * the backend's workbench host. Everything here sits behind
 * `import.meta.env.DEV` with a dynamic import(): `vite build` turns that into
 * `false`, the import is dropped, and no workbench chunk is emitted.
 * `npm run verify` checks the built bundle for workbench markers and fails if
 * any shipped (scripts/check-dev-only-bundle.mjs).
 *
 * Never import src/workbench any other way (ESLint refuses a static import).
 * In production both components render nothing.
 */

export type DevWorkbenchButtonProps =
  | { action: "prepare-enrollment"; studentId: number }
  | { action: "prepare-payments"; studentId: number; enrollmentId: number };

const Console: ComponentType | null = import.meta.env.DEV
  ? lazy(() => import("@/workbench/workbench-console"))
  : null;

const ContextButton: ComponentType<DevWorkbenchButtonProps> | null = import.meta
  .env.DEV
  ? lazy(() => import("@/workbench/context-button"))
  : null;

/** The floating console and its launcher. Mounted once, by the layout. */
export const DevWorkbenchConsole = () =>
  Console ? (
    <Suspense fallback={null}>
      <Console />
    </Suspense>
  ) : null;

/** "Prepare … for this …": opens the console with that form filled in. */
export const DevWorkbenchButton = (props: DevWorkbenchButtonProps) =>
  ContextButton ? (
    <Suspense fallback={null}>
      <ContextButton {...props} />
    </Suspense>
  ) : null;
