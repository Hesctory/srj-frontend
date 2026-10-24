import { ReferenceInput, SelectInput, TextInput, required } from "react-admin";
import { Box, Typography } from "@mui/material";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import { FormGrid } from "@/shared/components/form-grid";
import AcademicFormSelector from "./academic-form-selector";
import EnrollmentDocumentsSection from "./enrollment-documents-section";

interface EnrollmentFormInputsProps {
  sourcePrefix?: string;
}

const EnrollmentFormInputs = ({ sourcePrefix }: EnrollmentFormInputsProps) => {
  const base = sourcePrefix ? `${sourcePrefix}.` : "";

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", sm: "row" }}
      gap={2}
      alignItems="stretch"
      // TabbedForm.Tab lays its children out as a flex column that does not
      // stretch them, so without this the two panels collapse to their content
      // width and huddle on the left of a wide screen.
      width="100%"
    >
      <Box
        flex={1}
        width="100%"
        display="flex"
        flexDirection="column"
        gap={1}
        sx={{
          // Matched panel only on desktop; mobile keeps the plain, boxless form.
          borderWidth: { xs: 0, sm: 1 },
          borderStyle: "solid",
          borderColor: "divider",
          borderRadius: 1,
          p: { xs: 0, sm: 2 },
        }}
      >
        <Box
          alignItems="center"
          gap={1}
          mb={1}
          sx={{ display: { xs: "none", sm: "flex" } }}
        >
          <BadgeOutlinedIcon fontSize="small" color="action" />
          <Typography>Datos de matrícula</Typography>
        </Box>
        {/* Container-driven tracks, not viewport breakpoints: this panel only
            owns half the row, so a viewport-wide "xl" would slice it into
            columns too narrow to read. */}
        <FormGrid minColumnWidth={220}>
          <AcademicFormSelector sourcePrefix={sourcePrefix} />
          <ReferenceInput
            source={`${base}schoolFeeConceptId`}
            reference="school-fee-concepts"
          >
            <SelectInput
              label="Concepto de Cobro"
              fullWidth
              isRequired
              validate={required()}
            />
          </ReferenceInput>
          <TextInput
            source={`${base}previousSchool`}
            label="Colegio Anterior"
            fullWidth
          />
        </FormGrid>
      </Box>
      <Box flex={1} width="100%">
        <EnrollmentDocumentsSection sourcePrefix={sourcePrefix} />
      </Box>
    </Box>
  );
};

export default EnrollmentFormInputs;
