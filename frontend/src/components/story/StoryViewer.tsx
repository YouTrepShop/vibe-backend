import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StoryGroup } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { api } from '@/services/api';

interface Props {
  groups: StoryGroup[];
  startIdx: number;
  onClose: () => void;
}

export function StoryViewer({ groups, startIdx, onClose }: Props) {
  const [groupIdx, setGroupIdx] = useState(startIdx);
  const [itemIdx, setItemIdx] = useState(0);
  const group = groups[groupIdx];
  const story = group?.items[itemIdx];

  useEffect(() => {
    if (!story) return;
    api.post(`/stories/${story.id}/view`).catch(() => {});
    const timer = setTimeout(() => next(), 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  function next() {
    if (!group) return;
    if (itemIdx < group.items.length - 1) setItemIdx(itemIdx + 1);
    else if (groupIdx < groups.length - 1) {
      setGroupIdx(groupIdx + 1);
      setItemIdx(0);
    } else onClose();
  }

  function prev() {
    if (itemIdx > 0) setItemIdx(itemIdx - 1);
    else if (groupIdx > 0) {
      setGroupIdx(groupIdx - 1);
      setItemIdx(0);
    }
  }

  if (!group || !story) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black grid place-items-center"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 z-10 rounded-full hover:bg-white/10">
          <X size={22} />
        </button>
        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-3 z-10 hidden sm:block">
          <ChevronLeft size={28} />
        </button>
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-3 z-10 hidden sm:block">
          <ChevronRight size={28} />
        </button>

        <div className="relative w-full max-w-md mx-auto h-full">
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
            {group.items.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: '0%' }}
                  animate={{ width: i < itemIdx ? '100%' : i === itemIdx ? '100%' : '0%' }}
                  transition={{ duration: i === itemIdx ? 6 : 0, ease: 'linear' }}
                />
              </div>
            ))}
          </div>

          <div className="absolute top-6 left-3 right-3 flex items-center gap-3 z-10">
            <Avatar src={group.user.avatarUrl} name={group.user.username} size={36} />
            <div className="text-white text-sm">
              <div className="font-medium">{group.user.username}</div>
              <div className="text-white/60 text-xs">только что</div>
            </div>
          </div>

          <button className="w-full h-full grid place-items-center" onClick={(e) => {
            const target = e.currentTarget;
            const x = e.clientX - target.getBoundingClientRect().left;
            if (x < target.clientWidth / 2) prev();
            else next();
          }}>
            {story.mediaType === 'VIDEO' ? (
              <video src={story.mediaUrl} autoPlay muted playsInline className="max-h-full max-w-full" />
            ) : (
              <img src={story.mediaUrl} alt="" className="max-h-full max-w-full" />
            )}
          </button>

          {story.caption && (
            <div className="absolute bottom-8 left-3 right-3 text-white text-sm bg-black/40 backdrop-blur-md p-3 rounded-xl">{story.caption}</div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
