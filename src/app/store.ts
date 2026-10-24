import { localStorageStore, type Store } from "react-admin";

/**
 * Store keys that are UI preferences rather than session data, so they must
 * survive a logout.
 *
 * React Admin's logout flow calls `store.reset()`, which drops every
 * `RaStore.*` entry. The theme mode lives there (`RaStore.theme`, written by
 * `useTheme`), so a plain reset makes a user who picked dark mode land back on
 * `defaultTheme` after logging out — and stay there after logging in again,
 * because the preference itself was deleted.
 */
const PRESERVED_KEYS = ["theme"] as const;

export const createAppStore = (): Store => {
  const store = localStorageStore();

  return {
    ...store,
    reset: () => {
      const preserved = PRESERVED_KEYS.map(
        (key) => [key, store.getItem(key)] as const,
      );
      store.reset();
      preserved.forEach(([key, value]) => {
        if (value !== undefined) store.setItem(key, value);
      });
    },
  };
};
