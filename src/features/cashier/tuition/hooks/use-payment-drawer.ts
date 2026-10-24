import { useCallback, useState } from "react";
import type { EnrollmentCharge } from "@/types/enrollment-charge";

/** What a payment is being applied to, resolved by the page that opens it. */
export interface PaymentTarget {
  /** Heading copy: "Pensión Abril - 2026", "Todos los cargos pendientes". */
  label: string;
  /** Sub-heading: due date, allocation rule, whatever qualifies the target. */
  hint?: string;
  /** Ceiling for the tender total. The server rejects anything above it. */
  outstanding: number;
  /**
   * Settle these obligations specifically — and the only way to reach a charge
   * that is not yet effective. Omitted for a whole-enrollment payment, where
   * the server allocates oldest due date first.
   */
  obligationIds?: number[];
}

export type PaymentDrawerMode = "pay" | "details";

/**
 * `open` is tracked separately from the payload so a closing drawer still has
 * something to render while it slides out; `clearContent` (wired to the exit
 * transition) is what actually empties it.
 */
export interface PaymentDrawerState {
  open: boolean;
  mode: PaymentDrawerMode | null;
  target: PaymentTarget | null;
  charge: EnrollmentCharge | null;
  /**
   * Bumped on every open. Used as the React key of the drawer body so each
   * opening gets a fresh form and a fresh flow — otherwise the previous
   * charge's half-typed tenders would greet the next one.
   */
  openId: number;
}

const CLOSED: PaymentDrawerState = {
  open: false,
  mode: null,
  target: null,
  charge: null,
  openId: 0,
};

const usePaymentDrawer = () => {
  const [drawerState, setDrawerState] = useState<PaymentDrawerState>(CLOSED);

  const openPay = useCallback(
    (target: PaymentTarget) =>
      setDrawerState((current) => ({
        open: true,
        mode: "pay",
        target,
        charge: null,
        openId: current.openId + 1,
      })),
    [],
  );

  const openDetails = useCallback(
    (charge: EnrollmentCharge) =>
      setDrawerState((current) => ({
        open: true,
        mode: "details",
        target: null,
        charge,
        openId: current.openId + 1,
      })),
    [],
  );

  const closeDrawer = useCallback(
    () => setDrawerState((current) => ({ ...current, open: false })),
    [],
  );

  /** Call once the drawer has finished sliding out. `openId` survives so keys stay unique. */
  const clearContent = useCallback(
    () => setDrawerState((current) => ({ ...CLOSED, openId: current.openId })),
    [],
  );

  return { drawerState, openPay, openDetails, closeDrawer, clearContent };
};

export default usePaymentDrawer;
