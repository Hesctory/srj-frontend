import { useCallback, useState } from "react";
import { Identifier, useDataProvider, useNotify } from "react-admin";

interface UseEmploymentContractDetailReturn {
  detail: Record<string, unknown> | null;
  isLoading: boolean;
  fetchDetail: () => Promise<void>;
  updateDetail: (data: Record<string, unknown>) => void;
}

export const useEmploymentContractDetail = (
  id: Identifier,
): UseEmploymentContractDetailReturn => {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const fetchDetail = useCallback(async () => {
    if (detail) return;
    setIsLoading(true);
    try {
      const { data } = await dataProvider.getOne("employment-contracts", {
        id,
      });
      setDetail(data as Record<string, unknown>);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      notify(`Error al cargar contrato: ${message}`, { type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [detail, dataProvider, id, notify]);

  return { detail, isLoading, fetchDetail, updateDetail: setDetail };
};
