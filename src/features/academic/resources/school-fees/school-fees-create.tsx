import { Create, SimpleForm, useStore } from "react-admin";
import GuardedFormToolbar from "@/features/academic/components/guarded-form-toolbar";
import { FORM_WIDTH, SchoolFeeInputs } from "./school-fee-inputs";

/** Opens on the year the list was showing — the one staff were pricing. */
const useListedSchoolYear = () => {
  const [params] = useStore<{ filter?: { schoolYearId?: number | string } }>(
    "school-fees.listParams",
  );
  const id = params?.filter?.schoolYearId;
  return id === undefined || id === "" ? undefined : Number(id);
};

export const SchoolFeesCreate = () => {
  const schoolYearId = useListedSchoolYear();

  return (
    <Create redirect="list" mutationMode="pessimistic" sx={FORM_WIDTH}>
      <SimpleForm
        toolbar={<GuardedFormToolbar />}
        defaultValues={{ schoolYearId }}
      >
        <SchoolFeeInputs />
      </SimpleForm>
    </Create>
  );
};
