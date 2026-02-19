
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check for auth token on initial load
    const token = sessionStorage.getItem('authToken');
    if (token === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    // Mock authentication
    if (email === 'admin@optionable.crypto' && pass === 'admin123') {
      sessionStorage.setItem('authToken', 'true');
      setIsAuthenticated(true);
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('Invalid credentials'));
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('authToken');
    setIsAuthenticated(false);
    window.location.hash = '/';
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
