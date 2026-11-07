import { useDataProvider } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import type { AppDataProvider } from "@/app/data-provider";

/** SUNAT's catalogue of credit-note reasons; loaded only when one is needed. */
export const useCreditNoteReasons = (enabled: boolean) => {
  const provider = useDataProvider<AppDataProvider>();
  return useQuery({
    queryKey: ["credit-note-reasons"],
    queryFn: () => provider.getCreditNoteReasons(),
    enabled,
    staleTime: Infinity,
  });
};
