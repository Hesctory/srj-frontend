import { Admin, Resource } from "react-admin";
import polyglotI18nProvider from "ra-i18n-polyglot";
import spanishMessages from "./i18n/es";
import { MyLayout } from "@/app/layout/my-layout";
import { lightTheme, darkTheme } from "@/app/theme";
import { dataProvider } from "@/app/data-provider";
import authProvider from "@/app/auth-provider";
import { createAppStore } from "@/app/store";
import CustomLogin from "@/app/pages/custom-login";
import { Home } from "@/app/pages/home";
import { AppCustomRoutes, appResources } from "@/features";
import { BrowserRouter } from "react-router-dom";

const i18nProvider = polyglotI18nProvider(() => spanishMessages, "es");

// Created once outside the component: the store must not be re-instantiated on
// every render.
const store = createAppStore();

export const App = () => (
  <BrowserRouter>
    <Admin
      requireAuth
      theme={lightTheme}
      darkTheme={darkTheme}
      defaultTheme="light"
      i18nProvider={i18nProvider}
      dataProvider={dataProvider}
      authProvider={authProvider}
      store={store}
      layout={MyLayout}
      loginPage={CustomLogin}
      dashboard={Home}
    >
      {appResources}
      <Resource name="employment-contracts" />
      <Resource name="enrollment-charges" />
      <Resource name="payment-methods" />
      <Resource name="product-types" />
      <Resource name="garment-genders" />
      <Resource name="product-stock-movement-types" />
      <Resource name="product-stock-movements" />
      {/* Reference lists the catalogue reads: the size ladder and its scales.
          `sizes/scales` is a sub-path, which simple-rest handles as a resource
          name unchanged. */}
      <Resource name="sizes" />
      <Resource name="sizes/scales" />
      <Resource name="uniform-sets" />

      {AppCustomRoutes}
    </Admin>
  </BrowserRouter>
);
