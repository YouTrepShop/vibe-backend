import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '@/services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import type { Hashtag, Post, User } from '@/types';
import { Input } from '@/components/ui/Input';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [tab, setTab] = useState<'all' | 'users' | 'posts' | 'hashtags'>(
    (params.get('type') as any) || 'all',
  );
  const [data, setData] = useState<{ users: User[]; posts: Post[]; hashtags: Hashtag[] }>({
    users: [],
    posts: [],
    hashtags: [],
  });

  useEffect(() => {
    if (!q.trim()) {
      setData({ users: [], posts: [], hashtags: [] });
      return;
    }
    const t = setTimeout(() => {
      api.get('/search', { params: { q, type: tab } }).then((r) => setData(r.data.data));
      setParams({ q, type: tab });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tab]);

  return (
    <div className="py-4 space-y-3">
      <Input
        leading={<Search size={18} />}
        trailing={q ? <button onClick={() => setQ('')}><X size={16} /></button> : null}
        placeholder="Поиск…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {['all', 'users', 'posts', 'hashtags'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`chip ${tab === t ? 'chip-primary' : ''}`}
          >
            {t === 'all' ? 'Всё' : t === 'users' ? 'Люди' : t === 'posts' ? 'Посты' : 'Теги'}
          </button>
        ))}
      </div>

      {(tab === 'all' || tab === 'users') && data.users.length > 0 && (
        <section>
          <h2 className="text-sm text-text-muted mb-2">Люди</h2>
          <div className="space-y-2">
            {data.users.map((u) => (
              <Link key={u.id} to={`/profile/${u.username}`} className="card p-3 flex items-center gap-3">
                <Avatar src={u.avatarUrl} name={u.fullName || u.username} size={42} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.fullName || u.username}</div>
                  <div className="text-xs text-text-muted">@{u.username}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(tab === 'all' || tab === 'hashtags') && data.hashtags.length > 0 && (
        <section>
          <h2 className="text-sm text-text-muted mb-2">Теги</h2>
          <div className="flex gap-2 flex-wrap">
            {data.hashtags.map((h) => (
              <span key={h.tag} className="chip-primary">#{h.tag}</span>
            ))}
          </div>
        </section>
      )}

      {(tab === 'all' || tab === 'posts') && data.posts.length > 0 && (
        <section>
          <h2 className="text-sm text-text-muted mb-2">Посты</h2>
          <div className="grid grid-cols-3 gap-1">
            {data.posts.map((p) => {
              const m = p.media[0];
              return (
                <Link key={p.id} to={`/post/${p.id}`} className="aspect-square overflow-hidden rounded-md bg-bg-soft">
                  {m ? <img src={m.url} alt="" className="w-full h-full object-cover" /> : <div className="p-2 text-xs">{p.content}</div>}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
