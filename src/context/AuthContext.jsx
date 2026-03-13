/**
 * AuthContext
 * Stores the authenticated user and JWT token.
 * Persists session in localStorage; restores on page reload via lazy initializer.
 */
import { createContext, useContext, useState } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

// Restore session synchronously from localStorage (lazy initializer avoids effect)
const restoreUser = () => {
  const token     = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");
  if (token && savedUser) {
    try { return JSON.parse(savedUser); }
    catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(restoreUser);

  const _persist = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    _persist(data.data.token, data.data.user);
    return data.data.user;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    _persist(data.data.token, data.data.user);
    return data.data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
