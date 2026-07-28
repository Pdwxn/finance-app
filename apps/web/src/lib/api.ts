const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  const rt = localStorage.getItem('refreshToken');
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (!json.success || !json.data?.accessToken) return false;
    localStorage.setItem('jwt', json.data.accessToken);
    if (json.data.refreshToken) {
      localStorage.setItem('refreshToken', json.data.refreshToken);
    }
    return true;
  } catch {
    return false;
  }
}

function clearAuth() {
  localStorage.removeItem('jwt');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt');
}

async function fetchWithAuth<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    if (!refreshPromise) refreshPromise = attemptRefresh();
    const refreshed = await refreshPromise;
    refreshPromise = null;

    if (refreshed) {
      headers.Authorization = `Bearer ${getStoredToken()!}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } else {
      clearAuth();
      return { success: false, message: 'Sesión expirada' };
    }
  }

  if (res.status === 204) return { success: true } as ApiResponse<T>;
  return res.json() as Promise<ApiResponse<T>>;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(path, { method: 'DELETE' });
}
