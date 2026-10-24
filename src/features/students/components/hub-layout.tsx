import React from "react";
import { Box } from "@mui/material";
import { Title } from "react-admin";

interface HubLayoutProps {
  title: string;
  children?: React.ReactNode;
}

/**
 * Launcher layout for a hub of navigation cards.
 *
 * Cards flow in a top-anchored, responsive grid that fills from the top and
 * wraps as needed, so the page reads as a dense tool rather than a near-empty
 * splash — and it scales to any number of cards without special-casing counts.
 */
export const HubLayout = ({ title, children }: HubLayoutProps) => (
  <Box sx={{ p: 1 }}>
    {/* Feeds the AppBar title slot only — no in-page heading, which would
        merely duplicate it. The top strip is free for a control (e.g. a
        filter box) rather than a redundant label. */}
    <Title title={title} />

    <Box
      sx={{
        mt: 1,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: 2,
        alignItems: "stretch",
      }}
    >
      {children}
    </Box>
  </Box>
);
