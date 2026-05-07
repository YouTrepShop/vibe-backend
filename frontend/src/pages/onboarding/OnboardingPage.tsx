import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Camera, Heart, Music, Users, Bell } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const steps = [
  {
    icon: Heart,
    title: 'Добро пожаловать в Vibe',
    desc: 'Делитесь моментами, общайтесь и вдохновляйте',
    accent: 'from-primary-500 to-accent-pink',
  },
  {
    icon: Camera,
    title: 'Создавайте посты и истории',
    desc: 'Фото, видео, рилсы — вертикально, красиво, плавно',
    accent: 'from-accent-cyan to-primary-400',
  },
  {
    icon: Music,
    title: 'Звонки и сообщения',
    desc: 'HD-аудио, видео и групповые чаты в один тап',
    accent: 'from-accent-emerald to-primary-300',
  },
  {
    icon: Users,
    title: 'Расскажите о себе',
    desc: 'Заполните профиль — это поможет другим вас найти',
    accent: 'from-primary-400 to-accent-amber',
    isProfile: true,
  },
  {
    icon: Bell,
    title: 'Уведомления',
    desc: 'Включите push, чтобы ничего не пропустить',
    accent: 'from-primary-500 to-primary-300',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const nav = useNavigate();
  const me = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [bio, setBio] = useState(me?.bio || '');
  const [fullName, setFullName] = useState(me?.fullName || '');
  const isLast = step === steps.length - 1;
  const current = steps[step]!;

  async function next() {
    if (current.isProfile) {
      try {
        const r = await api.patch('/users/me', { fullName, bio });
        if (accessToken) setAuth(r.data.data, accessToken);
      } catch {
        /* ignore */
      }
    }
    if (isLast) {
      if ('Notification' in window && Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch { /* ignore */ }
      }
      nav('/');
    } else setStep(step + 1);
  }

  return (
    <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom relative overflow-hidden">
      <motion.div
        className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      <div className="flex items-center gap-2 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${i <= step ? 'bg-vibe-gradient flex-1' : 'bg-white/10 w-6'}`}
          />
        ))}
      </div>

      <div className="flex-1 grid place-items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.25 }}
            className="text-center max-w-md"
          >
            <div className={`mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br ${current.accent} grid place-items-center text-white shadow-glow mb-6`}>
              <current.icon size={42} />
            </div>
            <h2 className="text-3xl font-bold mb-3">{current.title}</h2>
            <p className="text-text-muted text-base">{current.desc}</p>

            {current.isProfile && (
              <div className="mt-6 space-y-3 text-left">
                <Input label="Имя" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ваше имя" />
                <Input label="О себе" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Несколько слов" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3 mt-6">
        <button onClick={() => nav('/')} className="text-text-muted text-sm hover:text-text">Пропустить</button>
        <Button onClick={next} className="gap-2">
          {isLast ? 'Готово' : 'Далее'} <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
}
