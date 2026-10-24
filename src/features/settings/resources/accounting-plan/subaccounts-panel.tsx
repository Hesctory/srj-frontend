import { useState } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Confirm,
  useDelete,
  useGetList,
  useNotify,
  useRecordContext,
  useRefresh,
} from "react-admin";
import { Account } from "@/types/accounting-plan";

interface SubaccountsPanelProps {
  onEdit: (record: Account) => void;
  onAdd: (parentId: number) => void;
}

/**
 * Drill-down panel rendered inside a parent account's expanded row. It reads as
 * an indented continuation of the main table (same surface, no card), not a
 * separate widget: a left accent bar "hangs" the sub-accounts off the parent,
 * columns mirror the parent's proportions, and there is no repeated header row —
 * the codes are self-explanatory, so a single quiet count label suffices.
 */
const SubaccountsPanel = ({ onEdit }: SubaccountsPanelProps) => {
  const parent = useRecordContext<Account>();
  const notify = useNotify();
  const refresh = useRefresh();
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const { data, total, isLoading } = useGetList<Account>("accounting-plan", {
    filter: { parentAccountId: parent?.id },
    pagination: { page: 1, perPage: 15 },
    sort: { field: "code", order: "ASC" },
  });

  const [deleteOne, { isPending: isDeleting }] = useDelete();

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteOne(
      "accounting-plan",
      { id: deleteTarget.id, previousData: deleteTarget },
      {
        onSuccess: () => {
          notify("Subcuenta eliminada", { type: "success" });
          refresh();
          setDeleteTarget(null);
        },
        onError: () => {
          notify("Error al eliminar subcuenta", { type: "error" });
          setDeleteTarget(null);
        },
      },
    );
  };

  if (!parent) return null;

  return (
    <>
      {/* Indented block on the table's own surface; the left accent bar signals
          these rows belong to the parent account above. */}
      <Box sx={{ pl: { xs: 3, md: 7 }, pr: 2, py: 1.5 }}>
        <Box
          sx={{
            borderLeft: "2px solid",
            borderColor: "primary.main",
            pl: 2,
          }}
        >
          {isLoading ? (
            <Box display="flex" alignItems="center" gap={1} py={1}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Cargando subcuentas…
              </Typography>
            </Box>
          ) : !data || data.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              Sin subcuentas. Usa el botón <strong>+</strong> de la cuenta para
              agregar la primera.
            </Typography>
          ) : (
            <>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{
                  display: "block",
                  lineHeight: 2,
                  letterSpacing: "0.06em",
                }}
              >
                Subcuentas · {total ?? data.length}
              </Typography>

              <Table
                size="small"
                sx={{
                  "& td": { borderColor: "divider" },
                  "& tr:last-of-type td": { borderBottom: "none" },
                }}
              >
                <TableBody>
                  {data.map((sub) => (
                    <TableRow
                      key={sub.id}
                      sx={{
                        "&:hover": { backgroundColor: "action.hover" },
                      }}
                    >
                      <TableCell sx={{ width: "15%", fontWeight: 500 }}>
                        {sub.code}
                      </TableCell>
                      <TableCell sx={{ width: "15%", color: "text.secondary" }}>
                        {sub.printCode}
                      </TableCell>
                      <TableCell>{sub.name}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <IconButton
                          size="small"
                          title="Editar"
                          onClick={() => onEdit(sub)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Eliminar"
                          onClick={() => setDeleteTarget(sub)}
                          disabled={isDeleting}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {total !== undefined && total > 15 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Mostrando 15 de {total} subcuentas
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      <Confirm
        isOpen={!!deleteTarget}
        title="Eliminar subcuenta"
        content={`¿Estás seguro de que deseas eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default SubaccountsPanel;
