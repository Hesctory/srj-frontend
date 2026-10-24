import {
  DateInput,
  NumberInput,
  ReferenceInput,
  SelectInput,
  required,
} from "react-admin";
import { FormGrid } from "@/shared/components/form-grid";

// Rendered inside the contracts dialog (maxWidth "md"), so the column count
// follows the container, not the viewport.
const EmploymentContractFormInputs = () => (
  <FormGrid minColumnWidth={240}>
    <ReferenceInput source="institutionId" reference="institutions">
      <SelectInput label="Institución" isRequired validate={required()} />
    </ReferenceInput>

    <ReferenceInput source="schoolYearId" reference="school-years">
      <SelectInput
        label="Año Escolar"
        optionText="year"
        isRequired
        validate={required()}
      />
    </ReferenceInput>

    <ReferenceInput source="jobPositionId" reference="job-positions">
      <SelectInput label="Cargo" isRequired validate={required()} />
    </ReferenceInput>

    <ReferenceInput source="areaId" reference="work-areas">
      <SelectInput label="Área" />
    </ReferenceInput>

    <DateInput
      source="startDate"
      label="Fecha de Inicio"
      isRequired
      validate={required()}
    />
    <DateInput source="endDate" label="Fecha de Fin" />

    <NumberInput source="salary" label="Salario" min={0} />
  </FormGrid>
);

export default EmploymentContractFormInputs;
