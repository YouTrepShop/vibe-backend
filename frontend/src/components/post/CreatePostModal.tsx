import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageIcon, X, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { useUiStore } from '@/stores/uiStore';

export function CreatePostModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const toast = useUiStore((s) => s.toast);

  function onSelect(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list).slice(0, 10);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  async function submit() {
    setSubmitting(true);
    try {
      let media: any[] = [];
      if (files.length) {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        const r = await api.post('/posts/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        media = r.data.data.media;
      }
      await api.post('/posts', { content, media });
      toast({ type: 'success', title: 'Опубликовано' });
      setContent('');
      setFiles([]);
      setPreviews([]);
      onClose();
    } catch (e: any) {
      toast({ type: 'error', title: 'Не удалось опубликовать', description: e?.response?.data?.error?.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Новый пост" maxWidth="540px">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Что нового? #vibe @username"
        rows={4}
        className="input resize-none"
        maxLength={2200}
      />
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-bg-soft">
              {files[i]?.type.startsWith('video') ? (
                <video src={src} className="w-full h-full object-cover" />
              ) : (
                <img src={src} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => {
                  const newFiles = files.filter((_, idx) => idx !== i);
                  setFiles(newFiles);
                  setPreviews(previews.filter((_, idx) => idx !== i));
                }}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-4">
        <label className="btn-ghost cursor-pointer">
          <ImageIcon size={18} />
          <span>Медиа</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => onSelect(e.target.files)}
          />
        </label>
        <Button onClick={submit} loading={submitting} disabled={!content.trim() && files.length === 0}>
          Опубликовать
        </Button>
      </div>
    </Modal>
  );
}
