import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { UserType } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const readJson = async <T,>(response: Response): Promise<T | null> => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return response.json().catch(() => null);
};

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

interface AuthContextType {
  user: UserType | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: UserType) => void;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const defaultContext: AuthContextType = {
  user: null,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
  loading: true,
  refreshSession: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserWithExtras = useCallback(async (): Promise<UserType | null> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await readJson<{ isLoggedIn?: boolean; user?: any }>(response);
    if (!data?.isLoggedIn || !data.user) return null;

    const profilePicRes = await fetch(`${API_BASE_URL}/api/auth/profile-picture`, {
      credentials: 'include',
      cache: 'no-store',
    });

    const profilePicData = profilePicRes.ok
      ? await readJson<{ profile_picture_url?: string | null }>(profilePicRes)
      : null;

    return {
      ...data.user,
      displayName: data.user.displayName ?? data.user.display_name ?? '',
      display_name: data.user.display_name ?? data.user.displayName ?? '',
      top_music_genres: parseGenres(data.user.top_music_genres),
      profile_picture: profilePicData?.profile_picture_url || null,
      trial_ends_at: data.user.trial_ends_at || null,
      trial_active: data.user.trial_active || null,
      pro_active: data.user.pro_active ?? false,
      pro_cancelled_at: data.user.pro_cancelled_at ?? null,
    };
  }, []);


  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await fetchUserWithExtras();
        if (userData) {
          const payload = userData;
          setUser(payload);
        } else {
          setUser(null);
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

    const data = await readJson<{ message?: string; user?: any }>(response);

    if (!response.ok) {
      throw new Error(data?.message || `Login failed with status ${response.status}`);
    }

    if (!data?.user) {
      throw new Error('Login response did not include a user.');
    }

    const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile-picture`, {
      credentials: 'include',
      cache: 'no-store',
    });

    const profileData = profileRes.ok
      ? await readJson<{ profile_picture_url?: string | null }>(profileRes)
      : null;

    const genres = parseGenres(data.user.top_music_genres);

    const fullUser: UserType = {
      ...data.user,
      displayName: data.user.displayName ?? data.user.display_name ?? '',
      display_name: data.user.display_name ?? data.user.displayName ?? '',
      top_music_genres: genres,
      profile_picture: profileData?.profile_picture_url || null,
      trial_ends_at: data.user.trial_ends_at || null,
      pro_active: data.user.pro_active ?? false,
      pro_cancelled_at: data.user.pro_cancelled_at ?? null,
    };

    const payload = fullUser;
    setUser(payload);

    // Ensure the session is reloaded from the server (e.g., right after Stripe upgrade flows)
    const refreshed = await fetchUserWithExtras();
    if (refreshed) {
      setUser(refreshed);
    }
  };

  const refreshSession = useCallback(async () => {
    try {
      const userData = await fetchUserWithExtras();
      if (userData) {
        const payload = userData;
        setUser(payload);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error in refreshSession:', err);
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
      value={{ user, login, logout, updateUser, refreshSession, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
