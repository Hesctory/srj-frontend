import { useEffect } from "react";
import { RadioButtonGroupInput, required } from "react-admin";
import { useFormContext } from "react-hook-form";
import { fullRowField } from "@/shared/components/form-grid";
import {
  MONTH_NAMES,
  useEnrollmentChoices,
} from "@/features/students/hooks/use-enrollment-preview";

const GRACE_CHOICES = [
  { id: "0", name: "Ninguno" },
  { id: "1", name: "1 día" },
  { id: "2", name: "2 días" },
];

// The radio group speaks strings; the API takes a number and a boolean.
const graceFormat = (value: unknown) =>
  value === null || value === undefined ? "0" : String(value);
const graceParse = (value: string) => Number(value);
const billFormat = (value: unknown) =>
  value === true ? "bill" : value === false ? "skip" : "";
const billParse = (value: string) => value === "bill";

interface EnrollmentTermsInputsProps {
  sourcePrefix?: string;
}

/**
 * When the upfront charges fall due, and whether the month the student starts
 * in is billed. The second question only exists during a billed month of the
 * school year's own year; staff answer it every time (no default), since
 * around the 20th the school usually skips the month but has no fixed day.
 */
const EnrollmentTermsInputs = ({
  sourcePrefix,
}: EnrollmentTermsInputsProps) => {
  const base = sourcePrefix ? `${sourcePrefix}.` : "";
  const billSource = `${base}billEnrollmentMonth`;
  const { choiceMonth, billEnrollmentMonth } = useEnrollmentChoices(base);
  const { setValue } = useFormContext();

  // A choice made for one school year means nothing for another: drop it so
  // it is neither sent nor shown when the question goes away.
  useEffect(() => {
    if (choiceMonth === null && billEnrollmentMonth !== null) {
      setValue(billSource, undefined);
    }
  }, [choiceMonth, billEnrollmentMonth, billSource, setValue]);

  const month = choiceMonth === null ? null : MONTH_NAMES[choiceMonth - 1];
  const next = choiceMonth === null ? null : MONTH_NAMES[choiceMonth % 12];

  return (
    <>
      <RadioButtonGroupInput
        source={`${base}graceDays`}
        label="Días de gracia para la matrícula"
        choices={GRACE_CHOICES}
        defaultValue={0}
        format={graceFormat}
        parse={graceParse}
        helperText="Si el apoderado pide uno o dos días para pagarla."
        row
        sx={fullRowField}
      />
      {month && (
        <RadioButtonGroupInput
          source={billSource}
          label={`¿Se cobra la pensión de ${month}?`}
          choices={[
            { id: "bill", name: `Sí, desde ${month}` },
            {
              id: "skip",
              name:
                choiceMonth === 12
                  ? "No, ninguna este año"
                  : `No, desde ${next}`,
            },
          ]}
          format={billFormat}
          parse={billParse}
          isRequired
          validate={required("Indica si se cobra la pensión de este mes.")}
          row
          sx={fullRowField}
        />
      )}
    </>
  );
};

export default EnrollmentTermsInputs;
