import { NumberInput, SelectInput, TextInput, required } from "react-admin";
import { FormSection } from "@/shared/components/form-grid";
import { amountInRange } from "@/features/academic/resources/school-fees/school-fee-inputs";
import { DISCOUNT_CONDITION_LABELS } from "@/types/school-fee-concept";

const discountValidators = [
  required(),
  amountInRange(
    "El descuento debe estar entre 0 y 999.99, con hasta dos decimales.",
  ),
];

const CONDITION_CHOICES = Object.entries(DISCOUNT_CONDITION_LABELS).map(
  ([id, name]) => ({ id, name }),
);

/** Four short fields: on a wide screen the form stays at a readable width. */
export const FORM_WIDTH = { width: "100%", maxWidth: 720, mx: "auto" };

/** A new concept charges the Normal price until staff set a discount. */
export const NEW_CONCEPT_DEFAULTS = {
  enrollmentDiscount: 0,
  tuitionDiscount: 0,
  discountCondition: null,
};

// Two fields per section in a 720px card: tracks sized to the card, not to
// the viewport, so a 2560 screen does not cut them into four 160px columns.
const COLUMN = 260;

/** The fields Create and Edit share, in the order the contract lists them. */
export const SchoolFeeConceptInputs = () => (
  <>
    <FormSection title="Concepto" minColumnWidth={COLUMN}>
      <TextInput
        source="name"
        label="Nombre"
        isRequired
        validate={required()}
      />
      <SelectInput
        source="discountCondition"
        label="Condición del descuento"
        choices={CONDITION_CHOICES}
        emptyText="Ninguna"
        parse={(value: string) => value || null}
        helperText="Solo avisa al matricular si no se cumple."
      />
    </FormSection>
    <FormSection title="Descuentos (S/)" minColumnWidth={COLUMN}>
      <NumberInput
        source="enrollmentDiscount"
        label="Descuento en la matrícula"
        step={0.01}
        isRequired
        validate={discountValidators}
      />
      <NumberInput
        source="tuitionDiscount"
        label="Descuento en cada pensión"
        step={0.01}
        helperText="Si supera la pensión, la pensión queda en S/ 0."
        isRequired
        validate={discountValidators}
      />
    </FormSection>
  </>
);
