import type { ReactNode } from "react";

export interface GridCellSpec {
  value: number | null;
  /** Differs from what is saved. */
  changed?: boolean;
  ariaLabel: string;
  /** Stock cells: opens the kardex. */
  onOpen?: () => void;
}

export interface GridRowSpec {
  id: string;
  /** "Venta S/", "Costo S/", "Stock". */
  label: string;
  kind: "price" | "stock";
  /** Aligned with the grid's columns; null where the version lacks that size. */
  cells: (GridCellSpec | null)[];
}

/** One version: its header, its rows, and whatever it says below them. */
export interface GridSectionSpec {
  id: string;
  header?: ReactNode;
  rows: GridRowSpec[];
  footer?: ReactNode;
}

export interface GridWrite {
  rowId: string;
  col: number;
  value: number | null;
}
