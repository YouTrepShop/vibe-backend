import { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/services/api';
import type { Comment, Post } from '@/types';
import { PostCard } from '@/components/post/PostCard';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo } from '@/lib/format';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/posts/${id}`).then((r) => setPost(r.data.data));
    api.get(`/posts/${id}/comments`).then((r) => setComments(r.data.data.items));
  }, [id]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || !id) return;
    setPosting(true);
    try {
      const r = await api.post(`/posts/${id}/comments`, { content: text.trim() });
      setComments((prev) => [r.data.data, ...prev]);
      setText('');
    } finally {
      setPosting(false);
    }
  }

  if (!post) return <div className="py-10 text-center text-text-muted">Загружаем…</div>;

  return (
    <div className="py-4 space-y-4">
      <PostCard post={post} />
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Комментарии · {comments.length}</h3>
        <form onSubmit={send} className="flex items-center gap-2 mb-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишите комментарий…"
            className="input"
          />
          <Button type="submit" loading={posting} size="icon" aria-label="Отправить">
            <Send size={18} />
          </Button>
        </form>
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <Avatar src={c.user.avatarUrl} name={c.user.fullName || c.user.username} size={36} />
              <div className="flex-1 min-w-0">
                <div className="card p-3">
                  <div className="text-sm font-semibold">{c.user.username}</div>
                  <div className="text-sm whitespace-pre-wrap break-words">{c.content}</div>
                </div>
                <div className="text-xs text-text-dim mt-1">{timeAgo(c.createdAt)}</div>
              </div>
            </div>
          ))}
          {comments.length === 0 && <div className="text-center py-6 text-text-muted text-sm">Будьте первым, кто оставит комментарий</div>}
        </div>
      </div>
    </div>
  );
}
