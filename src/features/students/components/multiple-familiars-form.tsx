import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  RecordContextProvider,
  ReferenceField,
  useRecordContext,
} from "react-admin";
import FamiliarForm from "./familiar-form";

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
    rules: {
      validate: (value) =>
        (value && value.length > 0) || "Debe agregar al menos un apoderado",
    },
  });

  return (
    <>
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
