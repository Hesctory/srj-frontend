import {
  BooleanInput,
  Edit,
  DateInput,
  NumberInput,
  ReferenceInput,
  SelectInput,
  TextInput,
  required,
} from "react-admin";
import StudentEditToolbar from "./student-edit-toolbar";
import ScrollableTabbedForm from "@/shared/components/scrollable-tabbed-form";
import {
  FormGrid,
  FormSection,
  InlineFields,
  wideField,
} from "@/shared/components/form-grid";
import LocationFormSelector from "@/shared/components/location-form-selector";
import SecondLanguagesFormSelector from "@/features/students/components/second-languages-form-selector";
import MultipleFamiliarsForm from "@/features/students/components/multiple-familiars-form";

export const StudentEdit = () => {
  return (
    <Edit
      mutationMode="pessimistic"
      title={
        <span
          style={{
            fontWeight: 600,
            fontSize: "1.1rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#fff",
          }}
        >
          Editar Estudiante
        </span>
      }
    >
      <ScrollableTabbedForm toolbar={<StudentEditToolbar />}>
        <ScrollableTabbedForm.Tab label="Datos Personales">
          <FormSection title="Identificación">
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
          </FormSection>

          <FormSection title="Perfil">
            <ReferenceInput
              source="ethnicSelfIdentificationId"
              reference="ethnic-self-identifications"
            >
              <SelectInput label="Autoidentificación Étnica" />
            </ReferenceInput>
            <ReferenceInput source="nativeLanguageId" reference="languages">
              <SelectInput
                label="Lengua Materna"
                isRequired
                validate={required()}
              />
            </ReferenceInput>
            <SecondLanguagesFormSelector />
            <ReferenceInput source="religionId" reference="religions">
              <SelectInput label="Religión" />
            </ReferenceInput>
            <ReferenceInput source="civilStateId" reference="civil-states">
              <SelectInput label="Estado Civil" />
            </ReferenceInput>
            <NumberInput source="siblings" label="Número de Hermanos" min={0} />
            <NumberInput source="birthOrder" label="Lugar que ocupa" min={0} />
            <BooleanInput source="hasDisability" label="Tiene discapacidad" />
          </FormSection>

          <FormSection title="Contacto (solo si el estudiante es mayor de edad)">
            <TextInput source="cellPhone" label="Celular" />
            <TextInput source="landlinePhone" label="Teléfono fijo" />
            <TextInput source="email" label="Correo electrónico" />
          </FormSection>
        </ScrollableTabbedForm.Tab>

        <ScrollableTabbedForm.Tab label="Datos de Nacimiento">
          <FormGrid>
            <DateInput
              source="birthDate"
              label="Fecha de Nacimiento"
              isRequired
              validate={required()}
            />
            <ReferenceInput
              source="childbirthTypeId"
              reference="childbirth-types"
            >
              <SelectInput label="Tipo de Parto" />
            </ReferenceInput>
            <LocationFormSelector sourcePrefix="birthLocation" />
          </FormGrid>
        </ScrollableTabbedForm.Tab>

        <ScrollableTabbedForm.Tab label="Domicilio">
          <FormGrid>
            <TextInput
              source="address"
              label="Dirección"
              isRequired
              validate={required()}
              sx={wideField}
            />
            <LocationFormSelector sourcePrefix="addressLocation" />
            <InlineFields>
              <BooleanInput
                source="hasElectronicDevices"
                label="Cuenta con dispositivos electrónicos"
              />
              <BooleanInput
                source="hasInternetAccess"
                label="Cuenta con acceso a internet"
              />
            </InlineFields>
          </FormGrid>
        </ScrollableTabbedForm.Tab>

        <ScrollableTabbedForm.Tab label="Apoderados">
          <MultipleFamiliarsForm />
        </ScrollableTabbedForm.Tab>
      </ScrollableTabbedForm>
    </Edit>
  );
};
