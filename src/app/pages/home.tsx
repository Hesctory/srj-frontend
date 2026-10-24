import React from "react";
import { Box, Card, Typography, Avatar } from "@mui/material";
import logoSRJ from "../../../public/logoSRJ.png";

/** "Buenos días / tardes / noches" based on the local hour. */
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

/** Today as e.g. "martes, 17 de junio de 2026" (capitalized). */
const getLongDate = (): string => {
  const formatted = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const Home: React.FC = () => {
  const userData = JSON.parse(localStorage.getItem("user") || "null");
  const name: string =
    userData?.name ??
    userData?.fullName ??
    userData?.names ??
    userData?.username ??
    "";

  return (
    <Box
      sx={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 6,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 640,
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Royal-blue accent strip */}
        <Box sx={{ height: 6, bgcolor: "primary.main" }} />

        <Box
          sx={{
            px: { xs: 3, sm: 6 },
            py: { xs: 5, sm: 7 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2.5,
          }}
        >
          <Avatar
            src={logoSRJ}
            alt="SRJ"
            variant="rounded"
            sx={{
              width: 88,
              height: 88,
              bgcolor: "transparent",
              "& img": { objectFit: "contain" },
            }}
          />

          <Box>
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              {getGreeting()}
              {name ? `, ${name}` : ""}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ mt: 1, color: "text.secondary", fontWeight: 500 }}
            >
              Sistema de gestión escolar SRJ
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 1,
              px: 2.5,
              py: 1,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {getLongDate()}
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};
