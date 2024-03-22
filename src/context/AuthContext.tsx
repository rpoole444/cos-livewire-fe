import React, { createContext, useContext, useState } from 'react';
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
  const [user, setUser] = useState<UserType | null>(null); // Replace 'any' with your user type

  const login = (userData: UserType) => {
    console.log('Logging in user:', userData);
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
