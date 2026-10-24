import { useStore } from "react-admin";
import useCurrentSchoolYear from "@/shared/hooks/use-current-school-year";

/**
 * The school year the catalogue shows prices and stock for. One year for the
 * whole workspace — the list's "on sale" column and the editor's grid — and
 * remembered across products and reloads. Defaults to the running year.
 */
export const useCatalogYear = () => {
  const { schoolYears, id: currentId } = useCurrentSchoolYear();
  const [chosen, setChosen] = useStore<number | null>(
    "products.catalog.schoolYearId",
    null,
  );
  const exists = schoolYears.some((year) => year.id === chosen);
  const schoolYearId = exists ? chosen : (currentId ?? schoolYears[0]?.id);
  const year = schoolYears.find((y) => y.id === schoolYearId);

  return {
    schoolYears,
    schoolYearId: schoolYearId ?? null,
    yearLabel: year?.year ?? "",
    setSchoolYearId: setChosen,
  };
};

export interface CatalogRows {
  cost: boolean;
  stock: boolean;
}

/** Which optional rows the grid shows. Venta is always there. */
export const useCatalogRows = () =>
  useStore<CatalogRows>("products.catalog.rows", { cost: false, stock: true });

export default useCatalogYear;
