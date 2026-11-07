import { useCreatePath } from "react-admin";
import { Link } from "react-router-dom";
import { Chip } from "@mui/material";
import RuleFolderIcon from "@mui/icons-material/RuleFolder";

/** A small marker that links to the correction in progress; renders nothing without one. */
export const OpenCaseLink = ({
  caseId,
}: {
  caseId: number | null | undefined;
}) => {
  const createPath = useCreatePath();
  if (typeof caseId !== "number") return null;
  return (
    <Chip
      size="small"
      color="warning"
      variant="outlined"
      icon={<RuleFolderIcon />}
      label={`Corrección #${caseId}`}
      component={Link}
      to={createPath({
        resource: "payment-recovery-cases",
        type: "show",
        id: caseId,
      })}
      clickable
      onClick={(event: React.MouseEvent) => event.stopPropagation()}
    />
  );
};

export default OpenCaseLink;
