import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, unwrap, API_URL } from '@/services/api';
import type { User } from '@/types';
import axios from 'axios';
import { disconnectSocket } from '@/services/socket';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  ready: boolean;
  setAuth: (user: User, token: string) => void;
  login: (identifier: string, password: string, totp?: string) => Promise<void>;
  register: (input: { email: string; username: string; password: string; fullName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
  fetchMe: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      ready: false,

      setAuth: (user, accessToken) => set({ user, accessToken, ready: true }),

      async login(identifier, password, totp) {
        const r = await api.post('/auth/login', { identifier, password, totp });
        const data = r.data.data;
        set({ user: data.user, accessToken: data.accessToken, ready: true });
      },

      async register(input) {
        const r = await api.post('/auth/register', input);
        const data = r.data.data;
        set({ user: data.user, accessToken: data.accessToken, ready: true });
      },

      async logout() {
        try {
          await api.post('/auth/logout');
        } catch {
          /* ignore */
        }
        disconnectSocket();
        set({ user: null, accessToken: null, ready: true });
      },

      async restore() {
        try {
          const r = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
          const data = r.data.data;
          set({ user: data.user, accessToken: data.accessToken, ready: true });
        } catch {
          set({ ready: true });
        }
      },

      async fetchMe() {
        try {
          const me = await unwrap<User>(api.get('/users/me') as any);
          set({ user: me });
          return me;
        } catch {
          return null;
        }
      },
    }),
    {
      name: 'vibe-auth',
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
