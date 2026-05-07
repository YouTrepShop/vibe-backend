import { NavLink } from 'react-router-dom';
import { Home, Compass, Film, MessageCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useState } from 'react';
import { CreatePostModal } from '@/components/post/CreatePostModal';
import { motion } from 'framer-motion';

const items = [
  { to: '/', icon: Home, label: 'Дом' },
  { to: '/explore', icon: Compass, label: 'Поиск' },
  { to: '#create', icon: Plus, label: '', isCreate: true },
  { to: '/reels', icon: Film, label: 'Рилсы' },
  { to: '/chats', icon: MessageCircle, label: 'Чаты' },
];

export function BottomNav() {
  const [creating, setCreating] = useState(false);
  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 safe-bottom">
        <div className="card-glass flex items-center justify-around p-1.5 mx-auto max-w-md shadow-glass">
          {items.map((it) =>
            it.isCreate ? (
              <button
                key="create"
                onClick={() => setCreating(true)}
                className="relative -mt-7 grid place-items-center w-14 h-14 rounded-2xl bg-vibe-gradient shadow-glow text-white active:scale-95 transition"
              >
                <motion.div whileTap={{ scale: 0.9, rotate: 90 }}>
                  <Plus size={26} />
                </motion.div>
              </button>
            ) : (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-4 py-2 text-xs rounded-xl transition-all',
                    isActive ? 'text-primary-200' : 'text-text-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <motion.span animate={{ scale: isActive ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 380, damping: 20 }}>
                      <it.icon size={22} />
                    </motion.span>
                    <span className="text-[10px]">{it.label}</span>
                  </>
                )}
              </NavLink>
            ),
          )}
        </div>
      </nav>
      <CreatePostModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
