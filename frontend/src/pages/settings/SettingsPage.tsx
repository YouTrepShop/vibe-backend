import { useEffect, useState } from 'react';
import { Bell, Globe, Lock, Moon, Shield, Sun, Sparkles, KeyRound, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { api } from '@/services/api';

export default function SettingsPage() {
  const me = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme, language, setLanguage, toast } = useUiStore();
  const [twofa, setTwofa] = useState<{ open: boolean; otpauth?: string; secret?: string }>({ open: false });
  const [code, setCode] = useState('');

  async function start2fa() {
    const r = await api.post('/auth/2fa/start', { label: 'Vibe' });
    setTwofa({ open: true, otpauth: r.data.data.otpauth, secret: r.data.data.base32 });
  }

  async function confirm2fa() {
    try {
      await api.post('/auth/2fa/enable', { token: code });
      toast({ type: 'success', title: '2FA включён' });
      setTwofa({ open: false });
      setCode('');
    } catch (e: any) {
      toast({ type: 'error', title: 'Неверный код' });
    }
  }

  async function disable2fa() {
    await api.post('/auth/2fa/disable');
    toast({ type: 'success', title: '2FA отключён' });
  }

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-2xl font-bold px-1">Настройки</h1>

      <Section title="Тема">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'dark' as const, label: 'Тёмная', icon: Moon },
            { id: 'light' as const, label: 'Светлая', icon: Sun },
            { id: 'system' as const, label: 'Системная', icon: Sparkles },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`card p-3 flex flex-col items-center gap-1 transition ${theme === t.id ? 'ring-2 ring-primary-400' : ''}`}
            >
              <t.icon size={18} />
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Язык" icon={<Globe size={16} />}>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input">
          <option value="ru">Русский</option>
          <option value="en">English</option>
          <option value="uk">Українська</option>
        </select>
      </Section>

      <Section title="Безопасность" icon={<Shield size={16} />}>
        {me?.totpEnabled ? (
          <Button variant="ghost" onClick={disable2fa}>
            <KeyRound size={16} /> Отключить 2FA
          </Button>
        ) : (
          <Button variant="primary" onClick={start2fa}>
            <KeyRound size={16} /> Включить 2FA
          </Button>
        )}
      </Section>

      <Section title="Уведомления" icon={<Bell size={16} />}>
        <div className="text-text-muted text-sm">
          Push-уведомления управляются на уровне устройства/браузера.
        </div>
      </Section>

      <Section title="Приватность" icon={<Lock size={16} />}>
        <div className="text-text-muted text-sm">Настройки приватности в редактировании профиля.</div>
      </Section>

      <Button variant="danger" onClick={() => logout()} block>
        <LogOut size={16} /> Выйти
      </Button>

      <Modal open={twofa.open} onClose={() => setTwofa({ open: false })} title="Включить 2FA">
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            Отсканируйте QR в Google Authenticator / Authy или добавьте секрет вручную:
          </p>
          {twofa.secret && <div className="card p-3 text-xs break-all font-mono">{twofa.secret}</div>}
          {twofa.otpauth && (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twofa.otpauth)}`}
              alt="QR"
              className="mx-auto rounded-xl"
            />
          )}
          <Input label="Код из приложения" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button block onClick={confirm2fa}>Подтвердить</Button>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm text-text-muted">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}
