import { motion } from 'framer-motion';

export function LoaderScreen() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-vibe-radial">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full ring-grad animate-spin" />
          <div className="absolute inset-1.5 rounded-full bg-bg" />
          <div className="absolute inset-0 grid place-items-center text-2xl font-bold gradient-text">V</div>
        </div>
        <div className="text-text-muted text-sm">Vibe загружается…</div>
      </motion.div>
    </div>
  );
}
