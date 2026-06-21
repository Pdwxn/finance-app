const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 204) return { success: true };

  return res.json() as Promise<ApiResponse<T>>;
}
