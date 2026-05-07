import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export function TopBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .get('/notifications/unread-count')
      .then((r) => alive && setUnread(r.data.data.count))
      .catch(() => {});
    const t = setInterval(() => {
      api
        .get('/notifications/unread-count')
        .then((r) => alive && setUnread(r.data.data.count))
        .catch(() => {});
    }, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-2xl bg-bg/60 border-b border-border safe-top">
      <div className="px-4 h-14 flex items-center gap-3 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-vibe-gradient grid place-items-center font-bold text-white text-sm">V</div>
          <span className="text-lg font-bold gradient-text">Vibe</span>
        </div>
        <div className="flex-1 hidden md:flex items-center">
          <div className="text-sm text-text-muted flex items-center gap-1">
            {pathname === '/' ? (
              <>
                <Sparkles size={14} className="text-primary-300" /> Лента
              </>
            ) : null}
          </div>
        </div>
        <button
          onClick={() => navigate('/search')}
          className="p-2 rounded-lg hover:bg-white/5 text-text-muted"
          aria-label="Поиск"
        >
          <Search size={20} />
        </button>
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-white/5 text-text-muted"
          aria-label="Уведомления"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-vibe-gradient text-[10px] font-semibold grid place-items-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <button onClick={() => navigate(`/profile/${user?.username}`)} className="lg:hidden">
          <Avatar src={user?.avatarUrl} name={user?.fullName || user?.username} size={32} />
        </button>
      </div>
    </header>
  );
}
