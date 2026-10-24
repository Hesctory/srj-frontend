import { useId } from "react";
import { MenuItem, TextField } from "@mui/material";
import useCatalogYear from "@/features/products/hooks/use-catalog-year";

/** The workspace's school year: drives the list's offer column and the grid. */
const CatalogYearSelect = () => {
  const { schoolYears, schoolYearId, setSchoolYearId } = useCatalogYear();
  // Unique: the list pane and the narrow editor header can both show one.
  const id = useId();

  return (
    <TextField
      select
      id={id}
      name="catalogSchoolYearId"
      size="small"
      label="Año escolar"
      value={schoolYearId ?? ""}
      onChange={(event) => setSchoolYearId(Number(event.target.value))}
      fullWidth={false}
      sx={{ width: 120, flexShrink: 0 }}
    >
      {schoolYears.map((year) => (
        <MenuItem key={year.id} value={year.id}>
          {year.year}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default CatalogYearSelect;
