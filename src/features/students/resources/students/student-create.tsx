import { useState } from "react";
import {
  BooleanInput,
  Button,
  Create,
  DateInput,
  NumberInput,
  ReferenceInput,
  SelectInput,
  TextInput,
  required,
  useDataProvider,
  useNotify,
  useRedirect,
} from "react-admin";
import { useFormContext } from "react-hook-form";
import SchoolIcon from "@mui/icons-material/School";
import CRUDToolBar from "@/app/layout/crud-toolbar";
import ScrollableTabbedForm from "@/shared/components/scrollable-tabbed-form";
import {
  FormGrid,
  FormSection,
  InlineFields,
  wideField,
} from "@/shared/components/form-grid";
import LocationFormSelector from "@/shared/components/location-form-selector";
import SecondLanguagesFormSelector from "@/features/students/components/second-languages-form-selector";
import MultipleFamiliarsForm, {
  FamiliarsTabLabel,
  familiarsProblem,
} from "@/features/students/components/multiple-familiars-form";
import EnrollmentFormInputs from "@/features/students/components/enrollment-form-inputs";
import EnrollmentConfirmDialog from "@/features/students/components/enrollment-confirm-dialog";
import {
  UNANSWERED_MONTH_MESSAGE,
  previewBodyOf,
  useEnrollmentConfirmation,
  withBillDefault,
} from "@/features/students/hooks/use-enrollment-preview";
import { serverErrorMessage } from "@/features/students/utils/server-errors";

export const ConfirmCreateStudentButton = () => {
  // A second click while the first is saving would create a second student.
  const [saving, setSaving] = useState(false);
  const { trigger, getValues } = useFormContext();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();
  const confirmation = useEnrollmentConfirmation();

  const handleClick = async () => {
    const isValid = await trigger();
    if (!isValid) {
      // Fields on another tab are out of sight, so say what stops it.
      const problem = familiarsProblem(getValues("familiars"));
      notify(problem ?? "ra.message.invalid_form", {
        type: "error",
        messageArgs: { _: problem ?? undefined },
      });
      return;
    }

    const values = getValues();
    // No student yet: eligibility goes through the familiars typed so far.
    const { go, unanswered, noQuestion } = await confirmation.ask(
      previewBodyOf(values.enrollment, null, values.familiars),
      typeof values.enrollment?.billEnrollmentMonth === "boolean",
    );
    if (unanswered) {
      notify(UNANSWERED_MONTH_MESSAGE, {
        type: "error",
        messageArgs: { _: UNANSWERED_MONTH_MESSAGE },
      });
      return;
    }
    if (!go) return;

    setSaving(true);
    try {
      await dataProvider.create("students", {
        data: {
          ...values,
          enrollment: withBillDefault(values.enrollment, noQuestion),
        },
      });
      notify("Estudiante creado exitosamente", {
        type: "success",
        messageArgs: { _: "Estudiante creado exitosamente" },
      });
      redirect("list", "students");
    } catch (error) {
      // A 422 names its fields ("Los días de gracia deben estar entre 0 y 2.");
      // the message alone says what to fix, so it is shown as it comes.
      const message = serverErrorMessage(
        error,
        "No se pudo crear el estudiante.",
      );
      notify(message, { type: "error", messageArgs: { _: message } });
    } finally {
      setSaving(false);
      confirmation.close();
    }
  };

  return (
    <>
      <Button
        label="Matricular"
        onClick={handleClick}
        size="large"
        sx={{
          backgroundColor: "success.main",
          color: "white",
          "&:hover": { backgroundColor: "success.dark" },
        }}
      >
        <SchoolIcon />
      </Button>
      <EnrollmentConfirmDialog
        {...confirmation.dialog}
        saving={saving}
        question="¿Confirmar la creación del estudiante y su matrícula?"
      />
    </>
  );
};

export const StudentCreate = () => {
  return (
    <Create
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
          Crear Estudiante
        </span>
      }
    >
      <ScrollableTabbedForm
        defaultValues={{ familiars: [] }}
        toolbar={
          <CRUDToolBar>
            <ConfirmCreateStudentButton />
          </CRUDToolBar>
        }
      >
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
            <TextInput source="cellphone" label="Celular" />
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

        <ScrollableTabbedForm.Tab label={<FamiliarsTabLabel />}>
          <MultipleFamiliarsForm />
        </ScrollableTabbedForm.Tab>

        <ScrollableTabbedForm.Tab label="Matrícula">
          <EnrollmentFormInputs sourcePrefix="enrollment" />
        </ScrollableTabbedForm.Tab>
      </ScrollableTabbedForm>
    </Create>
  );
};
