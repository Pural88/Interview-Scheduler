import React, { createContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user if token exists
    if (token) {
      authAPI
        .getCurrentUser()
        .then((res) => {
          // The api interceptor already unwraps Apiresponse.
          const payload = res.data;
          const userData = { ...payload, id: payload._id || payload.id };
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const payload = res.data;
    localStorage.setItem("token", payload.accessToken);
    // Ensure user has 'id' field for frontend use
    const userData = {
      ...payload.user,
      id: payload.user._id || payload.user.id,
    };
    setToken(payload.accessToken);
    setUser(userData);
    return res.data;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    const payload = res.data;
    // Registration returns { user, accessToken }; fall back to the payload
    // itself so an older response shape cannot crash the page.
    const account = payload.user || payload;

    if (payload.accessToken) {
      localStorage.setItem("token", payload.accessToken);
      setToken(payload.accessToken);
    }

    // Ensure user has 'id' field for frontend use
    setUser({ ...account, id: account._id || account.id });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
