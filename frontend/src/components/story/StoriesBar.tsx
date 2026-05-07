import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { StoryGroup } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { StoryViewer } from './StoryViewer';
import { StoryUploader } from './StoryUploader';

export function StoriesBar({ groups }: { groups: StoryGroup[] }) {
  const me = useAuthStore((s) => s.user);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-1 px-1 py-2">
        <button onClick={() => setUploading(true)} className="flex flex-col items-center gap-1 min-w-[68px]">
          <div className="relative">
            <Avatar src={me?.avatarUrl} name={me?.fullName || me?.username} size={64} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-vibe-gradient grid place-items-center border-2 border-bg">
              <Plus size={14} className="text-white" />
            </div>
          </div>
          <span className="text-[11px] text-text-muted">Ваша</span>
        </button>
        {groups.map((g, i) => (
          <button key={g.user.id} onClick={() => setActiveIdx(i)} className="flex flex-col items-center gap-1 min-w-[68px]">
            <Avatar src={g.user.avatarUrl} name={g.user.fullName || g.user.username} size={64} ring />
            <span className="text-[11px] text-text-muted truncate max-w-[68px]">{g.user.username}</span>
          </button>
        ))}
      </div>
      {activeIdx !== null && (
        <StoryViewer groups={groups} startIdx={activeIdx} onClose={() => setActiveIdx(null)} />
      )}
      {uploading && <StoryUploader onClose={() => setUploading(false)} />}
    </>
  );
}
