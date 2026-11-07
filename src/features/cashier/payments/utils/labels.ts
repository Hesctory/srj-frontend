import type { PaymentPartyType } from "@/types/payment";

const PARTY_LABEL: Record<PaymentPartyType, string> = {
  STUDENT: "Alumno",
  GUARDIAN: "Apoderado",
  PROVIDER: "Proveedor",
  STAFF: "Personal",
};

export const partyTypeLabel = (code: string | null | undefined): string =>
  (code && PARTY_LABEL[code as PaymentPartyType]) || "";

/** "Efectivo, Tarjeta": the distinct media of payment of a payment. */
export const tendersSummary = (
  tenders: { paymentMethodName: string | null }[] | null | undefined,
): string => {
  const names = [
    ...new Set(
      (tenders ?? []).map((tender) => tender.paymentMethodName).filter(Boolean),
    ),
  ];
  return names.join(", ");
};
