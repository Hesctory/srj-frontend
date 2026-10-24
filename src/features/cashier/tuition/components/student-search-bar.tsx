import { useState } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
} from "@mui/material";
import { useListFilterContext } from "react-admin";
import AcademicFilterSelector from "@/shared/components/academic-filter-selector";

/**
 * The one control that reopens the student search.
 *
 * `GET /students` filters by `dni` and `fullName` as separate params, so the
 * single box picks one of them by shape: an all-digit term is a document
 * number, anything else is a name. Typing swaps between the two rather than
 * sending both, otherwise the two filters would AND each other to nothing.
 */
const isDocumentNumber = (value: string) => /^\d+$/.test(value);

interface StudentSearchBarProps {
  /**
   * Called whenever a filter is touched — focus, keystroke, or opening the
   * academic cascade. The page uses it to bring the results back without a
   * separate "change student" button.
   */
  onSearch: () => void;
}

const StudentSearchBar = ({ onSearch }: StudentSearchBarProps) => {
  const { filterValues, setFilters, displayedFilters } = useListFilterContext();
  const [text, setText] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const apply = (value: string) => {
    setText(value);
    onSearch();

    const next = { ...filterValues };
    delete next.dni;
    delete next.fullName;

    const term = value.trim();
    if (term) next[isDocumentNumber(term) ? "dni" : "fullName"] = term;

    setFilters(next, displayedFilters);
  };

  return (
    <Box mb={2}>
      <Box display="flex" gap={1.5} flexWrap="wrap">
        <TextField
          value={text}
          onChange={(event) => apply(event.target.value)}
          onFocus={onSearch}
          placeholder="Buscar por DNI o nombre"
          sx={{ flex: 1, minWidth: 260 }}
          slotProps={{
            input: {
              sx: { height: 52, fontSize: "1rem" },
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: text ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="Limpiar búsqueda"
                    onClick={() => apply("")}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        <Button
          variant={filtersOpen ? "contained" : "outlined"}
          startIcon={<TuneIcon />}
          onClick={() => {
            setFiltersOpen((open) => !open);
            onSearch();
          }}
          sx={{ height: 52 }}
        >
          Filtros académicos
        </Button>
      </Box>

      {/* `Collapse` keeps its children mounted. That is load-bearing here:
          AcademicFilterSelector seeds the current school year from a mount
          effect, so unmounting it while collapsed would silently drop the
          default year filter every list on this page relies on. */}
      <Collapse in={filtersOpen}>
        <Paper variant="outlined" sx={{ p: 2, mt: 1.5 }} onClick={onSearch}>
          <AcademicFilterSelector />
        </Paper>
      </Collapse>
    </Box>
  );
};

export default StudentSearchBar;
