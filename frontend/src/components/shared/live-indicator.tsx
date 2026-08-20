import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  className?: string;
}

export function LiveIndicator({ className }: LiveIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full bg-[var(--success-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--success)]',
        className
      )}
    >
      <span className="h-2 w-2 rounded-full bg-[var(--success)] animate-live-pulse" />
      LIVE
    </div>
  );
}
