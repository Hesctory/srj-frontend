import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import {
  AdminContext,
  ResourceContextProvider,
  memoryStore,
  testDataProvider,
  type DataProvider,
} from "react-admin";
import polyglotI18nProvider from "ra-i18n-polyglot";
import spanishMessages from "@/app/i18n/es";

const i18nProvider = polyglotI18nProvider(() => spanishMessages, "es");

interface RenderWithAdminOptions {
  /**
   * Only the methods the test needs; the rest reject so a surprise call is
   * loud. Loosely typed so plain `vi.fn` mocks fit without generic gymnastics.
   */
  dataProvider?: Partial<
    Record<keyof DataProvider, (...args: never[]) => Promise<unknown>>
  >;
  /** The resource the component renders for (List/Edit/Create read it). */
  resource?: string;
}

/**
 * Renders a React Admin component the way the app does — Spanish i18n, a fresh
 * store, a fake dataProvider — without the router-level <Admin> shell.
 *
 * This is the integration-test entry point: render a real page, drive it like a
 * user with @testing-library/user-event, and assert on what the user sees and
 * on the dataProvider calls it made. Mock the dataProvider, never HTTP.
 */
export const renderWithAdmin = (
  ui: ReactNode,
  { dataProvider = {}, resource }: RenderWithAdminOptions = {},
) =>
  render(
    <AdminContext
      dataProvider={testDataProvider(dataProvider as Partial<DataProvider>)}
      i18nProvider={i18nProvider}
      store={memoryStore()}
    >
      {resource ? (
        <ResourceContextProvider value={resource}>{ui}</ResourceContextProvider>
      ) : (
        ui
      )}
    </AdminContext>,
  );
