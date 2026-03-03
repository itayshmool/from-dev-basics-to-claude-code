const API_URL = import.meta.env.VITE_API_URL || '';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // send cookies for refresh token
  });

  // If 401 and we have a token, try to refresh
  if (res.status === 401 && accessToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set('Authorization', `Bearer ${accessToken}`);
      return fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  return res;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      accessToken = null;
      return false;
    }
    const data = await res.json();
    accessToken = data.accessToken;
    return true;
  } catch {
    accessToken = null;
    return false;
  }
}
