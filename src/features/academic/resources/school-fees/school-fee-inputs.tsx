import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  NumberInput,
  ReferenceInput,
  SelectInput,
  TextInput,
  required,
} from "react-admin";
import { FormSection, fullRowField } from "@/shared/components/form-grid";
import { SCHOOL_FEE_AMOUNT_MAX } from "@/types/school-fee";
import { formatMoney } from "@/utils/money";

/**
 * The backend's bounds for a soles amount (0 to 999.99, two decimals),
 * checked here first so the form answers at once.
 */
export const amountInRange = (message: string) => (value: unknown) => {
  if (value === null || value === undefined || value === "") return undefined;
  const amount = Number(value);
  const cents = Math.round(amount * 100);
  return amount < 0 ||
    amount > SCHOOL_FEE_AMOUNT_MAX ||
    Math.abs(cents - amount * 100) > 1e-6
    ? message
    : undefined;
};

/**
 * Ley 26549 art. 14: the matrícula may not exceed the same row's pensión.
 * Equal amounts pass. Lowering the pensión below a stored matrícula trips it
 * too, on the matrícula field, which is where the server reports it.
 */
const enrollmentWithinTuition = (
  value: unknown,
  values: { tuitionCost?: unknown },
) => {
  const tuition = values.tuitionCost;
  if (value === null || value === undefined || value === "") return undefined;
  if (tuition === null || tuition === undefined || tuition === "") {
    return undefined;
  }
  return Number(value) > Number(tuition)
    ? `La matrícula no puede superar la pensión (${formatMoney(Number(tuition))}).`
    : undefined;
};

const amountValidators = [
  required(),
  amountInRange(
    "El monto debe estar entre 0 y 999.99, con hasta dos decimales.",
  ),
];

/** Eight short fields: on a wide screen the form stays at a readable width. */
export const FORM_WIDTH = { width: "100%", maxWidth: 960, mx: "auto" };

/**
 * Re-checks the matrícula when the pensión changes. Field validators only
 * run for the field being edited, so without this a cap error quoting the
 * old pensión would stay on screen after the pensión was raised.
 */
const RecheckEnrollmentOnTuition = () => {
  const { trigger, getFieldState } = useFormContext();
  const tuition = useWatch({ name: "tuitionCost" });

  useEffect(() => {
    if (getFieldState("enrollmentPrice").error) trigger("enrollmentPrice");
  }, [tuition, trigger, getFieldState]);

  return null;
};

/** The fields Create and Edit share, in the order the contract lists them. */
export const SchoolFeeInputs = () => (
  <>
    <RecheckEnrollmentOnTuition />
    <FormSection title="Tarifa para">
      <ReferenceInput source="schoolYearId" reference="school-years">
        <SelectInput
          optionText="year"
          label="Año escolar"
          isRequired
          validate={required()}
        />
      </ReferenceInput>
      <ReferenceInput source="levelId" reference="levels">
        <SelectInput
          optionText="name"
          label="Nivel"
          isRequired
          validate={required()}
        />
      </ReferenceInput>
      <ReferenceInput source="shiftId" reference="shifts">
        <SelectInput
          optionText="name"
          label="Turno"
          isRequired
          validate={required()}
        />
      </ReferenceInput>
      <ReferenceInput
        source="schoolFeeConceptId"
        reference="school-fee-concepts"
      >
        <SelectInput
          optionText="name"
          label="Concepto"
          isRequired
          validate={required()}
        />
      </ReferenceInput>
    </FormSection>
    <FormSection title="Montos (S/)">
      <NumberInput
        source="enrollmentPrice"
        label="Matrícula"
        step={0.01}
        helperText="No puede superar la pensión"
        isRequired
        validate={[...amountValidators, enrollmentWithinTuition]}
      />
      <NumberInput
        source="tuitionCost"
        label="Pensión mensual"
        step={0.01}
        isRequired
        validate={amountValidators}
      />
      <NumberInput
        source="registrationFee"
        label="Cuota de ingreso"
        step={0.01}
        isRequired
        validate={amountValidators}
      />
      <TextInput
        source="description"
        label="Descripción"
        multiline
        sx={fullRowField}
      />
    </FormSection>
  </>
);
