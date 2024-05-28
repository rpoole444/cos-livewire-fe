import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserType } from '../types'

interface AuthContextType {
  user: UserType | null;
  login: (email:string, password:string) => Promise<void>; // Be specific with userData type if possible
  logout: () => void;
}

// Provide a default context object that matches the AuthContextType shape
const defaultContext: AuthContextType = {
  user: null,
  login: async (email: string, password: string) => { /* This is now an async stub that does nothing but matches the type */ },
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
    // Function to check user's current authentication status
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/session', { credentials: 'include' });
        const data = await response.json();
        if (data.isLoggedIn) {
          setUser(data.user); // Set the user if the session check returns logged in
        }
      } catch (error) {
        console.error('Error fetching auth status:', error);
      }
    };

    // Call the function on component mount
    checkAuthStatus();
  }, []);


  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user); // Set the user upon successful login
      } else {
        throw new Error(data.message || 'Failed to login');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      console.log("Response received:", response);

      if (response.ok) {
        setUser(null); // Clear the user upon successful logout
        console.log("logout successful:", response);

      } else {
        throw new Error('Failed to logout');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Provide the login and logout functions to the context
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
