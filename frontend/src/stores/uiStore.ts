import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light' | 'system';

export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'error';
  title: string;
  description?: string;
}

interface UiState {
  theme: Theme;
  language: string;
  toasts: ToastItem[];
  setTheme: (t: Theme) => void;
  setLanguage: (l: string) => void;
  toast: (t: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'ru',
      toasts: [],
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toast: (t) => {
        const id = Math.random().toString(36).slice(2, 9);
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
        }, 3500);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    { name: 'vibe-ui', partialize: (s) => ({ theme: s.theme, language: s.language }) },
  ),
);
