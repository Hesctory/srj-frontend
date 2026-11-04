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
import type {
  EnrollmentChangePreview,
  ExcessTreatment,
  UpdateEnrollment,
} from "@/types/enrollment";
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

/**
 * A save refused on its settlement: a 422 on the settlement's own fields, or
 * the API's no to the treatment (a 409, such as a credit it can't issue).
 */
export interface SettlementRefusal {
  errors?: Record<string, string>;
  message?: string;
}

/** The fields of a `PUT` 422 this block shows on itself. */
export const SETTLEMENT_FIELDS = ["excessTreatment", "refundPaymentMethodId"];

/** What either preview says about the money a change gives back. */
export type CreditCapacity = Pick<
  EnrollmentChangePreview,
  "totalExcess" | "creditable" | "creditRefusal"
>;

const NOTHING_BACK: CreditCapacity = {
  totalExcess: 0,
  creditable: 0,
  creditRefusal: null,
};

/**
 * Whether a `CREDIT` can apply anything: the API would refuse it, or find no
 * pending charge and refund it all. Either way it is not worth offering.
 */
const creditOpen = ({ creditable, creditRefusal }: CreditCapacity) =>
  creditRefusal === null && creditable > 0;

/** Whether some of the money goes out, so a payment method is needed. */
const needsMethod = (capacity: CreditCapacity, draft: SettlementDraft) =>
  draft.excessTreatment === "REFUND" ||
  (draft.excessTreatment === "CREDIT" &&
    capacity.creditable < capacity.totalExcess);

export const settlementReady = (
  capacity: CreditCapacity = NOTHING_BACK,
  draft: SettlementDraft,
) =>
  capacity.totalExcess <= 0 ||
  (draft.excessTreatment !== null &&
    (draft.excessTreatment !== "CREDIT" || creditOpen(capacity)) &&
    (!needsMethod(capacity, draft) || draft.refundPaymentMethodId !== null));

/** What the `PUT` carries: nothing when there is nothing to give back. */
export const settlementBody = (
  { totalExcess }: CreditCapacity = NOTHING_BACK,
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
  capacity: CreditCapacity;
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
  capacity,
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

  const { totalExcess, creditable, creditRefusal } = capacity;
  const canCredit = creditOpen(capacity);
  const methodNeeded = needsMethod(capacity, value);
  const partly = canCredit && creditable < totalExcess;
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
            label={
              partly
                ? `Descontar ${formatMoney(creditable)} de lo que aún debe, y devolver el resto`
                : "Descontarlo de lo que aún debe"
            }
            disabled={!canCredit}
          />
        </RadioGroup>
        <FormHelperText>
          {treatmentError ??
            creditRefusal ??
            (canCredit
              ? null
              : "No le quedan cargos pendientes: el saldo solo puede devolverse.")}
        </FormHelperText>
      </FormControl>
      {/* Always there, so choosing a treatment does not move the dialog. */}
      <TextField
        select
        fullWidth
        required={methodNeeded}
        label="Medio de devolución"
        value={value.refundPaymentMethodId ?? ""}
        onChange={(event) =>
          onChange({
            ...value,
            refundPaymentMethodId:
              event.target.value === "" ? null : Number(event.target.value),
          })
        }
        disabled={
          disabled || isPending || !!error || value.excessTreatment === null
        }
        error={!!methodError || !!error}
        helperText={
          methodError ??
          (error
            ? "No se pudieron cargar los medios de pago."
            : value.excessTreatment === "CREDIT"
              ? partly
                ? `${formatMoney(totalExcess - creditable)} se devuelven por este medio.`
                : "Por si al confirmar ya no hay cargos pendientes: se devuelve por este medio."
              : undefined)
        }
      >
        {value.excessTreatment === "CREDIT" && !methodNeeded && (
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
    </Stack>
  );
};
