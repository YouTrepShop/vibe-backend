import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot', { email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glass p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Сброс пароля</h1>
        <p className="text-text-muted text-sm mb-6">Мы отправим вам ссылку для восстановления.</p>
        {sent ? (
          <div className="text-center py-4">
            <div className="text-emerald-400 mb-2">Письмо отправлено!</div>
            <div className="text-sm text-text-muted">Проверьте почту {email}</div>
            <Link to="/auth/login" className="btn-ghost mt-6 inline-flex">
              Назад ко входу
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leading={<Mail size={18} />}
            />
            <Button type="submit" loading={loading} block>
              Отправить ссылку
            </Button>
            <p className="text-sm text-center">
              <Link to="/auth/login" className="text-primary-300">Назад ко входу</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
