import { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Share2, Music as MusicIcon, BadgeCheck } from 'lucide-react';
import { api } from '@/services/api';
import type { Reel } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { compactNumber } from '@/lib/format';
import { motion } from 'framer-motion';

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api.get('/reels/feed').then((r) => setReels(r.data.data.items));
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target.querySelector('video');
          if (!v) continue;
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            v.play().catch(() => {});
            const id = (e.target as HTMLElement).dataset.id;
            if (id) api.post(`/reels/${id}/view`).catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      { root, threshold: [0, 0.6, 1] },
    );
    root.querySelectorAll('[data-reel]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [reels]);

  return (
    <div ref={containerRef} className="-mx-4 h-[calc(100vh-3.5rem)] overflow-y-scroll snap-y snap-mandatory scrollbar-none">
      {reels.map((r) => (
        <ReelItem key={r.id} reel={r} />
      ))}
      {reels.length === 0 && (
        <div className="h-full grid place-items-center text-text-muted">Пока нет рилсов</div>
      )}
    </div>
  );
}

function ReelItem({ reel }: { reel: Reel }) {
  const [liked, setLiked] = useState(false);
  return (
    <div data-reel data-id={reel.id} className="snap-start relative h-full grid place-items-center bg-black">
      <video
        src={reel.videoUrl}
        loop
        playsInline
        muted
        poster={reel.thumbnail || undefined}
        className="max-h-full max-w-full"
      />

      <div className="absolute right-3 bottom-24 flex flex-col gap-4 items-center">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => {
            setLiked((v) => !v);
            api.post(`/reels/${reel.id}/like`).catch(() => {});
          }}
          className="flex flex-col items-center text-white"
        >
          <Heart size={28} fill={liked ? '#f472b6' : 'none'} stroke={liked ? '#f472b6' : 'currentColor'} />
          <span className="text-xs">{compactNumber(reel.likesCount + (liked ? 1 : 0))}</span>
        </motion.button>
        <button className="flex flex-col items-center text-white">
          <MessageCircle size={28} />
          <span className="text-xs">{compactNumber(reel.commentsCount)}</span>
        </button>
        <button className="flex flex-col items-center text-white">
          <Share2 size={26} />
          <span className="text-xs">Поделиться</span>
        </button>
      </div>

      <div className="absolute bottom-6 left-3 right-20 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Avatar src={reel.user.avatarUrl} name={reel.user.username} size={36} />
          <div className="font-semibold flex items-center gap-1">
            {reel.user.username}
            {reel.user.isVerified && <BadgeCheck size={14} className="text-primary-300" />}
          </div>
        </div>
        {reel.caption && <p className="text-sm opacity-90">{reel.caption}</p>}
        {reel.music && (
          <div className="flex items-center gap-1 text-xs mt-2 opacity-80">
            <MusicIcon size={12} /> {reel.music}
          </div>
        )}
      </div>
    </div>
  );
}
