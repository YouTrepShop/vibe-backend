import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const toast = useUiStore((s) => s.toast);
  const [showPwd, setShowPwd] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [needTotp, setNeedTotp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier.trim(), password, needTotp ? totp : undefined);
      toast({ type: 'success', title: 'Добро пожаловать!' });
      navigate('/');
    } catch (e: any) {
      const code = e?.response?.data?.error?.code;
      if (code === 'TOTP_REQUIRED') {
        setNeedTotp(true);
      } else {
        setError(e?.response?.data?.error?.message || 'Ошибка входа');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 flex items-center justify-center safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md card-glass p-7 sm:p-8 shadow-glass"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-vibe-gradient grid place-items-center text-xl font-bold text-white">
            V
          </div>
          <div>
            <h1 className="text-2xl font-bold">С возвращением</h1>
            <p className="text-sm text-text-muted">Войдите в свой Vibe</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email или username"
            placeholder="vibe@vibe.app"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            leading={<Mail size={18} />}
            required
            autoComplete="username"
          />
          <Input
            label="Пароль"
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leading={<Lock size={18} />}
            trailing={
              <button type="button" onClick={() => setShowPwd((p) => !p)} className="text-text-muted">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            required
            autoComplete="current-password"
          />
          {needTotp && (
            <Input
              label="2FA код"
              placeholder="123456"
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              leading={<KeyRound size={18} />}
              inputMode="numeric"
              maxLength={8}
            />
          )}
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>
          )}
          <Button type="submit" loading={loading} block>
            Войти
          </Button>
        </form>

        <div className="flex items-center justify-between mt-4 text-sm">
          <Link to="/auth/forgot" className="text-primary-300 hover:text-primary-200">
            Забыли пароль?
          </Link>
          <Link to="/auth/register" className="text-text-muted hover:text-text">
            Создать аккаунт
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
