import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Music, Video } from 'lucide-react';

export default function WelcomePage() {
  const navigate = useNavigate();

  const features = [
    { icon: Sparkles, title: 'Истории', desc: 'Делитесь моментами' },
    { icon: Video, title: 'Рилсы', desc: 'Вертикальные видео' },
    { icon: Music, title: 'Чаты', desc: 'Быстрые сообщения' },
    { icon: Zap, title: 'Звонки', desc: 'HD-аудио и видео' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 safe-bottom safe-top relative overflow-hidden">
      <motion.div
        className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-primary-500/30 blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-accent-pink/20 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      <div className="w-full max-w-md mx-auto pt-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-vibe-gradient grid place-items-center text-white text-4xl font-black shadow-glow mb-6 animate-floaty">
            V
          </div>
          <h1 className="text-5xl font-black gradient-text">Vibe</h1>
          <p className="text-text-muted mt-3 text-center">Социальная сеть нового поколения</p>
        </motion.div>

        <div className="mt-12 grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="card-glass p-4"
            >
              <f.icon className="text-primary-300 mb-2" size={22} />
              <div className="font-semibold text-sm">{f.title}</div>
              <div className="text-xs text-text-muted">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md mx-auto space-y-3 relative z-10"
      >
        <button onClick={() => navigate('/auth/register')} className="btn-primary w-full justify-center text-base py-4">
          Создать аккаунт
        </button>
        <Link to="/auth/login" className="btn-ghost w-full justify-center py-4">
          Войти
        </Link>
        <p className="text-xs text-text-dim text-center mt-4">
          Продолжая, вы соглашаетесь с{' '}
          <a href="#" className="underline">правилами</a> и{' '}
          <a href="#" className="underline">политикой конфиденциальности</a>.
        </p>
      </motion.div>
    </div>
  );
}
