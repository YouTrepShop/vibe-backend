import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import type { User } from '@/types';
import { useAuthStore } from '@/stores/authStore';

export function EditProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [isPrivate, setIsPrivate] = useState(!!user.isPrivate);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);

  async function save() {
    setLoading(true);
    try {
      const r = await api.patch('/users/me', { fullName, bio, isPrivate });
      if (accessToken) setAuth(r.data.data, accessToken);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Редактировать профиль">
      <div className="space-y-3">
        <Input label="Имя" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <label>
          <span className="label">О себе</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={280}
            className="input resize-none"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer card p-3">
          <span className="text-sm">Приватный аккаунт</span>
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="w-5 h-5 accent-primary-500" />
        </label>
        <Button block onClick={save} loading={loading}>Сохранить</Button>
      </div>
    </Modal>
  );
}
