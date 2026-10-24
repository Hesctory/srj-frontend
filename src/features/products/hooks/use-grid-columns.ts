import { useMemo } from "react";
import { useGetList } from "react-admin";
import type { ProductVersion } from "@/types/product";
import type { ProductAxis } from "@/features/products/resources/products/product-constants";
import {
  gradeColumns,
  sizeColumns,
  uniqueColumns,
  type GradeRow,
  type LevelRow,
} from "@/features/products/utils/grid-columns";
import useSizes from "./use-sizes";

interface UseGridColumnsOptions {
  axis: ProductAxis;
  sizeScaleId: number | null;
  /**
   * With versions, grade columns are the grades those versions sell (a book
   * rarely covers every level). Without them — creating a product — every
   * grade is offered.
   */
  versions?: ProductVersion[];
}

export const useGridColumns = ({
  axis,
  sizeScaleId,
  versions,
}: UseGridColumnsOptions) => {
  const { sizes: allSizes, isLoading: sizesLoading } = useSizes(null);
  const { data: grades = [], isLoading: gradesLoading } = useGetList<GradeRow>(
    "grades",
    {
      pagination: { page: 1, perPage: 500 },
      sort: { field: "id", order: "ASC" },
    },
    { enabled: axis === "grade" },
  );
  const { data: levels = [] } = useGetList<LevelRow>(
    "levels",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "id", order: "ASC" },
    },
    { enabled: axis === "grade" },
  );

  const columns = useMemo(() => {
    if (axis === "none") return uniqueColumns();

    if (axis === "size") {
      // The line's scale, plus any size a variant carries from outside it, so
      // a mis-scaled variant shows up instead of vanishing.
      const used = new Set(
        (versions ?? []).flatMap((v) => v.variants.map((x) => x.sizeId)),
      );
      return sizeColumns(
        allSizes.filter(
          (size) =>
            (sizeScaleId != null && Number(size.sizeScaleId) === sizeScaleId) ||
            used.has(size.id),
        ),
      );
    }

    const used = new Set(
      (versions ?? []).flatMap((v) => v.variants.map((x) => x.gradeId)),
    );
    return gradeColumns(
      versions ? grades.filter((grade) => used.has(grade.id)) : grades,
      levels,
    );
  }, [axis, allSizes, sizeScaleId, versions, grades, levels]);

  return {
    columns,
    isLoading:
      axis === "size" ? sizesLoading : axis === "grade" && gradesLoading,
  };
};

export default useGridColumns;
