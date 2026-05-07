import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Shield, Users, FileText, MessageSquare, Phone, AlertTriangle } from 'lucide-react';

interface Stats {
  users: number;
  posts: number;
  chats: number;
  calls: number;
  reportsOpen: number;
  online: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  async function load() {
    const [s, u, r] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/users'),
      api.get('/admin/reports'),
    ]);
    setStats(s.data.data);
    setUsers(u.data.data);
    setReports(r.data.data);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="py-4 space-y-5">
      <h1 className="text-2xl font-bold flex items-center gap-2 px-1"><Shield size={20} /> Админ-панель</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Пользователи" value={stats.users} icon={<Users size={18} />} />
          <Stat label="Посты" value={stats.posts} icon={<FileText size={18} />} />
          <Stat label="Чаты" value={stats.chats} icon={<MessageSquare size={18} />} />
          <Stat label="Звонки" value={stats.calls} icon={<Phone size={18} />} />
          <Stat label="Жалобы" value={stats.reportsOpen} icon={<AlertTriangle size={18} />} />
          <Stat label="Онлайн" value={stats.online} icon={<Users size={18} />} />
        </div>
      )}

      <section className="card p-4">
        <h2 className="font-semibold mb-3">Пользователи</h2>
        <div className="space-y-2">
          {users.slice(0, 30).map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
              <Avatar src={u.avatarUrl} name={u.fullName || u.username} size={36} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{u.fullName || u.username}</div>
                <div className="text-xs text-text-muted">@{u.username} · {u.email}</div>
              </div>
              <span className="chip">{u.role}</span>
              <span className={`chip ${u.status === 'ACTIVE' ? '' : 'border-amber-400/40 text-amber-300'}`}>{u.status}</span>
              {u.status === 'ACTIVE' ? (
                <Button size="sm" variant="ghost" onClick={() => api.post(`/admin/users/${u.id}/suspend`).then(load)}>Бан</Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => api.post(`/admin/users/${u.id}/restore`).then(load)}>Восстановить</Button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold mb-3">Жалобы</h2>
        {reports.length === 0 ? (
          <div className="text-text-muted text-sm">Нет открытых жалоб</div>
        ) : (
          <div className="space-y-2">
            {reports.map((r: any) => (
              <div key={r.id} className="card p-3">
                <div className="text-sm">
                  <span className="font-semibold">{r.reporter?.username}</span>
                  <span className="text-text-muted"> на </span>
                  <span className="font-semibold">{r.subject?.username || r.subjectType}</span>
                </div>
                <div className="text-xs text-text-muted mt-1">{r.reason}</div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => api.post(`/admin/reports/${r.id}/resolve`).then(load)}>
                    Закрыть
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between text-text-muted text-xs">
        {label}
        {icon}
      </div>
      <div className="text-2xl font-bold mt-1">{value.toLocaleString('ru-RU')}</div>
    </div>
  );
}
