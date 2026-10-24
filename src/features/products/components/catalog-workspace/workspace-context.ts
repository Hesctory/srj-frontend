import { createContext, useContext } from "react";

export interface CatalogWorkspace {
  /**
   * Too narrow for list and editor side by side: each is its own page, and
   * the editor carries the year selector the hidden list would have.
   */
  narrow: boolean;
  /**
   * The editor says how wide its grid gets, so the pane hugs it instead of
   * stretching into blank space on a wide screen. Null: no grid yet.
   */
  setEditorWidth: (width: number | null) => void;
  /** The editor reports unsaved changes here… */
  setDirty: (dirty: boolean) => void;
  /**
   * …so the ways out the workspace owns (another product, Nuevo, Volver) can
   * ask first. True when leaving is fine.
   */
  confirmLeave: () => boolean;
}

export const CatalogWorkspaceContext = createContext<CatalogWorkspace>({
  narrow: false,
  setEditorWidth: () => {},
  setDirty: () => {},
  confirmLeave: () => true,
});

export const useCatalogWorkspace = () => useContext(CatalogWorkspaceContext);
