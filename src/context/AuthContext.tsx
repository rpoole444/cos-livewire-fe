import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserType } from '../types';
import { useRouter } from 'next/router';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;


interface AuthContextType {
  user: UserType | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: UserType) => void;
  loading: boolean;
}
interface ProfilePictureResponse {
  profile_picture_url: string;
}

const defaultContext: AuthContextType = {
  user: null,
  login: async (email: string, password: string) => {},
  logout: () => {},
  updateUser: (updatedUser: UserType) => {},
  loading: true,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true); // ✅ Add this line


  
 useEffect(() => {
  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.isLoggedIn) {
        // Fetch the profile picture
        const profilePictureResponse = await fetch(
          `${API_BASE_URL}/api/auth/profile-picture`,
          { credentials: 'include' }
        );
        const profilePictureData = await profilePictureResponse.json();

        // Parse genres if necessary
        let parsedGenres = [];
        if (data.user.top_music_genres) {
          try {
            parsedGenres = JSON.parse(data.user.top_music_genres);
          } catch (error) {
            console.error('Error parsing genres:', error);
          }
        }

        // Set user state with all data at once
        setUser({
          ...data.user,
          displayName: data.user.displayName ?? data.user.display_name ?? '', 
          top_music_genres: Array.isArray(parsedGenres) ? parsedGenres : [],
          profile_picture: profilePictureData.profile_picture_url || null,
          trial_ends_at: data.user.trial_ends_at || null, 

        });
        console.log("setUser payload:", {
          ...data.user,
          displayName: data.user.displayName ?? data.user.display_name
        });
      }
    } catch (error) {
      console.error('Error fetching auth status:', error);
    }finally {
      setLoading(false); // ✅ Always end loading
    }
  };

  checkAuthStatus();
}, []);


const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Login failed with status ${response.status}`);
    }

    const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile-picture`, {
      credentials: 'include',
    });

    const profileData = profileRes.ok
      ? await profileRes.json()
      : { profile_picture_url: null };

    const genres = Array.isArray(data.user.top_music_genres)
      ? data.user.top_music_genres
      : (() => {
          try {
            return JSON.parse(data.user.top_music_genres);
          } catch {
            return [];
          }
        })();

    setUser({
      ...data.user,
      displayName: data.user.displayName ?? data.user.display_name ?? '', 
      top_music_genres: genres,
      profile_picture: profileData.profile_picture_url,
      trial_ends_at: data.user.trial_ends_at || null, 
    });

console.log("setUser payload:", {
  ...data.user,
  displayName: data.user.displayName ?? data.user.display_name
});

  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};



  const logout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
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
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
