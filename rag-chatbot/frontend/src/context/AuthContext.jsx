// context/AuthContext.jsx
// Holds "who is logged in" in one place, so any component can ask
// useAuth() instead of passing the user down through props everywhere.

import { createContext, useContext, useState } from "react";
import { api, saveToken, clearToken, isLoggedIn } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // On first load, check if we have a saved user from a previous session.
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  async function login(email, password) {
    const data = await api.login(email, password);
    saveToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function signup(name, email, password) {
    const data = await api.signup(name, email, password);
    saveToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    clearToken();
    localStorage.removeItem("user");
    setUser(null);
  }

  const value = {
    user,
    isLoggedIn: isLoggedIn() && Boolean(user),
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
