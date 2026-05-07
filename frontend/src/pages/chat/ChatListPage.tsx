import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MessageSquare } from 'lucide-react';
import { api } from '@/services/api';
import type { Chat } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { chatTimestamp } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ChatListPage() {
  const me = useAuthStore((s) => s.user);
  const [chats, setChats] = useState<Chat[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/chats').then((r) => setChats(r.data.data));
  }, []);

  const filtered = chats.filter((c) => {
    if (!q) return true;
    const peer = c.members.find((m) => m.user.id !== me?.id)?.user;
    return (peer?.fullName || peer?.username || c.title || '').toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Сообщения</h1>
        <Link to="/search" className="btn-ghost">
          <Plus size={16} /> Новый
        </Link>
      </div>
      <label className="card flex items-center gap-2 px-3 py-2">
        <Search size={16} className="text-text-muted" />
        <input className="bg-transparent outline-none flex-1 py-1" placeholder="Поиск чатов" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      {filtered.length === 0 ? (
        <EmptyState icon={<MessageSquare size={28} />} title="Нет чатов" description="Найдите кого-то и напишите первое сообщение." />
      ) : (
        <div className="space-y-1">
          {filtered.map((c) => {
            const peer = c.members.find((m) => m.user.id !== me?.id)?.user;
            const name = c.title || peer?.fullName || peer?.username || 'Чат';
            return (
              <Link
                key={c.id}
                to={`/chats/${c.id}`}
                className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition"
              >
                <Avatar src={peer?.avatarUrl} name={name} size={48} ring={c.type === 'GROUP'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold truncate">{name}</div>
                    {c.lastMessageAt && <div className="text-xs text-text-dim">{chatTimestamp(c.lastMessageAt)}</div>}
                  </div>
                  <div className="text-sm text-text-muted truncate">
                    {c.lastMessage?.content || (c.lastMessage?.mediaUrl ? '📎 Вложение' : 'Нет сообщений')}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
