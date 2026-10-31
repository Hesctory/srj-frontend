import { Alert, AlertTitle, Box, Stack, Typography } from "@mui/material";
import type { EnrollmentPreview } from "@/types/enrollment";

const MATCH_TITLE = {
  SIBLING: "Hermano matriculado encontrado",
  STAFF_CHILD: "Familiar trabajador encontrado",
};

// As wide as its sentences: on a wide screen a panel-wide alert is mostly
// empty tint.
const FIT = { width: "fit-content", maxWidth: "100%" };

/**
 * What the API found about the chosen concept: who qualifies, by name, and
 * what staff should check. Warnings inform; they never stop the enrollment.
 */
const EnrollmentChecks = ({
  eligibility,
  warnings,
}: Pick<EnrollmentPreview, "eligibility" | "warnings">) => {
  const found = eligibility?.met ? eligibility : null;
  if (!found && warnings.length === 0) return null;

  return (
    <Stack spacing={1}>
      {found && (
        <Alert severity="success" sx={FIT}>
          <AlertTitle>
            {found.condition
              ? MATCH_TITLE[found.condition]
              : "Se cumple la condición"}
          </AlertTitle>
          {found.matches.map((match) => match.fullName).join(", ")}
        </Alert>
      )}
      {warnings.length > 0 && (
        <Alert severity="warning" sx={FIT}>
          <AlertTitle>Revisa antes de matricular</AlertTitle>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {warnings.map((warning, index) => (
              <li key={index}>{warning.message}</li>
            ))}
          </Box>
          <Typography variant="caption" component="p" sx={{ mt: 0.5 }}>
            Puedes matricular igual.
          </Typography>
        </Alert>
      )}
    </Stack>
  );
};

export default EnrollmentChecks;
