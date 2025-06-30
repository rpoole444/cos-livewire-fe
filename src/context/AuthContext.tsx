import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { UserType } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface AuthContextType {
  user: UserType | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: UserType) => void;
  loading: boolean;
  refetchUser: () => Promise<void>;
}

const defaultContext: AuthContextType = {
  user: null,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
  loading: true,
  refetchUser: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const parseGenres = (input: any): string[] => {
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
      try {
        return JSON.parse(input);
      } catch (err) {
        console.error('Genre parse error:', err);
      }
    }
    return [];
  };

  const fetchUserWithExtras = useCallback(async (): Promise<UserType | null> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
      credentials: 'include',
    });
    const data = await response.json();

    if (!data.isLoggedIn) return null;

    const profilePicRes = await fetch(`${API_BASE_URL}/api/auth/profile-picture`, {
      credentials: 'include',
    });
    const profilePicData = await profilePicRes.json();

    return {
      ...data.user,
      displayName: data.user.displayName ?? data.user.display_name ?? '',
      top_music_genres: parseGenres(data.user.top_music_genres),
      profile_picture: profilePicData.profile_picture_url || null,
      trial_ends_at: data.user.trial_ends_at || null,
    };
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await fetchUserWithExtras();
        if (userData) {
          setUser(userData);
          console.log("setUser payload:", userData);
        }
      } catch (err) {
        console.error('Error fetching auth status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [fetchUserWithExtras]);

  const login = async (email: string, password: string) => {
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

    const genres = parseGenres(data.user.top_music_genres);

    const fullUser: UserType = {
      ...data.user,
      displayName: data.user.displayName ?? data.user.display_name ?? '',
      top_music_genres: genres,
      profile_picture: profileData.profile_picture_url,
      trial_ends_at: data.user.trial_ends_at || null,
    };

    setUser(fullUser);
    console.log("setUser payload:", fullUser);
  };

  const refetchUser = useCallback(async () => {
    try {
      const userData = await fetchUserWithExtras();
      if (userData) {
        setUser(userData);
        console.log("✅ refetchUser payload:", userData);
      }
    } catch (err) {
      console.error("Error in refetchUser:", err);
    }
  }, [fetchUserWithExtras]);

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
    <AuthContext.Provider
      value={{ user, login, logout, updateUser, refetchUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
