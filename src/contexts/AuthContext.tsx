import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { User } from '../services/authService';
import * as authService from '../services/authService';
import { setAccessToken, getAccessToken } from '../services/api';
import { pullProgress } from '../services/progressSync';

const USE_API = import.meta.env.VITE_USE_API === 'true';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  impersonating: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  startImpersonation: (userId: string) => Promise<void>;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(USE_API);
  const [impersonating, setImpersonating] = useState<User | null>(null);
  const savedAdminSession = useRef<{ token: string; user: User } | null>(null);

  // Try to restore session on mount
  useEffect(() => {
    if (!USE_API) return;

    authService.refreshSession().then(async (u) => {
      if (u) {
        setUser(u);
        await pullProgress();
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await authService.login(username, password);
    setUser(u);
    await pullProgress();
  }, []);

  const register = useCallback(async (username: string, password: string, displayName: string) => {
    const u = await authService.register(username, password, displayName);
    setUser(u);
    await pullProgress();
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const startImpersonation = useCallback(async (userId: string) => {
    const currentToken = getAccessToken();
    if (!currentToken || !user) throw new Error('Must be logged in');

    savedAdminSession.current = { token: currentToken, user };

    const data = await authService.impersonate(userId);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setImpersonating(data.user);
    await pullProgress();
  }, [user]);

  const stopImpersonation = useCallback(() => {
    const saved = savedAdminSession.current;
    if (!saved) return;

    setAccessToken(saved.token);
    setUser(saved.user);
    setImpersonating(null);
    savedAdminSession.current = null;
    pullProgress();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, impersonating, login, register, logout, updateUser, startImpersonation, stopImpersonation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
