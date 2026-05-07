import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/index.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
            // ✅ Only clear session if the token is genuinely rejected (401)
            // For network errors, CORS, 5xx — keep the saved session intact
            if (error.response?.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setToken(null);
              setUser(null);
            }
            // All other errors: silently keep the localStorage session
            // The user stays logged in; getMe will retry next page load
          }
        }
      } catch (error) {
        console.error('Session restore error:', error);
      } finally {
        setIsLoading(false); // CRITICAL: always unblock the app
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    if (response.data.success) {
      const { user, token } = response.data.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data;
    }
    throw new Error('Login failed');
  };

  const signup = async (name, email, password) => {
    const response = await authAPI.signup(name, email, password);
    if (response.data.success) {
      const { user, token } = response.data.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data;
    }
    throw new Error('Signup failed');
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