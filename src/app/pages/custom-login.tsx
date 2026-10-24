import { Login } from "react-admin";
import CustomLoginForm from "@/shared/components/custom-login-form";

const loginStyles = {
  backgroundColor: "#f7f9fc", // fondo claro suave (gris-azulado)
};

const CustomLogin = () => {
  return (
    <Login sx={loginStyles} title="Bienvenido a SRJ System">
      <CustomLoginForm />
    </Login>
  );
};

export default CustomLogin;
