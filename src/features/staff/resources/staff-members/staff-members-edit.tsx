import {
  DateInput,
  Edit,
  NumberInput,
  ReferenceInput,
  SelectInput,
  TabbedForm,
  TextInput,
  required,
} from "react-admin";
import CRUDToolBar from "@/app/layout/crud-toolbar";
import {
  FormGrid,
  fullRowField,
  wideField,
} from "@/shared/components/form-grid";
import LocationFormSelector from "@/shared/components/location-form-selector";
import { ViewEmploymentContractsButton } from "@/features/staff/buttons/view-employment-contracts-button";

export const StaffMembersEdit = () => (
  <Edit mutationMode="pessimistic">
    <TabbedForm
      toolbar={
        <CRUDToolBar save delete>
          <ViewEmploymentContractsButton />
        </CRUDToolBar>
      }
    >
      <TabbedForm.Tab label="Datos Personales">
        <FormGrid>
          <TextInput
            source="names"
            label="Nombres"
            isRequired
            validate={required()}
          />
          <TextInput
            source="paternalLastname"
            label="Apellido Paterno"
            isRequired
            validate={required()}
          />
          <TextInput
            source="maternalLastname"
            label="Apellido Materno"
            isRequired
            validate={required()}
          />
          <ReferenceInput source="genderId" reference="genders">
            <SelectInput label="Sexo" isRequired validate={required()} />
          </ReferenceInput>
          <DateInput
            source="birthDate"
            label="Fecha de Nacimiento"
            isRequired
            validate={required()}
          />
          <ReferenceInput source="documentTypeId" reference="document-types">
            <SelectInput
              label="Tipo de Documento"
              isRequired
              validate={required()}
            />
          </ReferenceInput>
          <TextInput
            source="idDocumentNumber"
            label="Número de Documento"
            isRequired
            validate={required()}
          />
          <ReferenceInput source="civilStateId" reference="civil-states">
            <SelectInput label="Estado Civil" />
          </ReferenceInput>
          <TextInput source="cellPhone" label="Celular" />
          <TextInput source="landlinePhone" label="Teléfono Fijo" />
          <TextInput source="email" label="Correo Electrónico" type="email" />
        </FormGrid>
      </TabbedForm.Tab>

      <TabbedForm.Tab label="Domicilio">
        <FormGrid>
          <TextInput source="address" label="Dirección" sx={wideField} />
          <LocationFormSelector sourcePrefix="addressLocation" />
        </FormGrid>
      </TabbedForm.Tab>

      <TabbedForm.Tab label="Datos Profesionales">
        <FormGrid>
          <ReferenceInput
            source="levelOfEducationId"
            reference="level-of-educations"
          >
            <SelectInput label="Nivel de Educación" />
          </ReferenceInput>
          <TextInput source="professionalTitle" label="Título Profesional" />
          <TextInput source="employeeCode" label="Código de Empleado" />
          <TextInput
            source="previousInstitution"
            label="Institución Anterior"
          />
          <TextInput
            source="comment"
            label="Comentario"
            multiline
            rows={3}
            sx={fullRowField}
          />
        </FormGrid>
      </TabbedForm.Tab>

      <TabbedForm.Tab label="Datos del Cónyuge">
        <FormGrid>
          <TextInput source="spouseName" label="Nombre del Cónyuge" />
          <TextInput
            source="spouseDocumentNumber"
            label="Documento del Cónyuge"
          />
          <TextInput source="spouseOccupation" label="Ocupación del Cónyuge" />
          <NumberInput
            source="numberOfChildren"
            label="Número de Hijos"
            min={0}
          />
        </FormGrid>
      </TabbedForm.Tab>
    </TabbedForm>
  </Edit>
);
