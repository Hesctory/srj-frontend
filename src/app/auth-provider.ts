import { AuthProvider } from "react-admin";
import { httpClient, API_URL } from "@/app/data-provider";
import { parseTokenExpiry } from "@/utils/token";

interface LoginParams {
  username: string;
  password: string;
}

const authProvider: AuthProvider = {
  login: async ({ username, password }: LoginParams) => {
    const { json } = await httpClient(`${API_URL}/login`, {
      method: "POST",
      body: JSON.stringify({ email: username, password }),
    });
    if (!json.success || !json.user || !json.token) {
      return Promise.reject(json.error ?? "Login fallido");
    }
    localStorage.setItem("token", json.token);
    localStorage.setItem("user", JSON.stringify(json.user));
    return Promise.resolve();
  },

  logout: async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return Promise.resolve();
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject({ redirectTo: "/login" });

    const expiry = parseTokenExpiry(token);
    if (expiry && expiry < new Date()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return Promise.reject({ redirectTo: "/login" });
    }

    return Promise.resolve();
  },

  checkError: async (error: {
    status?: number;
    response?: { status?: number };
  }) => {
    const status = error.status || error.response?.status;

    // 401: the session is invalid (missing/expired/rejected token) — the user
    // is not authenticated. Clear the session and let React Admin redirect to
    // the login page.
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return Promise.reject();
    }

    // 403: the user is authenticated but not authorized for this action. Keep
    // the session and stay on the current page — `logoutUser: false` with no
    // `redirectTo` makes React Admin only show the error notification below.
    if (status === 403) {
      return Promise.reject({
        logoutUser: false,
        message: "No tienes permiso para realizar esta acción.",
      });
    }

    return Promise.resolve();
  },

  getPermissions: async () => {
    // Yield one macrotask before resolving. React Admin's logout flow
    // (LogoutOnMount -> useLogout) navigates to /login and then resets the
    // store/query cache on a setTimeout(0) to win a race against re-rendering.
    // If getPermissions resolves *synchronously*, the usePermissions query
    // re-resolves within the same commit, re-rendering CoreAdminRoutes and
    // remounting <LogoutOnMount>, which calls logout() again -> infinite loop
    // ("Maximum update depth exceeded"). React 19's scheduling made this race
    // reproducible. Deferring the resolution by a macrotask lets the redirect
    // commit first and breaks the cycle.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const userJson = localStorage.getItem("user");
    if (!userJson) return Promise.resolve(null);
    try {
      const user = JSON.parse(userJson);
      return Promise.resolve(user.roles ?? null);
    } catch {
      return Promise.resolve(null);
    }
  },
};

export default authProvider;
