import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { Siblings } from "./siblings-to-review";
import type {
  StudentDeletionPreview,
  StudentDeletionWarning,
} from "@/types/student";
import { formatMoney } from "@/utils/money";

/** The API words each warning; these stand in only if it sends none. */
const warningLabel = ({ code, message, amount }: StudentDeletionWarning) => {
  if (message) return message;
  switch (code) {
    case "CLASSES_STARTED":
      return "Ya empezaron las clases.";
    case "OVERDUE_DEBT":
      return `Se eliminará una deuda vencida de ${formatMoney(amount)}.`;
    case "SIBLING_DISCOUNT":
      return "Hay hermanos con descuento por hermano.";
    case "VOIDED_PAYMENT":
      return "El estudiante tuvo pagos que luego se anularon.";
    default:
      return "Advertencia sin detalle.";
  }
};

interface StudentDeleteSummaryProps {
  preview: StudentDeletionPreview;
  ticked: Set<number>;
  onTick: (index: number, checked: boolean) => void;
  disabled: boolean;
}

/** What a DELETE does, and the warnings staff must tick before it. */
const StudentDeleteSummary = ({
  preview,
  ticked,
  onTick,
  disabled,
}: StudentDeleteSummaryProps) => (
  <>
    <Typography variant="body2">
      El estudiante dejará de aparecer en las listas.
      {preview.enrollmentId !== null &&
        " Su matrícula se anula y sus cobros salen de Caja."}{" "}
      Para recuperarlo, vuelve a registrarlo con su documento.
    </Typography>
    {preview.warnings.length > 0 && (
      <Box component="section" aria-label="Advertencias">
        <Typography variant="subtitle2">
          Confirma cada advertencia para eliminar:
        </Typography>
        <Stack>
          {preview.warnings.map((warning, index) => (
            <Box key={`${warning.code}-${index}`}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={ticked.has(index)}
                    onChange={(event) => onTick(index, event.target.checked)}
                    disabled={disabled}
                  />
                }
                label={warningLabel(warning)}
              />
              {warning.code === "SIBLING_DISCOUNT" &&
                preview.siblings.length > 0 && (
                  <Box sx={{ pl: 4 }}>
                    <Siblings siblings={preview.siblings} linked={false} />
                  </Box>
                )}
            </Box>
          ))}
        </Stack>
      </Box>
    )}
  </>
);

export default StudentDeleteSummary;
