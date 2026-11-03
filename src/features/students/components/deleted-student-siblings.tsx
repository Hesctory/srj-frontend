import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { Siblings } from "./siblings-to-review";
import type { StudentDeletionSibling } from "@/types/student";

/** Router state the delete hands to the list. */
export interface DeletedStudentState {
  deletedSiblings?: StudentDeletionSibling[];
}

/**
 * After deleting a student with a sibling discount, the list opens on the
 * siblings whose price staff must review. It lives on the list, not on the
 * deleted student's page: that page refetches on focus and would 404 while
 * staff are away in a sibling's tab.
 */
export const DeletedStudentSiblings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const siblings = (location.state as DeletedStudentState | null)
    ?.deletedSiblings;
  if (!siblings?.length) return null;

  // Cleared from history, so a reload or Back does not ask again.
  const done = () =>
    navigate(location.pathname + location.search, {
      replace: true,
      state: null,
    });

  return (
    <Dialog open onClose={done} fullWidth maxWidth="sm">
      <DialogTitle>Estudiante eliminado</DialogTitle>
      <DialogContent>
        <Siblings siblings={siblings} linked />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={done}>
          Listo
        </Button>
      </DialogActions>
    </Dialog>
  );
};
