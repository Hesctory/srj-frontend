import { useCallback, useMemo, useState } from "react";
import type { PaymentLine, PaymentMethod } from "@/types/payment";
import {
  parseAmount,
  parseCommission,
  sumMoney,
} from "@/features/cashier/tuition/utils/payments";

/**
 * The compose-step form state: one date and one or more tenders.
 *
 * Amounts live as strings so a half-typed "35." is not silently coerced to 35;
 * `lines` converts to the numeric shape the API expects, and is `null` while
 * anything is invalid.
 */

export interface TenderDraft {
  /** Stable identity for the React key and the aria-labels. Never sent. */
  key: string;
  paymentMethodId: number | "";
  /** Raw field text. Toward the debt — never includes a card commission. */
  amount: string;
  reference: string;
  /**
   * Raw field text, read off the card terminal's slip. Blank takes the
   * server's suggestion; ignored on a method that takes no commission.
   */
  commission: string;
}

export interface TenderIssues {
  paymentMethodId?: string;
  amount?: string;
  commission?: string;
}

let sequence = 0;
const emptyTender = (): TenderDraft => ({
  key: `tender-${(sequence += 1)}`,
  paymentMethodId: "",
  amount: "",
  reference: "",
  commission: "",
});

export interface PaymentDraftController {
  date: string;
  tenders: TenderDraft[];
  /** Per-tender validation, keyed by `TenderDraft.key`. */
  issues: Record<string, TenderIssues>;
  /** Whole-form refusal, e.g. the total exceeding the outstanding balance. */
  totalIssue: string | null;
  /** Sum of the parsed amounts. Toward the debt, before any commission. */
  total: number;
  /** `outstanding - total`, floored at 0. */
  remaining: number;
  /** The API payload, or `null` while the draft is invalid. */
  lines: PaymentLine[] | null;
  canRemoveTender: boolean;
  /** True when the tender's method charges a card commission today. */
  takesCommission: (tender: TenderDraft) => boolean;
  setDate: (date: string) => void;
  updateTender: (key: string, patch: Partial<Omit<TenderDraft, "key">>) => void;
  addTender: () => void;
  removeTender: (key: string) => void;
  /** Drops the unpaid remainder into the last tender. */
  fillRemaining: () => void;
  reset: () => void;
}

/**
 * @param outstanding Ceiling for the total. The server rejects (400) anything
 *   above the outstanding balance, so the form refuses it first.
 * @param defaultDate The statement's `asOf` — the server's today. The page
 *   never calls `new Date()` for a business date.
 * @param methods The catalogue; a method's `rate` says whether a line paid
 *   with it asks for a commission.
 */
const usePaymentDraft = (
  outstanding: number,
  defaultDate: string,
  methods: PaymentMethod[],
): PaymentDraftController => {
  const [date, setDate] = useState(defaultDate);
  const [tenders, setTenders] = useState<TenderDraft[]>(() => [emptyTender()]);

  const updateTender = useCallback(
    (key: string, patch: Partial<Omit<TenderDraft, "key">>) =>
      setTenders((current) =>
        current.map((tender) =>
          tender.key === key ? { ...tender, ...patch } : tender,
        ),
      ),
    [],
  );

  const addTender = useCallback(
    () => setTenders((current) => [...current, emptyTender()]),
    [],
  );

  const removeTender = useCallback(
    (key: string) =>
      setTenders((current) =>
        // Never leave the form with nothing to fill in.
        current.length > 1
          ? current.filter((tender) => tender.key !== key)
          : current,
      ),
    [],
  );

  const reset = useCallback(() => {
    setDate(defaultDate);
    setTenders([emptyTender()]);
  }, [defaultDate]);

  const takesCommission = useCallback(
    (tender: TenderDraft) =>
      methods.some(
        (method) =>
          method.id === tender.paymentMethodId && method.rate !== null,
      ),
    [methods],
  );

  const { issues, total, lines } = useMemo(() => {
    const collected: Record<string, TenderIssues> = {};
    const parsed: PaymentLine[] = [];
    // Every readable amount counts toward the running total, even on a tender
    // whose method is still unset — picking a method is a condition of
    // *submitting*, not of arithmetic. Summing only complete tenders left the
    // cashier staring at "S/ 0.00" with a figure typed in front of them, and
    // silently disarmed the over-the-balance guard.
    const amounts: number[] = [];
    let valid = true;

    tenders.forEach((tender) => {
      const amount = parseAmount(tender.amount);
      const tenderIssues: TenderIssues = {};

      if (tender.paymentMethodId === "") {
        tenderIssues.paymentMethodId = "Elige un medio de pago";
      }
      if (tender.amount.trim() === "") {
        tenderIssues.amount = "Ingresa un monto";
      } else if (amount === null) {
        tenderIssues.amount = "Debe ser un monto mayor a 0";
      }

      // Only a card line sends one: a commission left behind after switching
      // to cash would be refused (422), and the field is hidden by then.
      const commission = takesCommission(tender)
        ? parseCommission(tender.commission)
        : null;
      if (commission === undefined) {
        tenderIssues.commission = "Debe ser un monto de 0 o más";
      } else if (
        commission !== null &&
        amount !== null &&
        commission >= amount
      ) {
        tenderIssues.commission = "Debe ser menor al monto";
      }

      collected[tender.key] = tenderIssues;
      if (amount !== null) amounts.push(amount);

      if (
        tender.paymentMethodId !== "" &&
        amount !== null &&
        !tenderIssues.commission
      ) {
        parsed.push({
          paymentMethodId: tender.paymentMethodId,
          amount,
          reference: tender.reference.trim() || null,
          commission: commission ?? null,
        });
      } else {
        valid = false;
      }
    });

    return {
      issues: collected,
      total: sumMoney(amounts),
      lines: valid && parsed.length > 0 ? parsed : null,
    };
  }, [tenders, takesCommission]);

  // `outstanding <= 0` means the caller could not work out a ceiling; leave the
  // limit to the server rather than blocking a legitimate payment.
  const totalIssue =
    outstanding > 0 && total > outstanding
      ? "El total supera el saldo pendiente."
      : null;

  return {
    date,
    tenders,
    issues,
    totalIssue,
    total,
    remaining: Math.max(0, Math.round((outstanding - total) * 100) / 100),
    lines: totalIssue ? null : lines,
    canRemoveTender: tenders.length > 1,
    takesCommission,
    setDate,
    updateTender,
    addTender,
    removeTender,
    fillRemaining: () =>
      setTenders((current) => {
        const paid = sumMoney(
          current.map((tender) => parseAmount(tender.amount) ?? 0),
        );
        const left = Math.round((outstanding - paid) * 100) / 100;
        if (left <= 0) return current;
        const last = current[current.length - 1];
        const lastAmount = parseAmount(last.amount) ?? 0;
        return current.map((tender, index) =>
          index === current.length - 1
            ? { ...tender, amount: (lastAmount + left).toFixed(2) }
            : tender,
        );
      }),
    reset,
  };
};

export default usePaymentDraft;
