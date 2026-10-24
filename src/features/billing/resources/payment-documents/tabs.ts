import type { SunatStatusCode } from "@/types/payment-document";

/**
 * The four views of one collection.
 *
 * School receipts and electronic vouchers live in the same resource — the
 * difference between them is one field, not one endpoint. So this is a single
 * list with four presets rather than two pages: two routes would mean two
 * filter states, two paginations, and one detail page with two parents.
 *
 * Each tab is expressed entirely through `sunatStatusCode`, which the contract
 * accepts as an array. `voucherTypeCode` could not do the job — the contract
 * takes a single value there, so "the four electronic types" is not
 * expressible with it. This relies on internal receipts always arriving as
 * `NOT_APPLICABLE` and electronic ones never doing so.
 *
 * `columns` is what makes one page work instead of feeling like a compromise:
 * «Internos» drops the SUNAT column and the action column, because both would
 * be dead in every row, and «Observados» gains the rejection reason, because
 * there it is what dictates the next move.
 */

export type PaymentDocumentTabKey =
  | "all"
  | "electronic"
  | "internal"
  | "flagged";

export interface PaymentDocumentTab {
  key: PaymentDocumentTabKey;
  label: string;
  /** Applied on top of whatever the user set in the filter bar. */
  sunatStatusCode?: SunatStatusCode[];
  /** Shows the SUNAT status chip and the send/retry action. */
  showSunat: boolean;
  /** Shows `sunatMessage` inline — only where it drives the decision. */
  showReason: boolean;
  /** Carries the count badge: the rows that are actually waiting on someone. */
  isWorklist?: boolean;
}

export const PAYMENT_DOCUMENT_TABS: PaymentDocumentTab[] = [
  {
    key: "all",
    label: "Todos",
    showSunat: true,
    showReason: false,
  },
  {
    key: "electronic",
    label: "Electrónicos",
    sunatStatusCode: ["PENDING", "SENT", "ACCEPTED", "REJECTED"],
    showSunat: true,
    showReason: false,
  },
  {
    key: "internal",
    label: "Internos",
    sunatStatusCode: ["NOT_APPLICABLE"],
    showSunat: false,
    showReason: false,
  },
  {
    key: "flagged",
    label: "Observados",
    sunatStatusCode: ["PENDING", "REJECTED"],
    showSunat: true,
    showReason: true,
    isWorklist: true,
  },
];

export const tabByKey = (key: PaymentDocumentTabKey): PaymentDocumentTab =>
  PAYMENT_DOCUMENT_TABS.find((tab) => tab.key === key) ??
  PAYMENT_DOCUMENT_TABS[0];
