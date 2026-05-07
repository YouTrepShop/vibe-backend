import { useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';
import type { Post, StoryGroup } from '@/types';
import { PostCard } from '@/components/post/PostCard';
import { PostSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Sparkles } from 'lucide-react';
import { StoriesBar } from '@/components/story/StoriesBar';

const tabs = [
  { id: 'for-you' as const, label: 'Для вас' },
  { id: 'following' as const, label: 'Подписки' },
  { id: 'explore' as const, label: 'Тренды' },
];

export default function FeedPage() {
  const [scope, setScope] = useState<'for-you' | 'following' | 'explore'>('for-you');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  async function load(reset = false) {
    if (loading) return;
    setLoading(true);
    try {
      const r = await api.get('/posts/feed', {
        params: { scope, limit: 12, cursor: reset ? undefined : cursor },
      });
      const data = r.data.data;
      setPosts((prev) => (reset ? data.items : [...prev, ...data.items]));
      setCursor(data.nextCursor);
      setDone(!data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setDone(false);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  useEffect(() => {
    api.get('/stories').then((r) => setStories(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!sentinel.current) return;
    const el = sentinel.current;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]!.isIntersecting && !loading && !done) load(false);
    });
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, loading, done]);

  return (
    <div className="py-4 space-y-4">
      <StoriesBar groups={stories} />

      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setScope(t.id)}
            className={`chip whitespace-nowrap text-sm ${scope === t.id ? 'chip-primary' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      {loading && Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}

      {!loading && posts.length === 0 && (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="Пока пусто"
          description="Подпишитесь на интересных людей, чтобы их посты появились здесь."
        />
      )}

      <div ref={sentinel} className="h-10" />
    </div>
  );
}
