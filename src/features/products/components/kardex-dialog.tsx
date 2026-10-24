import { useDataProvider } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { AppDataProvider } from "@/app/data-provider";
import { formatIsoDateTime, formatMoney } from "@/utils/money";
import type { StockSourceKind } from "@/types/product";
import { toCatalogError } from "@/features/products/utils/catalog-error";

interface KardexDialogProps {
  offeringId: number | null;
  title: string;
  onClose: () => void;
}

const SOURCE_LABEL: Record<StockSourceKind, string> = {
  sale: "Venta",
  purchase: "Compra",
  return: "Devolución",
  initial: "Inventario inicial",
  legacy: "Histórico",
};

/**
 * One variant's stock ledger, read-only.
 *
 * Stock is *counted*, never typed: every movement is written by the document
 * that caused it, which is what lets the school answer "why does it say 84?"
 * by naming the count, the purchases and the sales behind it. Every row
 * arrives with its running `balance` already folded in, so the UI never
 * accumulates a second, disagreeing figure.
 *
 * Documents are named, not linked: the sale and purchase screens do not exist
 * yet, and a link to a missing route is worse than plain text.
 */
const KardexDialog = ({ offeringId, title, onClose }: KardexDialogProps) => {
  const dataProvider = useDataProvider<AppDataProvider>();
  const {
    data: kardex,
    isPending,
    error,
  } = useQuery({
    queryKey: ["products/offerings", offeringId, "kardex"],
    queryFn: () => dataProvider.getKardex(offeringId!),
    enabled: offeringId != null,
  });
  const isLoading = offeringId != null && isPending;

  return (
    <Dialog
      open={offeringId != null}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="kardex-dialog-title"
    >
      <DialogTitle id="kardex-dialog-title">
        Kardex — {title}
        <Typography variant="body2" color="text.secondary">
          Todo movimiento lo escribe el documento que lo causó. Aquí no se
          corrige stock: se corrige el documento, o se vuelve a contar.
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error">{toCatalogError(error).message}</Alert>
        )}

        {kardex && !isLoading && (
          <Stack spacing={2}>
            <Box display="flex" gap={1.5} flexWrap="wrap">
              <BalanceTile label="Inicial" value={kardex.opening} />
              <BalanceTile
                label="Entradas"
                value={kardex.totalIn}
                tone="success"
              />
              <BalanceTile
                label="Salidas"
                value={kardex.totalOut}
                tone="error"
              />
              <BalanceTile label="Final" value={kardex.closing} emphasis />
            </Box>

            {kardex.movements.length === 0 ? (
              <Alert severity="info">
                Esta oferta todavía no tiene movimientos.
              </Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Movimiento</TableCell>
                    <TableCell>Documento</TableCell>
                    <TableCell align="right">Entra</TableCell>
                    <TableCell align="right">Sale</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                    <TableCell align="right">Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {kardex.movements.map((movement) => {
                    const sourceText =
                      movement.sourceLabel ??
                      (movement.sourceKind
                        ? SOURCE_LABEL[movement.sourceKind]
                        : "—");

                    return (
                      <TableRow
                        key={movement.id}
                        // Before the variant's last count: listed, but it does
                        // not move the balance or the totals.
                        title={
                          movement.countsTowardStock
                            ? undefined
                            : "Anterior al último conteo: no cuenta para el stock"
                        }
                        sx={
                          movement.countsTowardStock
                            ? undefined
                            : { "& td": { color: "text.disabled" } }
                        }
                      >
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatIsoDateTime(movement.movedAt)}
                        </TableCell>
                        <TableCell>
                          {movement.movementTypeName ?? "—"}
                        </TableCell>
                        <TableCell>{sourceText}</TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {movement.quantityIn || ""}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {movement.quantityOut || ""}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: 600,
                          }}
                        >
                          {movement.balance}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {movement.unitValue == null
                            ? "—"
                            : formatMoney(movement.unitValue)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

const BalanceTile = ({
  label,
  value,
  tone,
  emphasis,
}: {
  label: string;
  value: number;
  tone?: "success" | "error";
  emphasis?: boolean;
}) => (
  <Paper
    variant="outlined"
    sx={{
      px: 2,
      py: 1,
      minWidth: 110,
      borderColor: emphasis ? "primary.main" : undefined,
      borderWidth: emphasis ? 2 : 1,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="h6"
      sx={{
        fontVariantNumeric: "tabular-nums",
        color: tone ? `${tone}.main` : "text.primary",
      }}
    >
      {value}
    </Typography>
  </Paper>
);

export { KardexDialog };
export default KardexDialog;
