import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AtSign, User, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const toast = useUiStore((s) => s.toast);
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim() || undefined,
      });
      toast({ type: 'success', title: 'Аккаунт создан', description: 'Добро пожаловать в Vibe!' });
      navigate('/onboarding');
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Ошибка регистрации');
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
          <div className="w-12 h-12 rounded-2xl bg-vibe-gradient grid place-items-center text-xl font-bold text-white">V</div>
          <div>
            <h1 className="text-2xl font-bold">Создайте аккаунт</h1>
            <p className="text-sm text-text-muted">Присоединяйтесь к Vibe</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Имя"
            placeholder="Александра Цветкова"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            leading={<User size={18} />}
            autoComplete="name"
          />
          <Input
            label="Username"
            placeholder="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s/g, '') })}
            leading={<AtSign size={18} />}
            required
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_]+"
            hint="3–24 символа: буквы, цифры, _"
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            leading={<Mail size={18} />}
            required
            autoComplete="email"
          />
          <Input
            label="Пароль"
            type={showPwd ? 'text' : 'password'}
            placeholder="Минимум 8 символов"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            leading={<Lock size={18} />}
            trailing={
              <button type="button" onClick={() => setShowPwd((p) => !p)} className="text-text-muted">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            required
            minLength={8}
            autoComplete="new-password"
          />
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>
          )}
          <Button type="submit" loading={loading} block>
            Создать аккаунт
          </Button>
          <p className="text-sm text-text-muted text-center">
            Уже есть аккаунт?{' '}
            <Link to="/auth/login" className="text-primary-300 hover:text-primary-200">
              Войти
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
