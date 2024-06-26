import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserType } from '../types';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: UserType | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: UserType) => void;
}

const defaultContext: AuthContextType = {
  user: null,
  login: async (email: string, password: string) => {},
  logout: () => {},
  updateUser: (updatedUser: UserType) => {},
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);


  
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/session', { credentials: 'include' });
        const data = await response.json();
        if (data.isLoggedIn) {
          const profilePictureResponse = await fetch('http://localhost:3000/api/auth/profile-picture', { credentials: 'include' });
          const profilePictureData = await profilePictureResponse.json();
          setUser({ ...data.user, profile_picture: profilePictureData.profile_picture_url });
        }
      } catch (error) {
        console.error('Error fetching auth status:', error);
      }
    };

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
        const profilePictureResponse = await fetch('http://localhost:3000/api/auth/profile-picture', { credentials: 'include' });
        const profilePictureData = await profilePictureResponse.json();
        const parsedGenres = JSON.parse(data.user.top_music_genres);
        setUser({ ...data.user,top_music_genres: Array.isArray(parsedGenres) ? parsedGenres : [], profile_picture: profilePictureData.profile_picture_url });
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
      if (response.ok) {
        setUser(null);
      } else {
        throw new Error('Failed to logout');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateUser = (updatedUser: UserType) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
