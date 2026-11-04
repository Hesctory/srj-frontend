import { useEffect } from "react";
import { ReferenceInput, SelectInput, required, useGetList } from "react-admin";
import { useFormContext } from "react-hook-form";
import { FORM_DOWNSTREAM } from "@/shared/hooks/academic-cascade";
import { useAcademicFormSelector } from "@/features/students/hooks/use-academic-form-selector";

interface AcademicFormSelectorProps {
  sourcePrefix?: string;
  /** Require every field. For "year only" requirements use `requireYear`. */
  required?: boolean;
  /** Require just the school-year field while leaving the rest optional —
   *  matches the list filters, where a query always needs a year but the
   *  downstream cascade is optional. Ignored when `required` is true. */
  requireYear?: boolean;
  /** Preselect the current calendar year's school-year when the field is empty,
   *  mirroring the list filters' default. */
  defaultCurrentYear?: boolean;
  /** The year is shown but fixed: an enrollment never changes school year. */
  lockYear?: boolean;
}

const AcademicFormSelector = ({
  sourcePrefix,
  required: isFieldRequired = true,
  requireYear = false,
  defaultCurrentYear = false,
  lockYear = false,
}: AcademicFormSelectorProps) => {
  const base = sourcePrefix ? `${sourcePrefix}.` : "";
  const { schoolYearId, levelId, gradeId, shiftId, clearFields } =
    useAcademicFormSelector(base);
  const { setValue } = useFormContext();

  const { data: schoolYears } = useGetList(
    "school-years",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "year", order: "DESC" },
    },
    { enabled: defaultCurrentYear },
  );

  // Preselect the current year once the list arrives, only if nothing is set.
  // Deferred to a macrotask so it lands AFTER react-admin's <Form> runs its
  // own initial reset: this component is a child of <Form>, and child effects
  // fire before the parent's reset effect. A synchronous setValue (when the
  // school-years list is already cached, e.g. on client-side navigation) would
  // be wiped by that reset — which is why it previously only worked after a
  // hard refresh, where the list arrives async, after the reset.
  useEffect(() => {
    if (!defaultCurrentYear || schoolYearId || !schoolYears) return;
    const match = schoolYears.find(
      (sy) => Number(sy.year) === new Date().getFullYear(),
    );
    if (!match) return;
    const timer = setTimeout(
      () => setValue(`${base}schoolYearId`, match.id),
      0,
    );
    return () => clearTimeout(timer);
  }, [defaultCurrentYear, schoolYearId, schoolYears, base, setValue]);

  const reqProps = (isYear: boolean) =>
    isFieldRequired || (isYear && requireYear)
      ? { isRequired: true, validate: required() }
      : {};
  const req = reqProps(false);

  return (
    <>
      <ReferenceInput source={`${base}schoolYearId`} reference="school-years">
        <SelectInput
          label="Año Escolar"
          optionText="year"
          readOnly={lockYear}
          onChange={() => clearFields(FORM_DOWNSTREAM.schoolYearId)}
          {...reqProps(true)}
        />
      </ReferenceInput>

      {schoolYearId ? (
        <ReferenceInput source={`${base}levelId`} reference="levels">
          <SelectInput
            label="Nivel"
            onChange={() => clearFields(FORM_DOWNSTREAM.levelId)}
            {...req}
          />
        </ReferenceInput>
      ) : (
        <SelectInput
          source={`${base}levelId`}
          label="Nivel"
          choices={[]}
          disabled
          {...req}
        />
      )}

      {levelId ? (
        <ReferenceInput
          source={`${base}gradeId`}
          reference="grades"
          filter={{ schoolYearId, levelId }}
        >
          <SelectInput
            label="Grado"
            onChange={() => clearFields(FORM_DOWNSTREAM.gradeId)}
            {...req}
          />
        </ReferenceInput>
      ) : (
        <SelectInput
          source={`${base}gradeId`}
          label="Grado"
          choices={[]}
          disabled
          {...req}
        />
      )}

      {gradeId ? (
        <ReferenceInput
          source={`${base}shiftId`}
          reference="shifts"
          filter={{ schoolYearId, gradeId }}
        >
          <SelectInput
            label="Turno"
            onChange={() => clearFields(FORM_DOWNSTREAM.shiftId)}
            {...req}
          />
        </ReferenceInput>
      ) : (
        <SelectInput
          source={`${base}shiftId`}
          label="Turno"
          choices={[]}
          disabled
          {...req}
        />
      )}

      {shiftId ? (
        <ReferenceInput
          source={`${base}sectionId`}
          reference="sections"
          filter={{ schoolYearId, levelId, gradeId, shiftId }}
        >
          <SelectInput label="Sección" optionText="section" {...req} />
        </ReferenceInput>
      ) : (
        <SelectInput
          source={`${base}sectionId`}
          label="Sección"
          choices={[]}
          disabled
          {...req}
        />
      )}
    </>
  );
};

export default AcademicFormSelector;
