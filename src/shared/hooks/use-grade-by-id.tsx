import { useGetOne } from "react-admin";
import type { GradeData } from "@/types/grade";

export const useGradeById = (
  id: number | undefined,
  enabled: boolean,
): GradeData | undefined => {
  const { data } = useGetOne<GradeData>(
    "grades",
    { id: id! },
    { enabled: enabled && !!id },
  );
  return data;
};
