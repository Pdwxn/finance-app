import { create } from 'zustand';
import { apiPost } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  loadFromStorage: () => {
    const token = localStorage.getItem('jwt');
    const userRaw = localStorage.getItem('user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as User;
        set({ user, token });
      } catch {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiPost<{ user: User; accessToken: string; refreshToken: string }>(
        '/api/auth/login',
        { email, password }
      );
      if (!res.success || !res.data) {
        set({ isLoading: false, error: res.message ?? 'Error al iniciar sesión' });
        return;
      }
      const { user, accessToken } = res.data;
      localStorage.setItem('jwt', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token: accessToken, isLoading: false, error: null });
    } catch {
      set({ isLoading: false, error: 'Error de conexión' });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiPost<{ user: User; accessToken: string; refreshToken: string }>(
        '/api/auth/register',
        { name, email, password }
      );
      if (!res.success || !res.data) {
        set({ isLoading: false, error: res.message ?? 'Error al registrarse' });
        return;
      }
      const { user, accessToken } = res.data;
      localStorage.setItem('jwt', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token: accessToken, isLoading: false, error: null });
    } catch {
      set({ isLoading: false, error: 'Error de conexión' });
    }
  },

  logout: () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    set({ user: null, token: null, error: null });
  },
}));
