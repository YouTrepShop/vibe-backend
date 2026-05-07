import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Compass, Film, MessageCircle, Bell, User, Settings, LogOut, Shield, Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { CreatePostModal } from '@/components/post/CreatePostModal';

const items = [
  { to: '/', icon: Home, label: 'Лента' },
  { to: '/explore', icon: Compass, label: 'Поиск' },
  { to: '/reels', icon: Film, label: 'Рилсы' },
  { to: '/chats', icon: MessageCircle, label: 'Сообщения' },
  { to: '/notifications', icon: Bell, label: 'Уведомления' },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <aside className="hidden lg:flex sticky top-0 h-screen w-72 border-r border-border bg-bg-soft/40 backdrop-blur-2xl flex-col p-5">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-vibe-gradient grid place-items-center font-bold text-white">V</div>
          <div className="text-2xl font-bold gradient-text">Vibe</div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 group',
                  isActive ? 'bg-primary-500/15 text-primary-100' : 'text-text-muted hover:bg-white/5 hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <motion.span whileTap={{ scale: 0.9 }}>
                    <it.icon size={22} className={isActive ? 'text-primary-300' : ''} />
                  </motion.span>
                  <span className="font-medium">{it.label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setCreating(true)}
            className="btn-primary mt-3 justify-start gap-3 px-3 py-3"
          >
            <Plus size={20} /> Создать
          </button>

          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 mt-2',
                  isActive ? 'bg-amber-500/15 text-amber-200' : 'text-text-muted hover:bg-white/5',
                )
              }
            >
              <Shield size={22} /> Админ
            </NavLink>
          )}
        </nav>

        <div className="mt-4 card p-3 flex items-center gap-3">
          <Avatar src={user?.avatarUrl} name={user?.fullName || user?.username} size={40} ring />
          <button onClick={() => navigate(`/profile/${user?.username}`)} className="flex-1 text-left min-w-0">
            <div className="font-semibold truncate">{user?.fullName || user?.username}</div>
            <div className="text-xs text-text-muted truncate">@{user?.username}</div>
          </button>
          <button onClick={() => navigate('/settings')} className="p-2 hover:bg-white/5 rounded-lg" title="Настройки">
            <Settings size={18} />
          </button>
          <button onClick={() => logout()} className="p-2 hover:bg-white/5 rounded-lg" title="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <CreatePostModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
