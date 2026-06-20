import { createContext, useContext, useMemo, useState } from "react";
import { API_URL } from "../config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Access/refresh токены храним только в памяти (React state), не в localStorage.
  // TODO(production): refresh token нужно перенести в httpOnly cookie, выставляемую backend'ом,
  // чтобы он не был доступен из JS и переживал перезагрузку страницы.
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  async function register(email, password, displayName) {
    const response = await fetch(`${API_URL}/api/auth/register-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!response.ok) {
      const error = new Error("register_failed");
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  async function login(identifier, password) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      const error = new Error("login_failed");
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return data;
  }

  async function logout() {
    if (refreshToken) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // выходим из аккаунта локально даже если backend недоступен
      }
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      register,
      login,
      logout,
    }),
    [user, accessToken, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
