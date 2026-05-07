import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Search, TrendingUp } from 'lucide-react';
import { api } from '@/services/api';
import { Avatar } from '@/components/ui/Avatar';
import type { Hashtag, Post, User } from '@/types';
import { compactNumber } from '@/lib/format';

export default function ExplorePage() {
  const [trending, setTrending] = useState<{ hashtags: Hashtag[]; users: User[] } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggested, setSuggested] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/search/trending').then((r) => setTrending(r.data.data));
    api.get('/posts/feed', { params: { scope: 'explore', limit: 21 } }).then((r) => setPosts(r.data.data.items));
    api.get('/search/suggested').then((r) => setSuggested(r.data.data));
  }, []);

  return (
    <div className="py-4 space-y-5">
      <button onClick={() => navigate('/search')} className="card flex items-center gap-3 p-3 w-full text-left text-text-muted">
        <Search size={18} /> Поиск пользователей, тегов и постов
      </button>

      <section>
        <h2 className="font-semibold mb-2 flex items-center gap-2"><TrendingUp size={16} /> Тренды</h2>
        <div className="flex gap-2 flex-wrap">
          {trending?.hashtags.map((h) => (
            <Link key={h.tag} to={`/search?q=${encodeURIComponent('#' + h.tag)}&type=hashtags`} className="chip-primary">
              #{h.tag}
              <span className="text-text-muted ml-1">{compactNumber(h.postsCount)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2 flex items-center gap-2"><Sparkles size={16} /> Рекомендуем подписаться</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-1 px-1">
          {suggested.map((u) => (
            <Link key={u.id} to={`/profile/${u.username}`} className="card p-3 min-w-[140px] flex flex-col items-center text-center">
              <Avatar src={u.avatarUrl} name={u.fullName || u.username} size={64} ring />
              <div className="mt-2 font-medium text-sm truncate w-full">{u.fullName || u.username}</div>
              <div className="text-text-muted text-xs">@{u.username}</div>
              <div className="text-text-muted text-xs mt-1">{compactNumber(u.followersCount)} подписчиков</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Популярное</h2>
        <div className="grid grid-cols-3 gap-1">
          {posts.map((p) => {
            const m = p.media[0];
            return (
              <button key={p.id} onClick={() => navigate(`/post/${p.id}`)} className="aspect-square overflow-hidden rounded-md bg-bg-soft">
                {m ? (
                  m.type === 'VIDEO' ? (
                    <video src={m.url} muted className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="text-xs p-2 text-left text-text-muted line-clamp-6 whitespace-pre-wrap">{p.content}</div>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
