import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, Info, Clock, Circle } from 'lucide-react';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'progress';
type StatusSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  size?: StatusSize;
  pulse?: boolean;
  showIcon?: boolean;
  className?: string;
}

// Vercel-style badges: subtle background, darker text
const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
  progress: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800',
  default: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
};

const sizeStyles: Record<StatusSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-[11px] px-2 py-0.5',
  lg: 'text-xs px-2.5 py-1',
};

const iconSizeStyles: Record<StatusSize, string> = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
};

// Accessibility: Icons alongside colors for colorblind users
const variantIcons: Record<StatusVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  progress: Clock,
  default: Circle,
};

export function StatusBadge({
  variant,
  children,
  size = 'md',
  pulse = false,
  showIcon = false,
  className,
}: StatusBadgeProps) {
  const Icon = variantIcons[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium border',
        variantStyles[variant],
        sizeStyles[size],
        pulse && 'animate-status-pulse',
        className
      )}
      role="status"
      aria-label={`Status: ${variant}`}
    >
      {showIcon && <Icon className={iconSizeStyles[size]} aria-hidden="true" />}
      {children}
    </span>
  );
}

interface StatusDotProps {
  status: 'online' | 'warning' | 'offline' | 'normal' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  showLabel?: boolean;
  className?: string;
}

const dotSizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

const statusLabels: Record<string, string> = {
  online: 'Online',
  normal: 'Normal',
  warning: 'Warning',
  offline: 'Offline',
  critical: 'Critical',
};

export function StatusDot({ status, size = 'md', pulse = false, showLabel = false, className }: StatusDotProps) {
  const colorMap: Record<string, string> = {
    online: 'bg-[var(--success)]',
    normal: 'bg-[var(--success)]',
    warning: 'bg-[var(--warning)]',
    offline: 'bg-[var(--danger)]',
    critical: 'bg-[var(--danger)]',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="status"
      aria-label={statusLabels[status]}
    >
      <span
        className={cn(
          'rounded-full flex-shrink-0',
          colorMap[status],
          dotSizeStyles[size],
          pulse && (status === 'critical' || status === 'offline') && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-[10px] font-medium text-muted-foreground">
          {statusLabels[status]}
        </span>
      )}
    </span>
  );
}

// Accessible status indicator with icon and text
interface StatusIndicatorProps {
  status: 'online' | 'warning' | 'offline' | 'normal' | 'critical' | 'healthy' | 'attention';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const indicatorConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  online: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Online' },
  normal: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Normal' },
  healthy: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Healthy' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', label: 'Warning' },
  attention: { icon: AlertTriangle, color: 'text-amber-500', label: 'Attention' },
  offline: { icon: XCircle, color: 'text-rose-500', label: 'Offline' },
  critical: { icon: XCircle, color: 'text-rose-500', label: 'Critical' },
};

const indicatorSizeStyles: Record<'sm' | 'md' | 'lg', { icon: string; text: string }> = {
  sm: { icon: 'h-3 w-3', text: 'text-[10px]' },
  md: { icon: 'h-3.5 w-3.5', text: 'text-[11px]' },
  lg: { icon: 'h-4 w-4', text: 'text-xs' },
};

export function StatusIndicator({ status, size = 'md', showLabel = true, className }: StatusIndicatorProps) {
  const config = indicatorConfig[status];
  const Icon = config.icon;
  const sizeConfig = indicatorSizeStyles[size];

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      role="status"
      aria-label={config.label}
    >
      <Icon className={cn(sizeConfig.icon, config.color)} aria-hidden="true" />
      {showLabel && (
        <span className={cn(sizeConfig.text, 'font-medium', config.color)}>
          {config.label}
        </span>
      )}
    </span>
  );
}
