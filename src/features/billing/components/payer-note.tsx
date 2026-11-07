import { Box, MenuItem, Stack, TextField, Typography } from "@mui/material";
import {
  PAYER_RELATIONSHIPS,
  PAYER_RELATIONSHIP_LABEL,
  type PayerRelationship,
} from "@/types/payment-document";

/**
 * Who paid, as an observation on the comprobante. Optional throughout: the
 * select opens on «Sin indicar», which sends no note at all.
 *
 * Only «Otro» reveals the name field, and only then is a name required — the
 * other three relationships already say who paid.
 */
export const PayerNote = ({
  relationship,
  name,
  onRelationshipChange,
  onNameChange,
  disabled,
}: {
  relationship: PayerRelationship | "";
  name: string;
  onRelationshipChange: (value: PayerRelationship | "") => void;
  onNameChange: (value: string) => void;
  disabled: boolean;
}) => (
  <Box mt={2.5}>
    <Typography variant="subtitle2">Quién pagó (opcional)</Typography>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: "block", mb: 1.5 }}
    >
      Se registra como observación en el comprobante. No cambia el adquirente.
    </Typography>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
      <TextField
        select
        size="small"
        label="Pagó"
        value={relationship}
        onChange={(event) =>
          onRelationshipChange(event.target.value as PayerRelationship | "")
        }
        disabled={disabled}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">Sin indicar</MenuItem>
        {PAYER_RELATIONSHIPS.map((value) => (
          <MenuItem key={value} value={value}>
            {PAYER_RELATIONSHIP_LABEL[value]}
          </MenuItem>
        ))}
      </TextField>
      {relationship === "OTRO" && (
        <TextField
          size="small"
          fullWidth
          required
          label="Nombre de quien pagó"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          disabled={disabled}
          helperText="Obligatorio con «Otro». Se escribe tal cual en el comprobante."
        />
      )}
    </Stack>
  </Box>
);

export default PayerNote;
