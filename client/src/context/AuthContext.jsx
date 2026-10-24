import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiVerify } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('wayground_admin_token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }
      try {
        const res = await apiVerify();
        if (res.success) {
          setIsAuthenticated(true);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Auth verification check failed:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [token]);

  const login = async (password) => {
    const res = await apiLogin(password);
    if (res.success && res.token) {
      localStorage.setItem('wayground_admin_token', res.token);
      setToken(res.token);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const logout = () => {
    localStorage.removeItem('wayground_admin_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
