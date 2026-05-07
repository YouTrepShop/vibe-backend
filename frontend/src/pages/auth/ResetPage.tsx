import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

export default function ResetPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const nav = useNavigate();
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await api.post('/auth/reset', { token, password: pwd });
      nav('/auth/login');
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glass p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Новый пароль</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Пароль"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            required
            minLength={8}
            leading={<Lock size={18} />}
          />
          {err && <div className="text-sm text-red-400">{err}</div>}
          <Button block loading={loading} type="submit">Сохранить</Button>
          <p className="text-sm text-center">
            <Link to="/auth/login" className="text-primary-300">Назад ко входу</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
