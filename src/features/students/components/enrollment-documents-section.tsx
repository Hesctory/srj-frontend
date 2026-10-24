import {
  Box,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  Switch,
  Typography,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { useGetList } from "react-admin";
import { useFormContext, useWatch } from "react-hook-form";
import { EnrollmentDocument, RequiredDocument } from "@/types/enrollment";

interface EnrollmentDocumentsSectionProps {
  /** Same prefix convention as EnrollmentFormInputs / AcademicFormSelector. */
  sourcePrefix?: string;
}

/**
 * "Documentos entregados" checklist for a single enrollment.
 *
 * The document catalog is owned by the backend (`GET /required-documents`); this
 * renders one switch per catalog entry and keeps the form's `documents` field as
 * the wire-format array (`[{ requiredDocumentId, submitted }]`) at all times, so
 * the parent forms submit/read it without any transform of their own.
 */
const EnrollmentDocumentsSection = ({
  sourcePrefix,
}: EnrollmentDocumentsSectionProps) => {
  const base = sourcePrefix ? `${sourcePrefix}.` : "";
  const fieldName = `${base}documents`;
  const { setValue } = useFormContext();

  const { data: catalog = [], isLoading } = useGetList<RequiredDocument>(
    "required-documents",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "id", order: "ASC" },
    },
  );

  const current = (useWatch({ name: fieldName }) ?? []) as EnrollmentDocument[];
  const submittedById = new Map(
    current.map((doc) => [doc.requiredDocumentId, doc.submitted]),
  );
  const isChecked = (id: number) => submittedById.get(id) ?? false;

  // Write the full catalog back as the array wire format, flipping just `id`.
  const handleToggle = (id: number, checked: boolean) => {
    const next: EnrollmentDocument[] = catalog.map((doc) => ({
      requiredDocumentId: doc.id,
      submitted: doc.id === id ? checked : (submittedById.get(doc.id) ?? false),
    }));
    setValue(fieldName, next, { shouldDirty: true });
  };

  const total = catalog.length;
  const submitted = catalog.filter((doc) => isChecked(doc.id)).length;

  return (
    <Box
      sx={{
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 2,
        // Match the enrollment panel's height when side by side (desktop);
        // stay natural height when stacked (mobile).
        height: { xs: "auto", sm: "100%" },
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <DescriptionOutlinedIcon fontSize="small" color="action" />
        <Typography sx={{ flexGrow: 1 }}>Documentos entregados</Typography>
        <Typography variant="body2" color="text.secondary">
          {submitted} de {total}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={total ? (submitted / total) * 100 : 0}
        color={total > 0 && submitted === total ? "success" : "primary"}
        sx={{ mb: 1 }}
      />
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box display="flex" flexDirection="column">
          {catalog.map((doc) => (
            <FormControlLabel
              key={doc.id}
              control={
                <Switch
                  checked={isChecked(doc.id)}
                  onChange={(e) => handleToggle(doc.id, e.target.checked)}
                />
              }
              label={doc.name}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default EnrollmentDocumentsSection;
