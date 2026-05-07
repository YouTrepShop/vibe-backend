import axios, { AxiosError, type AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = (async () => {
            const r = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
            const data: any = r.data?.data;
            useAuthStore.getState().setAuth(data.user, data.accessToken);
            return data.accessToken as string;
          })().finally(() => {
            refreshing = null;
          });
        }
        const newToken = await refreshing;
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api.request(original);
        }
      } catch (e) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);

// helper that unwraps `{ ok, data }` envelope
export async function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  const r = await promise;
  return r.data.data;
}
