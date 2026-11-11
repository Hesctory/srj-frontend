import { Box, Typography } from "@mui/material";

/**
 * Raw backend text (event messages, last errors) can carry internal ids and
 * stack-like phrases. It stays one click away, never as headline copy.
 */
export const TechnicalDetail = ({ text }: { text: string | null }) => {
  if (!text) return null;
  return (
    <Box component="details" sx={{ mt: 0.5 }}>
      <Typography
        component="summary"
        variant="caption"
        color="text.secondary"
        sx={{ cursor: "pointer", userSelect: "none" }}
      >
        Detalle técnico
      </Typography>
      <Box
        component="code"
        sx={{
          display: "block",
          mt: 0.5,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "0.75rem",
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </Box>
    </Box>
  );
};

export default TechnicalDetail;
