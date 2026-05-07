import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { LoaderScreen } from '@/components/ui/LoaderScreen';

const WelcomePage = lazy(() => import('@/pages/auth/WelcomePage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPage = lazy(() => import('@/pages/auth/ForgotPage'));
const ResetPage = lazy(() => import('@/pages/auth/ResetPage'));
const VerifyPage = lazy(() => import('@/pages/auth/VerifyPage'));
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'));

const FeedPage = lazy(() => import('@/pages/feed/FeedPage'));
const ExplorePage = lazy(() => import('@/pages/explore/ExplorePage'));
const ReelsPage = lazy(() => import('@/pages/reels/ReelsPage'));
const ChatListPage = lazy(() => import('@/pages/chat/ChatListPage'));
const ChatRoomPage = lazy(() => import('@/pages/chat/ChatRoomPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const PostDetailPage = lazy(() => import('@/pages/feed/PostDetailPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));
const SearchPage = lazy(() => import('@/pages/explore/SearchPage'));

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const location = useLocation();
  if (!ready) return <LoaderScreen />;
  if (!user) return <Navigate to="/welcome" state={{ from: location }} replace />;
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  if (!ready) return <LoaderScreen />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  const location = useLocation();
  useEffect(() => {
    // Reset scroll on route change
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <Suspense fallback={<LoaderScreen />}>
      <Routes>
        <Route
          path="/welcome"
          element={
            <RedirectIfAuth>
              <PageTransition>
                <WelcomePage />
              </PageTransition>
            </RedirectIfAuth>
          }
        />
        <Route
          path="/auth/login"
          element={
            <RedirectIfAuth>
              <PageTransition>
                <LoginPage />
              </PageTransition>
            </RedirectIfAuth>
          }
        />
        <Route
          path="/auth/register"
          element={
            <RedirectIfAuth>
              <PageTransition>
                <RegisterPage />
              </PageTransition>
            </RedirectIfAuth>
          }
        />
        <Route path="/auth/forgot" element={<PageTransition><ForgotPage /></PageTransition>} />
        <Route path="/auth/reset" element={<PageTransition><ResetPage /></PageTransition>} />
        <Route path="/auth/verify" element={<PageTransition><VerifyPage /></PageTransition>} />
        <Route path="/onboarding" element={<RequireAuth><PageTransition><OnboardingPage /></PageTransition></RequireAuth>} />

        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<PageTransition><FeedPage /></PageTransition>} />
          <Route path="post/:id" element={<PageTransition><PostDetailPage /></PageTransition>} />
          <Route path="explore" element={<PageTransition><ExplorePage /></PageTransition>} />
          <Route path="search" element={<PageTransition><SearchPage /></PageTransition>} />
          <Route path="reels" element={<PageTransition><ReelsPage /></PageTransition>} />
          <Route path="chats" element={<PageTransition><ChatListPage /></PageTransition>} />
          <Route path="chats/:id" element={<PageTransition><ChatRoomPage /></PageTransition>} />
          <Route path="profile/:username" element={<PageTransition><ProfilePage /></PageTransition>} />
          <Route path="settings" element={<PageTransition><SettingsPage /></PageTransition>} />
          <Route path="notifications" element={<PageTransition><NotificationsPage /></PageTransition>} />
          <Route path="admin" element={<PageTransition><AdminPage /></PageTransition>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
