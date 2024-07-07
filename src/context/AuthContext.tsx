import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserType } from '../types';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: UserType | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: UserType) => void;
}
interface ProfilePictureResponse {
  profile_picture_url: string;
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
        const response = await fetch('https://alpine-groove-guide-be-e5150870a33a.herokuapp.com/api/auth/session', { credentials: 'include' });
        const data = await response.json();
        if (data.isLoggedIn) {
          const profilePictureResponse = await fetch('https://alpine-groove-guide-be-e5150870a33a.herokuapp.com/api/auth/profile-picture', { credentials: 'include' });
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
    const response = await fetch('https://alpine-groove-guide-be-e5150870a33a.herokuapp.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new Error('Failed to login');
      }
      throw new Error(errorData.message || 'Failed to login');
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error('Failed to parse response JSON');
    }

    console.log('Login data:', data);

    const profilePictureResponse = await fetch('https://alpine-groove-guide-be-e5150870a33a.herokuapp.com/api/auth/profile-picture', {
      credentials: 'include',
    });

    console.log('Profile picture response:', profilePictureResponse);

    let profilePictureData = {
      profile_picture_url: null,
    };
    if (profilePictureResponse.ok) {
      profilePictureData = await profilePictureResponse.json();
    }

    console.log('Profile picture data:', profilePictureData);

    let parsedGenres = [];
    if (data.user.top_music_genres) {
      try {
        parsedGenres = JSON.parse(data.user.top_music_genres);
      } catch (error) {
        console.error('Error parsing genres:', error);
      }
    }

    setUser({
      ...data.user,
      top_music_genres: Array.isArray(parsedGenres) ? parsedGenres : [],
      profile_picture: profilePictureData.profile_picture_url || null,
    });
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};





  const logout = async () => {
    try {
      const response = await fetch('https://alpine-groove-guide-be-e5150870a33a.herokuapp.com/api/auth/logout', {
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
