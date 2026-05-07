import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-xl bg-white/5', className)} />;
}

export function PostSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}
