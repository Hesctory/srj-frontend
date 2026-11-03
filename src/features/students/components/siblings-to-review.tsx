import { Box, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { MONTH_NAMES } from "@/features/students/hooks/use-enrollment-preview";
import type { EnrollmentWithdrawalSibling } from "@/types/enrollment";

/**
 * Siblings whose sibling discount may no longer hold once a student leaves
 * (a withdrawal or a deletion). Listed for staff to fix, never changed here.
 */
const siblingAdvice = ({ repriceFromMonth }: EnrollmentWithdrawalSibling) =>
  repriceFromMonth === null
    ? "ya no quedan meses por cambiar"
    : `revisar su precio desde ${MONTH_NAMES[repriceFromMonth - 1]}`;

export const Siblings = ({
  siblings,
  linked,
}: {
  siblings: EnrollmentWithdrawalSibling[];
  /**
   * Once withdrawn, each one opens in its own tab, so this list stays for the
   * next. Until then, they are only named: staff are still deciding.
   */
  linked: boolean;
}) => (
  <Box component="section" aria-label="Hermanos con descuento">
    <Typography variant="subtitle2">Hermanos con descuento</Typography>
    <Typography variant="caption" color="text.secondary">
      Su precio no cambia solo: hay que editar su matrícula.
    </Typography>
    <Box component="ul" sx={{ m: 0, pl: 2 }}>
      {siblings.map((sibling) => (
        <Typography variant="body2" component="li" key={sibling.enrollmentId}>
          {linked ? (
            <Link
              component={RouterLink}
              to={`/students/${sibling.studentId}`}
              target="_blank"
              rel="noopener"
            >
              {sibling.fullName}
            </Link>
          ) : (
            sibling.fullName
          )}{" "}
          ({sibling.conceptName}): {siblingAdvice(sibling)}
        </Typography>
      ))}
    </Box>
  </Box>
);
