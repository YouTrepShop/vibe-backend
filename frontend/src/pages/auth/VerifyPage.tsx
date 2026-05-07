import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function VerifyPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending');
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    const t = params.get('token');
    if (!t) {
      setState('error');
      setMsg('Нет токена');
      return;
    }
    api
      .post('/auth/verify-email', { token: t })
      .then(() => setState('ok'))
      .catch((e) => {
        setState('error');
        setMsg(e?.response?.data?.error?.message || 'Не удалось подтвердить');
      });
  }, [params]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glass p-8 w-full max-w-md text-center">
        {state === 'pending' && <div className="text-text-muted">Подтверждаем email…</div>}
        {state === 'ok' && (
          <>
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
            <h1 className="text-xl font-bold">Email подтверждён!</h1>
            <Link to="/auth/login" className="btn-primary mt-6 inline-flex">Войти</Link>
          </>
        )}
        {state === 'error' && (
          <>
            <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
            <h1 className="text-xl font-bold">{msg}</h1>
            <Link to="/auth/login" className="btn-ghost mt-6 inline-flex">Назад</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
