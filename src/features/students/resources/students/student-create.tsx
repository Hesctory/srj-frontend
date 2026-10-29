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
import {
  Button as MuiButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
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
import MultipleFamiliarsForm from "@/features/students/components/multiple-familiars-form";
import EnrollmentFormInputs from "@/features/students/components/enrollment-form-inputs";
import { serverErrorMessage } from "@/features/students/hooks/use-enrollment-preview";

const ConfirmCreateStudentButton = () => {
  const [open, setOpen] = useState(false);
  const { trigger, getValues } = useFormContext();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();

  const handleClick = async () => {
    const isValid = await trigger();
    if (!isValid) return;
    setOpen(true);
  };

  const handleConfirm = async () => {
    try {
      await dataProvider.create("students", { data: getValues() });
      notify("Estudiante creado exitosamente", { type: "success" });
      redirect("list", "students");
    } catch (error) {
      // A 422 names its fields ("Los días de gracia deben estar entre 0 y 2.");
      // the message alone says what to fix, so it is shown as it comes.
      notify(serverErrorMessage(error, "No se pudo crear el estudiante."), {
        type: "error",
      });
    } finally {
      setOpen(false);
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
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Confirmar creación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Confirmar la creación del estudiante y su matrícula?
          </Typography>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setOpen(false)}>Cancelar</MuiButton>
          <MuiButton
            variant="contained"
            color="success"
            onClick={handleConfirm}
          >
            Confirmar
          </MuiButton>
        </DialogActions>
      </Dialog>
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

        <ScrollableTabbedForm.Tab label="Apoderados">
          <MultipleFamiliarsForm />
        </ScrollableTabbedForm.Tab>

        <ScrollableTabbedForm.Tab label="Matrícula">
          <EnrollmentFormInputs sourcePrefix="enrollment" />
        </ScrollableTabbedForm.Tab>
      </ScrollableTabbedForm>
    </Create>
  );
};
