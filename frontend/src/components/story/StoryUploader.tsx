import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { ImagePlus } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';

export function StoryUploader({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useUiStore((s) => s.toast);

  function pick(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (caption) fd.append('caption', caption);
      await api.post('/stories', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ type: 'success', title: 'История опубликована' });
      onClose();
    } catch (e: any) {
      toast({ type: 'error', title: 'Ошибка', description: e?.response?.data?.error?.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Новая история">
      {preview ? (
        <div className="space-y-3">
          {file?.type.startsWith('video') ? (
            <video src={preview} controls className="w-full rounded-xl bg-black" />
          ) : (
            <img src={preview} alt="" className="w-full rounded-xl" />
          )}
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Подпись (необязательно)"
            className="input"
          />
          <Button block onClick={submit} loading={loading}>Опубликовать</Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 py-12 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-white/5">
          <ImagePlus size={32} className="text-primary-300" />
          <div className="text-text-muted">Выбрать фото или видео</div>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
        </label>
      )}
    </Modal>
  );
}
