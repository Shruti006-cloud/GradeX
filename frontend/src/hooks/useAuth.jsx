import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      if (authService.isAuthenticated()) {
        try {
          const profile = await authService.getMe();
          setTeacher(profile);
        } catch (e) {
          authService.logout();
          setTeacher(null);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    const profile = await authService.login(email, password);
    setTeacher(profile);
    return profile;
  };

  const logout = async () => {
    await authService.logout();
    setTeacher(null);
  };

  const value = {
    teacher,
    login,
    logout,
    isLoading,
    isAuthenticated: !!teacher,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
