import { cn } from '@/lib/cn';
import { pickInitials } from '@/lib/format';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  ring?: boolean;
  online?: boolean;
}

export function Avatar({ src, name, size = 40, className, ring, online }: AvatarProps) {
  const initials = pickInitials(name || '');
  return (
    <div className={cn('relative inline-block', className)} style={{ width: size, height: size }}>
      {ring && (
        <div className="absolute inset-0 rounded-full ring-grad animate-gradientMove p-[2px]">
          <div className="w-full h-full bg-bg rounded-full" />
        </div>
      )}
      <div
        className={cn(
          'relative rounded-full overflow-hidden grid place-items-center bg-gradient-to-br from-primary-700 to-primary-400 text-white font-semibold uppercase',
          ring ? 'inset-[3px] absolute' : '',
        )}
        style={ring ? undefined : { width: size, height: size, fontSize: size * 0.42 }}
      >
        {src ? (
          <img src={src} alt={name || ''} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span style={{ fontSize: size * 0.42 }}>{initials}</span>
        )}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-bg',
            online ? 'bg-emerald-400' : 'bg-text-dim',
          )}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
