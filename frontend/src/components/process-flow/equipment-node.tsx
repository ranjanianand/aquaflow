'use client';

import { memo, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import {
  Droplets,
  Filter,
  Cylinder,
  Wind,
  Layers,
  Circle,
  Gauge,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

export type EquipmentType = 'inlet' | 'screen' | 'tank' | 'pump' | 'filter' | 'chemical' | 'sensor' | 'outlet' | 'valve';
export type EquipmentStatus = 'running' | 'idle' | 'warning' | 'offline' | 'alarm';
export type ValveState = 'open' | 'closed' | 'partial';

export interface EquipmentMetric {
  label: string;
  value: string;
  unit: string;
  trend?: number[]; // Last 8 data points for sparkline
  status?: 'normal' | 'warning' | 'critical';
}

export interface EquipmentNodeData {
  label: string;
  type: EquipmentType;
  status: EquipmentStatus;
  metrics?: EquipmentMetric[];
  description?: string;
  valveState?: ValveState; // For valve type
  hasActiveAlarm?: boolean; // Flash when alarm active
  alarmMessage?: string;
  lastUpdated?: string;
  [key: string]: unknown;
}

// Valve icon SVG component
const ValveIcon: React.FC<{ className?: string; state?: ValveState }> = ({ className, state = 'open' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    {state === 'closed' ? (
      <>
        <path d="M12 3v4M12 17v4" />
        <rect x="6" y="7" width="12" height="10" rx="1" fill="currentColor" fillOpacity="0.3" />
        <line x1="6" y1="12" x2="18" y2="12" strokeWidth="3" />
      </>
    ) : state === 'partial' ? (
      <>
        <path d="M12 3v4M12 17v4" />
        <rect x="6" y="7" width="12" height="10" rx="1" fill="currentColor" fillOpacity="0.1" />
        <path d="M6 9l12 6M6 15l12-6" strokeWidth="1.5" />
      </>
    ) : (
      <>
        <path d="M12 3v4M12 17v4" />
        <rect x="6" y="7" width="12" height="10" rx="1" fill="currentColor" fillOpacity="0.1" />
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
      </>
    )}
  </svg>
);

const EquipmentIcon: React.FC<{ type: EquipmentType; className?: string; valveState?: ValveState }> = ({
  type,
  className,
  valveState
}) => {
  switch (type) {
    case 'inlet':
      return <Droplets className={className} />;
    case 'screen':
      return <Filter className={className} />;
    case 'tank':
      return <Cylinder className={className} />;
    case 'pump':
      return <Wind className={className} />;
    case 'filter':
      return <Layers className={className} />;
    case 'chemical':
      return <Circle className={className} />;
    case 'sensor':
      return <Gauge className={className} />;
    case 'outlet':
      return <ArrowRight className={className} />;
    case 'valve':
      return <ValveIcon className={className} state={valveState} />;
    default:
      return <Circle className={className} />;
  }
};

// Mini sparkline component
const Sparkline: React.FC<{ data: number[]; status?: 'normal' | 'warning' | 'critical' }> = ({ data, status = 'normal' }) => {
  const normalized = useMemo(() => {
    if (!data || data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data.map(v => ((v - min) / range) * 100);
  }, [data]);

  const color = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981';

  if (normalized.length === 0) return null;

  return (
    <svg viewBox="0 0 40 16" className="w-10 h-4">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={normalized.map((y, i) => `${(i / (normalized.length - 1)) * 40},${16 - (y / 100) * 14}`).join(' ')}
      />
    </svg>
  );
};

const statusStyles: Record<EquipmentStatus, { bg: string; border: string; icon: string; pulse: string }> = {
  running: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-500',
    icon: 'bg-emerald-500 text-white',
    pulse: 'bg-emerald-500',
  },
  idle: {
    bg: 'bg-gray-50 dark:bg-gray-900/30',
    border: 'border-gray-400',
    icon: 'bg-gray-400 text-white',
    pulse: 'bg-gray-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-500',
    icon: 'bg-amber-500 text-white',
    pulse: 'bg-amber-500',
  },
  offline: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-500',
    icon: 'bg-rose-500 text-white',
    pulse: 'bg-rose-500',
  },
  alarm: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-600',
    icon: 'bg-rose-600 text-white',
    pulse: 'bg-rose-600',
  },
};

function EquipmentNodeComponent({ data, selected }: { data: EquipmentNodeData; selected?: boolean }) {
  const styles = statusStyles[data.status];
  const isAlarm = data.status === 'alarm' || data.hasActiveAlarm;
  const isValve = data.type === 'valve';

  return (
    <div
      className={cn(
        'relative px-4 py-3 rounded-xl border-2 shadow-sm transition-all duration-200 min-w-[140px]',
        styles.bg,
        styles.border,
        selected && 'ring-2 ring-blue-500 ring-offset-2',
        // Alarm flashing animation
        isAlarm && 'animate-alarm-flash'
      )}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Status indicator / Alarm badge */}
      {isAlarm ? (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[8px] font-bold animate-pulse">
          <AlertTriangle className="h-2.5 w-2.5" />
          ALARM
        </div>
      ) : (data.status === 'running' || data.status === 'warning') && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', styles.pulse)} />
            <span className={cn('relative inline-flex rounded-full h-3 w-3', styles.pulse)} />
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg transition-all',
          styles.icon,
          isAlarm && 'animate-pulse'
        )}>
          <EquipmentIcon type={data.type} className="h-5 w-5" valveState={data.valveState} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-foreground truncate">{data.label}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-muted-foreground capitalize">{data.type}</p>
            {/* Valve state indicator */}
            {isValve && data.valveState && (
              <span className={cn(
                'text-[8px] font-bold px-1 py-0.5 rounded uppercase',
                data.valveState === 'open' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' :
                data.valveState === 'closed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400' :
                'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
              )}>
                {data.valveState}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alarm message */}
      {isAlarm && data.alarmMessage && (
        <div className="mt-2 px-2 py-1 bg-rose-100 dark:bg-rose-900/50 rounded text-[9px] text-rose-700 dark:text-rose-300 font-medium truncate">
          {data.alarmMessage}
        </div>
      )}

      {/* Metrics with sparklines */}
      {data.metrics && data.metrics.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="flex gap-3">
            {data.metrics.slice(0, 2).map((metric, idx) => (
              <div key={idx} className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={cn(
                    'text-[11px] font-semibold tabular-nums',
                    metric.status === 'critical' && 'text-rose-600 dark:text-rose-400',
                    metric.status === 'warning' && 'text-amber-600 dark:text-amber-400'
                  )}>
                    {metric.value}
                    <span className="text-[9px] text-muted-foreground ml-0.5">{metric.unit}</span>
                  </p>
                  {metric.trend && <Sparkline data={metric.trend} status={metric.status} />}
                </div>
                <p className="text-[8px] text-muted-foreground truncate">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last updated timestamp */}
      {data.lastUpdated && (
        <p className="mt-1.5 text-[8px] text-muted-foreground/70 text-right">
          Updated {data.lastUpdated}
        </p>
      )}
    </div>
  );
}

export const EquipmentNode = memo(EquipmentNodeComponent);
