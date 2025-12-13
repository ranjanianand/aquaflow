'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'neutral';
type StatusColor = 'blue' | 'green' | 'orange' | 'red';

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: TrendDirection;
  };
  status?: 'success' | 'warning' | 'danger';
  color?: StatusColor;
  onClick?: () => void;
}

const accentColors: Record<StatusColor, string> = {
  blue: 'bg-[var(--accent-blue)]',
  green: 'bg-[var(--success)]',
  orange: 'bg-[var(--warning)]',
  red: 'bg-[var(--danger)]',
};

const iconBgColors: Record<StatusColor, string> = {
  blue: 'bg-blue-50 text-[var(--accent-blue)]',
  green: 'bg-emerald-50 text-[var(--success)]',
  orange: 'bg-amber-50 text-[var(--warning)]',
  red: 'bg-red-50 text-[var(--danger)]',
};

const trendColors: Record<TrendDirection, string> = {
  up: 'text-[var(--success)]',
  down: 'text-[var(--danger)]',
  neutral: 'text-muted-foreground',
};

const TrendIcon: Record<TrendDirection, React.ComponentType<{ className?: string }>> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function StatusCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status,
  color = 'blue',
  onClick,
}: StatusCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-card rounded-lg border border-border overflow-hidden transition-all duration-150',
        onClick && 'cursor-pointer hover:border-border/80 hover:shadow-sm'
      )}
      onClick={onClick}
    >
      {/* Colored left accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', accentColors[color])} />

      <div className="p-5 pl-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-md', iconBgColors[color])}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
            </div>
            <p className="text-3xl font-semibold tracking-tight tabular-nums leading-none">{value}</p>
          </div>

          {/* Status pulse indicator */}
          {status && (
            <span
              className={cn(
                'relative flex h-2 w-2 rounded-full',
                status === 'success' && 'bg-[var(--success)]',
                status === 'warning' && 'bg-[var(--warning)]',
                status === 'danger' && 'bg-[var(--danger)]'
              )}
            >
              {status === 'danger' && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--danger)] opacity-75" />
              )}
            </span>
          )}
        </div>

        {(trend || subtitle) && (
          <div className="flex items-center gap-1.5 mt-3">
            {trend && (
              <>
                {(() => {
                  const TrendIconComponent = TrendIcon[trend.direction];
                  return <TrendIconComponent className={cn('h-3.5 w-3.5', trendColors[trend.direction])} />;
                })()}
                <span className={cn('text-xs font-medium', trendColors[trend.direction])}>
                  {trend.value}
                </span>
              </>
            )}
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
