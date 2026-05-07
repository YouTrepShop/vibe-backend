import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, BadgeCheck, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Link, useNavigate } from 'react-router-dom';
import type { Post } from '@/types';
import { compactNumber, timeAgo } from '@/lib/format';
import { api } from '@/services/api';
import { cn } from '@/lib/cn';

export function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(!!post.liked);
  const [saved, setSaved] = useState(!!post.saved);
  const [likes, setLikes] = useState(post.likesCount);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const navigate = useNavigate();

  async function toggleLike() {
    setLiked((v) => !v);
    setLikes((n) => n + (liked ? -1 : 1));
    try {
      if (liked) await api.post(`/posts/${post.id}/unlike`);
      else await api.post(`/posts/${post.id}/like`);
    } catch {
      setLiked(liked);
      setLikes(post.likesCount);
    }
  }

  async function toggleSave() {
    setSaved((v) => !v);
    try {
      if (saved) await api.post(`/posts/${post.id}/unsave`);
      else await api.post(`/posts/${post.id}/save`);
    } catch {
      setSaved(saved);
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card overflow-hidden"
    >
      <header className="flex items-center gap-3 p-3">
        <Link to={`/profile/${post.user.username}`}>
          <Avatar src={post.user.avatarUrl} name={post.user.fullName || post.user.username} size={42} ring />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.user.username}`} className="font-semibold flex items-center gap-1 hover:underline">
            <span className="truncate">{post.user.username}</span>
            {post.user.isVerified && <BadgeCheck size={14} className="text-primary-300" />}
          </Link>
          <div className="text-xs text-text-muted">{timeAgo(post.createdAt)}</div>
        </div>
        <button className="p-2 rounded-lg hover:bg-white/5 text-text-muted">
          <MoreHorizontal size={18} />
        </button>
      </header>

      {post.media && post.media.length > 0 && (
        <div className="relative bg-black">
          {post.media[carouselIdx]!.type === 'VIDEO' ? (
            <video
              src={post.media[carouselIdx]!.url}
              poster={post.media[carouselIdx]!.thumbnail || undefined}
              controls
              playsInline
              className="w-full max-h-[640px] object-contain"
            />
          ) : (
            <button onClick={() => navigate(`/post/${post.id}`)} className="block w-full">
              <img
                src={post.media[carouselIdx]!.url}
                alt=""
                className="w-full max-h-[640px] object-cover"
                loading="lazy"
              />
            </button>
          )}
          {post.media.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.media.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIdx(i)}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    i === carouselIdx ? 'bg-white' : 'bg-white/40',
                  )}
                />
              ))}
            </div>
          )}
          {post.media[carouselIdx]!.type === 'VIDEO' && (
            <div className="absolute top-3 right-3 bg-black/50 rounded-full p-1.5">
              <Play size={14} className="text-white" />
            </div>
          )}
        </div>
      )}

      {post.content && (
        <div className="px-4 pt-3 text-sm whitespace-pre-wrap break-words">
          <Link to={`/profile/${post.user.username}`} className="font-semibold mr-2">
            {post.user.username}
          </Link>
          <span className="text-text">{linkify(post.content)}</span>
        </div>
      )}

      <div className="flex items-center gap-1 px-2 py-2">
        <ActionBtn active={liked} onClick={toggleLike} icon={<Heart size={22} fill={liked ? '#f472b6' : 'none'} stroke={liked ? '#f472b6' : 'currentColor'} />} count={likes} />
        <ActionBtn onClick={() => navigate(`/post/${post.id}`)} icon={<MessageCircle size={22} />} count={post.commentsCount} />
        <ActionBtn onClick={() => navigator.share?.({ url: `${location.origin}/post/${post.id}` })} icon={<Share2 size={20} />} />
        <div className="ml-auto">
          <ActionBtn active={saved} onClick={toggleSave} icon={<Bookmark size={20} fill={saved ? '#a78bfa' : 'none'} stroke={saved ? '#a78bfa' : 'currentColor'} />} />
        </div>
      </div>
    </motion.article>
  );
}

function ActionBtn({ icon, count, active, onClick }: { icon: React.ReactNode; count?: number; active?: boolean; onClick?: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} className={cn('flex items-center gap-1 p-2 rounded-lg hover:bg-white/5', active ? 'text-primary-200' : 'text-text-muted')}>
      {icon}
      {count !== undefined && count > 0 && <span className="text-sm">{compactNumber(count)}</span>}
    </motion.button>
  );
}

function linkify(text: string) {
  return text.split(/(\s+)/).map((word, i) => {
    if (word.startsWith('#')) {
      return (
        <Link key={i} to={`/search?q=${encodeURIComponent(word)}&type=hashtags`} className="text-primary-300 hover:underline">
          {word}
        </Link>
      );
    }
    if (word.startsWith('@')) {
      return (
        <Link key={i} to={`/profile/${word.slice(1)}`} className="text-primary-300 hover:underline">
          {word}
        </Link>
      );
    }
    return word;
  });
}
