import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useGetList } from "react-admin";
import type { ExcessTreatment, UpdateEnrollment } from "@/types/enrollment";
import type { PaymentMethod } from "@/types/payment";
import { formatMoney } from "@/utils/money";

export interface SettlementDraft {
  excessTreatment: ExcessTreatment | null;
  refundPaymentMethodId: number | null;
}

export const NO_SETTLEMENT: SettlementDraft = {
  excessTreatment: null,
  refundPaymentMethodId: null,
};

/** The fields of a `PUT` 422 this block shows on itself. */
export const SETTLEMENT_FIELDS = ["excessTreatment", "refundPaymentMethodId"];

/** A refund goes out by some method; a credit only needs one for what it finds no debt for. */
export const settlementReady = (totalExcess: number, draft: SettlementDraft) =>
  totalExcess <= 0 ||
  (draft.excessTreatment !== null &&
    (draft.excessTreatment === "CREDIT" ||
      draft.refundPaymentMethodId !== null));

/** What the `PUT` carries: nothing when there is nothing to give back. */
export const settlementBody = (
  totalExcess: number,
  draft: SettlementDraft,
): Partial<UpdateEnrollment> =>
  totalExcess > 0 && draft.excessTreatment
    ? {
        excessTreatment: draft.excessTreatment,
        refundPaymentMethodId: draft.refundPaymentMethodId,
      }
    : {};

const NO_METHODS: PaymentMethod[] = [];

interface ExcessSettlementFieldsProps {
  totalExcess: number;
  value: SettlementDraft;
  onChange: (value: SettlementDraft) => void;
  errors?: Record<string, string> | null;
  disabled: boolean;
}

/**
 * Money a pensión holds beyond what it now costs goes back to the family:
 * paid out today, or applied to what the student still owes.
 */
export const ExcessSettlementFields = ({
  totalExcess,
  value,
  onChange,
  errors,
  disabled,
}: ExcessSettlementFieldsProps) => {
  // Same order as Caja: the catalogue puts Efectivo first.
  const {
    data: methods = NO_METHODS,
    isPending,
    error,
  } = useGetList<PaymentMethod>("payment-methods", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "id", order: "ASC" },
  });

  const refund = value.excessTreatment === "REFUND";
  const treatmentError = errors?.excessTreatment;
  const methodError = errors?.refundPaymentMethodId;

  return (
    <Stack component="section" aria-label="Saldo a favor" spacing={1.5}>
      <Typography variant="subtitle2">
        Saldo a favor de la familia: {formatMoney(totalExcess)}
      </Typography>
      <FormControl error={!!treatmentError} disabled={disabled}>
        <FormLabel id="excess-treatment-label">
          ¿Qué se hace con el saldo?
        </FormLabel>
        <RadioGroup
          aria-labelledby="excess-treatment-label"
          value={value.excessTreatment ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              excessTreatment: event.target.value as ExcessTreatment,
            })
          }
        >
          <FormControlLabel
            value="REFUND"
            control={<Radio size="small" />}
            label="Devolverlo hoy"
          />
          <FormControlLabel
            value="CREDIT"
            control={<Radio size="small" />}
            label="Descontarlo de lo que aún debe"
          />
        </RadioGroup>
        {treatmentError && <FormHelperText>{treatmentError}</FormHelperText>}
      </FormControl>
      {value.excessTreatment && (
        <TextField
          select
          fullWidth
          required={refund}
          label="Medio de devolución"
          value={value.refundPaymentMethodId ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              refundPaymentMethodId:
                event.target.value === "" ? null : Number(event.target.value),
            })
          }
          disabled={disabled || isPending || !!error}
          error={!!methodError || !!error}
          helperText={
            methodError ??
            (error
              ? "No se pudieron cargar los medios de pago."
              : refund
                ? undefined
                : "Por si el saldo supera lo que debe: el resto se devuelve por este medio.")
          }
        >
          {!refund && (
            <MenuItem value="">
              <em>Ninguno</em>
            </MenuItem>
          )}
          {methods.map((method) => (
            <MenuItem key={method.id} value={method.id}>
              {method.name}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Stack>
  );
};
