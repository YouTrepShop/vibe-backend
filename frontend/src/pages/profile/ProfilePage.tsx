import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, BadgeCheck, MessageCircle, Settings as SettingsIcon, Lock, UserPlus, UserCheck, Pencil } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import type { Post, User } from '@/types';
import { compactNumber } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import { EditProfileModal } from '@/components/profile/EditProfileModal';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function fetchData() {
    if (!username) return;
    const r = await api.get(`/users/by-username/${username}`);
    setUser(r.data.data);
    const p = await api.get(`/posts/user/${r.data.data.id}`);
    setPosts(p.data.data);
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function follow() {
    if (!user) return;
    setBusy(true);
    try {
      if (user.isFollowing || user.isRequested) await api.delete(`/follows/${user.id}`);
      else await api.post(`/follows/${user.id}`);
      await fetchData();
    } finally {
      setBusy(false);
    }
  }

  async function startChat() {
    if (!user) return;
    const r = await api.post('/chats/direct', { userId: user.id });
    navigate(`/chats/${r.data.data.id}`);
  }

  if (!user) return <div className="py-10 text-center text-text-muted">Загружаем…</div>;
  const isMe = user.id === me?.id;

  return (
    <div className="pb-8">
      <div className="relative h-44 sm:h-56 rounded-b-3xl overflow-hidden bg-gradient-to-br from-primary-700 via-primary-500 to-accent-pink/60">
        {user.coverUrl && <img src={user.coverUrl} alt="" className="w-full h-full object-cover" />}
        {isMe && (
          <label className="absolute bottom-3 right-3 btn-ghost cursor-pointer text-xs">
            <Camera size={16} /> Обложка
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadCover(e.target.files?.[0])} />
          </label>
        )}
      </div>

      <div className="px-4 -mt-12 relative">
        <div className="flex items-end gap-4">
          <div className="relative">
            <Avatar src={user.avatarUrl} name={user.fullName || user.username} size={96} className="ring-4 ring-bg" />
            {isMe && (
              <label className="absolute bottom-0 right-0 w-8 h-8 grid place-items-center bg-primary-500 rounded-full cursor-pointer">
                <Camera size={14} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadAvatar(e.target.files?.[0])} />
              </label>
            )}
          </div>
          <div className="flex-1 mb-2 flex gap-2 justify-end">
            {isMe ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil size={14} /> Изменить
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                  <SettingsIcon size={16} />
                </Button>
              </>
            ) : (
              <>
                <Button onClick={follow} loading={busy} variant={user.isFollowing ? 'ghost' : 'primary'} size="sm">
                  {user.isFollowing ? <><UserCheck size={14} /> Подписан</> : user.isRequested ? 'Запрошено' : <><UserPlus size={14} /> Подписаться</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={startChat}>
                  <MessageCircle size={14} /> Сообщение
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-3">
          <h1 className="text-xl font-bold flex items-center gap-1">
            {user.fullName || user.username}
            {user.isVerified && <BadgeCheck size={18} className="text-primary-300" />}
            {user.isPrivate && <Lock size={14} className="text-text-muted ml-1" />}
          </h1>
          <div className="text-text-muted text-sm">@{user.username}</div>
          {user.bio && <p className="mt-2 text-sm whitespace-pre-wrap">{user.bio}</p>}
          {user.socialLinks && user.socialLinks.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {user.socialLinks.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noreferrer noopener" className="chip text-primary-200">
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 card p-4">
          <Stat n={user.postsCount} label="Постов" />
          <Stat n={user.followersCount} label="Подписчиков" />
          <Stat n={user.followingCount} label="Подписок" />
        </div>
      </div>

      <div className="px-2 mt-6">
        <h2 className="px-2 text-sm text-text-muted mb-2">Посты</h2>
        {posts.length === 0 ? (
          <div className="text-center py-12 text-text-muted">Постов пока нет</div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-1">
            {posts.map((p) => {
              const m = p.media[0];
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/post/${p.id}`)}
                  className="aspect-square overflow-hidden rounded-md bg-bg-soft"
                >
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
          </motion.div>
        )}
      </div>

      {editing && <EditProfileModal user={user} onClose={() => { setEditing(false); fetchData(); }} />}
    </div>
  );

  async function uploadAvatar(file?: File) {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    await fetchData();
  }
  async function uploadCover(file?: File) {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.post('/users/me/cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    await fetchData();
  }
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold">{compactNumber(n)}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}
