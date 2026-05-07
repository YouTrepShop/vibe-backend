import { useEffect } from 'react';
import { AppRoutes } from '@/routes/AppRoutes';
import { useAuthStore } from '@/stores/authStore';
import { Toaster } from '@/components/ui/Toaster';
import { CallOverlay } from '@/components/calls/CallOverlay';
import { useUiStore } from '@/stores/uiStore';

export function App() {
  const restore = useAuthStore((s) => s.restore);
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    restore();
  }, [restore]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  return (
    <>
      <AppRoutes />
      <Toaster />
      <CallOverlay />
    </>
  );
}
