import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

const sizeMap: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  icon: 'w-10 h-10 p-0',
};

const variantMap: Record<Variant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
  danger: 'btn-danger',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, block, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          variantMap[variant],
          sizeMap[size],
          block && 'w-full',
          loading && 'opacity-80',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
