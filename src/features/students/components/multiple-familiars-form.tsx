import { useEffect } from "react";
import {
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  RecordContextProvider,
  ReferenceField,
  useNotify,
  useRecordContext,
} from "react-admin";
import FamiliarForm from "./familiar-form";

/**
 * A student has exactly one legal guardian, on create and on edit. The API
 * refuses anything else; asked here, the message comes before the submit and
 * names what to change. Null when the familiars are fine.
 */
export const familiarsProblem = (familiars: unknown): string | null => {
  const rows = Array.isArray(familiars) ? familiars : [];
  if (rows.length === 0) return "Debe agregar al menos un apoderado.";
  const tutors = rows.filter(
    (familiar) => familiar?.isGuardian === true,
  ).length;
  if (tutors === 0) return "Marca a un apoderado como «Es Tutor».";
  if (tutors > 1) return "El estudiante solo puede tener un tutor.";
  return null;
};

/**
 * The tab's own label: red after a refused attempt, because the list's error
 * belongs to no input, so React Admin does not mark the tab by itself, and the
 * problem may be out of sight on another tab.
 */
export const FamiliarsTabLabel = () => {
  const familiars = useWatch({ name: "familiars" });
  const { errors } = useFormState({ name: "familiars" });
  const refused = !!errors.familiars?.root && !!familiarsProblem(familiars);
  return (
    <Box component="span" sx={refused ? { color: "error.main" } : undefined}>
      Apoderados
    </Box>
  );
};

const RelationshipLabel = () => {
  const record = useRecordContext();
  return <>{record?.name ?? ""}</>;
};

interface FamiliarAccordionSummaryProps {
  sourcePrefix: string;
  /** 1-based position, used as the header until the name is typed in. */
  position: number;
}

const FamiliarAccordionSummary = ({
  sourcePrefix,
  position,
}: FamiliarAccordionSummaryProps) => {
  const names = useWatch({ name: `${sourcePrefix}.names` });
  const paternalLastname = useWatch({
    name: `${sourcePrefix}.paternalLastname`,
  });
  const maternalLastname = useWatch({
    name: `${sourcePrefix}.maternalLastname`,
  });
  const relationshipId = useWatch({ name: `${sourcePrefix}.relationshipId` });

  const fullName = [names, paternalLastname, maternalLastname]
    .filter(Boolean)
    .join(" ");

  return (
    <Typography>
      {relationshipId && (
        <Box
          component="span"
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            px: 1,
            py: 0.25,
            borderRadius: 1,
            mr: 1,
          }}
        >
          <RecordContextProvider value={{ id: relationshipId, relationshipId }}>
            <ReferenceField
              source="relationshipId"
              reference="familiar-relationship-types"
              link={false}
            >
              <RelationshipLabel />
            </ReferenceField>
          </RecordContextProvider>
        </Box>
      )}
      {/* A blank header is unusable once several are collapsed — and it leaves
          the bar looking like an empty strip while the form is still empty. */}
      {fullName || `Apoderado ${position}`}
    </Typography>
  );
};

const MultipleFamiliarsForm = () => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "familiars",
    rules: { validate: (value) => familiarsProblem(value) ?? true },
  });
  const familiars = useWatch({ name: "familiars" });
  const problem = familiarsProblem(familiars);

  // Guardar can be pressed from any tab, and this list may be out of sight.
  const notify = useNotify();
  const { submitCount } = useFormState();
  useEffect(() => {
    if (submitCount > 0 && problem) {
      notify(problem, { type: "error", messageArgs: { _: problem } });
    }
    // Once per attempt, not on every change to the familiars afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  return (
    <>
      {problem && (
        <Alert severity="warning" sx={{ mb: 2, width: "100%" }}>
          {problem}
        </Alert>
      )}
      {fields.map((field, index) => {
        const sourcePrefix = `familiars.${index}`;
        return (
          <Accordion
            key={field.id}
            defaultExpanded={index === fields.length - 1}
            sx={{ width: "100%" }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <FamiliarAccordionSummary
                sourcePrefix={sourcePrefix}
                position={index + 1}
              />
            </AccordionSummary>
            <AccordionDetails>
              <FamiliarForm sourcePrefix={sourcePrefix} />
              <Box mt={1}>
                <Button color="error" onClick={() => remove(index)}>
                  Eliminar Familiar
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
      <Box mt={2}>
        <Button variant="outlined" onClick={() => append({})}>
          Agregar Familiar
        </Button>
      </Box>
    </>
  );
};

export default MultipleFamiliarsForm;
