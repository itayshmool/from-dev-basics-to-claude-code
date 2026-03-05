import { apiFetch, setAccessToken } from './api';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
  email?: string | null;
  profileImage?: string | null;
}

interface AuthResponse {
  user: User;
  accessToken: string;
}

export async function login(username: string, password: string): Promise<User> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(data.error || 'Login failed');
  }

  const data: AuthResponse = await res.json();
  setAccessToken(data.accessToken);
  return data.user;
}

export async function register(username: string, password: string, displayName: string): Promise<User> {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, displayName }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(data.error || 'Registration failed');
  }

  const data: AuthResponse = await res.json();
  setAccessToken(data.accessToken);
  return data.user;
}

export async function refreshSession(): Promise<User | null> {
  const API_URL = import.meta.env.VITE_API_URL || '';
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;

    const data: AuthResponse = await res.json();
    setAccessToken(data.accessToken);
    return data.user;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  setAccessToken(null);
}

export async function impersonate(userId: string): Promise<{ user: User; accessToken: string }> {
  const res = await apiFetch(`/api/admin/impersonate/${userId}`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Impersonation failed' }));
    throw new Error(data.error || 'Impersonation failed');
  }
  return res.json();
}
