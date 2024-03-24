import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserType } from '../types'

interface AuthContextType {
  user: UserType | null;
  login: (userData: any) => void; // Be specific with userData type if possible
  logout: () => void;
}

// Provide a default context object that matches the AuthContextType shape
const defaultContext: AuthContextType = {
  user: null,
  login: () => {}, // These are just stub functions that do nothing
  logout: () => {},
};

// Provide a default value matching the AuthContextType
const AuthContext = createContext<AuthContextType>(defaultContext);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    // Access localStorage in the useEffect hook to ensure it's only called client-side
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  },[])
  const login = (userData: UserType) => {
    console.log('Logging in user:', userData);
    localStorage.setItem('user', JSON.stringify(userData)); // Save user data to localStorage
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
