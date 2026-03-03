import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../services/authService';
import * as authService from '../services/authService';
import { pullProgress } from '../services/progressSync';

const USE_API = import.meta.env.VITE_USE_API === 'true';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(USE_API);

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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
