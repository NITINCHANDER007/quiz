import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiVerify } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('quizpulse_admin_token') || localStorage.getItem('wayground_admin_token') || null);
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
    try {
      const res = await apiLogin(password);
      if (res && res.success && res.token) {
        localStorage.setItem('quizpulse_admin_token', res.token);
        setToken(res.token);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: res?.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: 'Server communication error: ' + (err.message || 'offline') };
    }
  };

  const logout = () => {
    localStorage.removeItem('quizpulse_admin_token');
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
