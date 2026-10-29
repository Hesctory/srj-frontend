import { Edit, SimpleForm, useRecordContext } from "react-admin";
import type { SchoolFee } from "@/types/school-fee";
import SchoolFeeToolbar from "./school-fee-toolbar";
import { FORM_WIDTH, SchoolFeeInputs } from "./school-fee-inputs";

/** "Tarifa Inicial · mañana · Normal 2026" says which row, unlike "Tarifa #7". */
const SchoolFeeTitle = () => {
  const record = useRecordContext<SchoolFee>();
  if (!record) return null;
  const what = [record.levelName, record.shiftName, record.schoolFeeConceptName]
    .filter(Boolean)
    .join(" · ");
  return <span>{`Tarifa ${what} ${record.schoolYear}`}</span>;
};

/**
 * Fee rows cannot be deleted (the contract has no DELETE), so the toolbar
 * offers Guardar only. Pessimistic, so a refused edit (422, 409) stays on the
 * form with the server's message instead of being undone after the fact.
 */
export const SchoolFeesEdit = () => (
  <Edit
    mutationMode="pessimistic"
    redirect="list"
    sx={FORM_WIDTH}
    title={<SchoolFeeTitle />}
  >
    <SimpleForm toolbar={<SchoolFeeToolbar />}>
      <SchoolFeeInputs />
    </SimpleForm>
  </Edit>
);
