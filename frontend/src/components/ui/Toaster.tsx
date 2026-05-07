import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '@/stores/uiStore';
import { CheckCircle2, X, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 px-4 w-full max-w-md">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'card-glass flex items-start gap-3 p-3 pr-2 shadow-glass',
              t.type === 'success' && 'border-emerald-400/30',
              t.type === 'error' && 'border-red-400/40',
            )}
          >
            <div className="mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="text-emerald-400" size={18} />}
              {t.type === 'info' && <Info className="text-primary-300" size={18} />}
              {t.type === 'error' && <AlertCircle className="text-red-400" size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{t.title}</div>
              {t.description && <div className="text-xs text-text-muted mt-0.5">{t.description}</div>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-text-muted hover:text-text p-1">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
