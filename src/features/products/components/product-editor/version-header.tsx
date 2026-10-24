import { useState, type ComponentProps } from "react";
import { Box, Button, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CopyYearPopover from "./copy-year-popover";
import VersionMenu from "./version-menu";

type CopyProps = Omit<
  ComponentProps<typeof CopyYearPopover>,
  "anchorEl" | "onClose"
>;

interface VersionHeaderProps {
  displayLabel: string;
  meta: string;
  notes: string | null;
  copy: CopyProps;
  menu: ComponentProps<typeof VersionMenu>;
}

/** The line above a version's rows: who it is, a summary, and its actions. */
const VersionHeader = ({
  displayLabel,
  meta,
  notes,
  copy,
  menu,
}: VersionHeaderProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        columnGap: 1.25,
        minHeight: 36,
        minWidth: 0,
        mb: 0.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          columnGap: 1.25,
          minWidth: 0,
          flex: "1 1 auto",
        }}
      >
        <Typography variant="subtitle2" component="h3" noWrap>
          {displayLabel}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {meta}
        </Typography>
        {notes && (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ fontStyle: "italic", minWidth: 0 }}
            title={notes}
          >
            {notes}
          </Typography>
        )}
      </Box>
      <Button
        size="small"
        startIcon={<ContentCopyIcon fontSize="small" />}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ flexShrink: 0 }}
      >
        Copiar de otro año
      </Button>
      <VersionMenu {...menu} />
      {anchor && (
        <CopyYearPopover
          {...copy}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
          onApply={(...args) => {
            copy.onApply(...args);
            setAnchor(null);
          }}
        />
      )}
    </Box>
  );
};

export default VersionHeader;
