import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api, setToken, getToken } from '../lib/api';
import { Profile, UserRole } from '../types';

interface AuthContextValue {
  user: { id: string; email: string; role: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: UserRole;
  badge_number?: string;
  department?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setProfile(null);
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      setProfile(data);
      setUser({ id: data.id, email: data.email, role: data.role });
    } catch (err) {
      console.error('Error loading profile:', err);
      setToken(null);
      setProfile(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.signin(email, password);
      setToken(data.token);
      setProfile(data.user);
      setUser({ id: data.user.id, email: data.user.email, role: data.user.role });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign in failed' };
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      const result = await api.signup({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
        badge_number: data.badge_number,
        department: data.department,
      });
      setToken(result.token);
      setProfile(result.user);
      setUser({ id: result.user.id, email: result.user.email, role: result.user.role });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign up failed' };
    }
  };

  const signOut = async () => {
    setToken(null);
    setProfile(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
