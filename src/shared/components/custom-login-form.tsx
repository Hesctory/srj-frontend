import { LoginForm } from "react-admin";
import { Typography, Box } from "@mui/material";
import logo from "../../../public/logoSRJ.png"; // tu logo en src o public

// Login personalizado
const CustomLoginForm = () => (
  <>
    <Box textAlign="center" mb={3}>
      <img src={logo} alt="Logo" width={150} />
      <Typography variant="body2" align="center" color="textPrimary" mt={1}>
        Bienvenido, por favor inicia sesión
      </Typography>
    </Box>
    <LoginForm /> {/* aquí están los inputs por defecto */}
  </>
);

export default CustomLoginForm;
