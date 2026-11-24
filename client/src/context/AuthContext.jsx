import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getMe } from '../api/auth.api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('loop_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('loop_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [workspace, setWorkspace] = useState(() => {
    const saved = localStorage.getItem('loop_workspace');
    return saved ? JSON.parse(saved) : null;
  });
  const [role, setRole] = useState(() => localStorage.getItem('loop_role') || null);
  const [loading, setLoading] = useState(true);

  const saveAuthSession = (authData) => {
    setToken(authData.token);
    setUser(authData.user);
    setWorkspace(authData.workspace);
    setRole(authData.role);

    localStorage.setItem('loop_token', authData.token);
    localStorage.setItem('loop_user', JSON.stringify(authData.user));
    localStorage.setItem('loop_workspace', JSON.stringify(authData.workspace));
    localStorage.setItem('loop_role', authData.role);
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setWorkspace(null);
    setRole(null);

    localStorage.removeItem('loop_token');
    localStorage.removeItem('loop_user');
    localStorage.removeItem('loop_workspace');
    localStorage.removeItem('loop_role');
  }, []);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    saveAuthSession(res.data);
    return res.data;
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    saveAuthSession(res.data);
    return res.data;
  };

  const refreshProfile = useCallback(async () => {
    const storedToken = localStorage.getItem('loop_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await getMe();
      setUser(res.data.user);
      setWorkspace(res.data.workspace);
      setRole(res.data.role);
      localStorage.setItem('loop_user', JSON.stringify(res.data.user));
      localStorage.setItem('loop_workspace', JSON.stringify(res.data.workspace));
      localStorage.setItem('loop_role', res.data.role);
    } catch (err) {
      console.warn('Failed to refresh user profile:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        workspace,
        role,
        isAuthenticated: Boolean(token && user),
        loading,
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
