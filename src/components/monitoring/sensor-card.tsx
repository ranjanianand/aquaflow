'use client';

import { Card } from '@/components/ui/card';
import { Sensor } from '@/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SensorCardProps {
  sensor: Sensor;
  onClick?: () => void;
}

// Mild status colors - consistent with dashboard
const statusColors = {
  normal: {
    border: 'border-t-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-400/60',
  },
  warning: {
    border: 'border-t-amber-400',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400/60',
  },
  critical: {
    border: 'border-t-rose-400',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
    dot: 'bg-rose-400',
    bar: 'bg-rose-400/60',
  },
};

const statusLabel: Record<Sensor['status'], string> = {
  normal: 'Normal',
  warning: 'Warning',
  critical: 'Critical',
};

export function SensorCard({ sensor, onClick }: SensorCardProps) {
  const colors = statusColors[sensor.status];

  // Calculate percentage within range
  const range = sensor.maxThreshold - sensor.minThreshold;
  const percentage = ((sensor.currentValue - sensor.minThreshold) / range) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Generate sparkline data from history
  const sparklineData = sensor.history.slice(-12).map((h) => {
    const normalized = ((h.value - sensor.minThreshold) / range) * 100;
    return Math.max(5, Math.min(100, normalized));
  });

  // Calculate trend from last 2 readings
  const lastTwo = sensor.history.slice(-2);
  const trend = lastTwo.length === 2
    ? lastTwo[1].value > lastTwo[0].value ? 'up'
    : lastTwo[1].value < lastTwo[0].value ? 'down'
    : 'stable'
    : 'stable';

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md',
        'border-t-[3px]',
        colors.border
      )}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {sensor.name}
          </span>
          <span className={cn(
            'px-2 py-0.5 rounded text-[10px] font-medium',
            colors.badge
          )}>
            {statusLabel[sensor.status]}
          </span>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-[28px] font-bold tracking-tight leading-none tabular-nums">
            {sensor.currentValue.toFixed(sensor.type === 'pH' ? 1 : sensor.type === 'flow' ? 0 : 1)}
          </span>
          <span className="text-sm text-muted-foreground font-medium">{sensor.unit}</span>
          <div className="ml-auto">
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-muted-foreground" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-muted-foreground" />}
            {trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Range text */}
        <p className="text-[10px] text-muted-foreground mb-3">
          Range: {sensor.minThreshold} - {sensor.maxThreshold} {sensor.unit}
        </p>

        {/* Progress bar showing position in range */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>

        {/* Sparkline */}
        <div className="flex items-end gap-[2px] h-8">
          {sparklineData.map((height, index) => (
            <div
              key={index}
              className={cn(
                'flex-1 rounded-sm transition-all duration-300',
                index === sparklineData.length - 1 ? colors.bar : 'bg-muted-foreground/20'
              )}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Time indicator */}
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-muted-foreground">12h ago</span>
          <span className="text-[9px] text-muted-foreground">Now</span>
        </div>
      </div>
    </Card>
  );
}
