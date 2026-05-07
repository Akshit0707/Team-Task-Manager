import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/index.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // starts true — blocks render until session checked

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));

          try {
            const response = await authAPI.getMe();
            if (response.data.success) {
              setUser(response.data.data.user);
              localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }
          } catch (error) {
            // Token is invalid/expired — clear everything
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Session restore error:', error);
      } finally {
        setIsLoading(false); // ✅ CRITICAL — always unblock the app after check
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    // ✅ Do NOT touch isLoading here — it causes ProtectedRoute to re-evaluate
    // and redirect to /login before isAuthenticated updates
    try {
      const response = await authAPI.login(email, password);
      if (response.data.success) {
        const { user, token } = response.data.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  };

  const signup = async (name, email, password) => {
    // ✅ Same — do NOT set isLoading here
    try {
      const response = await authAPI.signup(name, email, password);
      if (response.data.success) {
        const { user, token } = response.data.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;