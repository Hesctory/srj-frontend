import { Box, ButtonBase, Typography, type SxProps } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { ReactElement, ReactNode } from "react";
import React from "react";

interface HubButtonProps {
  icon: ReactElement;
  url: string;
  children: ReactNode;
  /** Accent color for the icon panel. Each card keeps its own color forever so
   *  heavy users navigate by color + position, not by reading. Defaults to the
   *  theme primary. */
  color?: string;
  /** Keyboard shortcut digit shown as a corner badge. The hub owns the actual
   *  keypress handling; this only renders the hint. */
  hotkey?: string | number;
}

export const HubButton = ({
  icon,
  url,
  children,
  color,
  hotkey,
}: HubButtonProps) => {
  const navigate = useNavigate();
  const accent = color ?? "primary.main";

  return (
    <ButtonBase
      onClick={() => navigate(url)}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        width: "100%",
        height: "100%",
        minHeight: 104,
        textAlign: "left",
        overflow: "hidden",
        justifyContent: "flex-start",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          borderColor: accent,
          boxShadow: 2,
        },
      }}
    >
      {hotkey != null && (
        <Box
          sx={{
            position: "absolute",
            top: 6,
            right: 8,
            minWidth: 18,
            height: 18,
            px: 0.5,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
            color: "text.disabled",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {hotkey}
        </Box>
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2.5,
          flexShrink: 0,
          backgroundColor: accent,
          color: "common.white",
        }}
      >
        {React.cloneElement(icon as ReactElement<{ sx?: SxProps }>, {
          sx: { fontSize: "2.5rem" },
        })}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          p: 2,
          gap: 0.5,
          flexGrow: 1,
        }}
      >
        {children}
      </Box>
    </ButtonBase>
  );
};

export const HubButtonTitle = ({ children }: { children: ReactNode }) => (
  <Typography variant="h6" fontWeight="bold">
    {children}
  </Typography>
);

export const HubButtonDescription = ({ children }: { children: ReactNode }) => (
  <Typography variant="body2" color="text.secondary">
    {children}
  </Typography>
);
