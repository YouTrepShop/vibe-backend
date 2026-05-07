import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leading, trailing, className, ...props }, ref) => {
    return (
      <label className="block w-full">
        {label && <span className="label">{label}</span>}
        <div className="relative">
          {leading && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{leading}</span>}
          <input
            ref={ref}
            className={cn(
              'input',
              leading && 'pl-10',
              trailing && 'pr-10',
              error && 'border-red-500/60 focus:ring-red-500/20',
              className,
            )}
            {...props}
          />
          {trailing && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">{trailing}</span>}
        </div>
        {(hint || error) && (
          <span className={cn('text-xs mt-1.5 block', error ? 'text-red-400' : 'text-text-dim')}>{error || hint}</span>
        )}
      </label>
    );
  },
);
Input.displayName = 'Input';
