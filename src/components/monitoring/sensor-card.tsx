'use client';

import { Sensor } from '@/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SensorCardProps {
  sensor: Sensor;
  onClick?: () => void;
}

const statusLabel: Record<Sensor['status'], string> = {
  normal: 'OK',
  warning: 'WARN',
  critical: 'CRIT',
};

const commStatusIcon: Record<Sensor['commStatus'], { icon: typeof Wifi; color: string; label: string }> = {
  online: { icon: Wifi, color: 'text-emerald-500', label: 'Online' },
  stale: { icon: AlertTriangle, color: 'text-amber-500', label: 'Stale' },
  offline: { icon: WifiOff, color: 'text-red-500', label: 'Offline' },
};

export function SensorCard({ sensor, onClick }: SensorCardProps) {
  // Calculate percentage within range
  const range = sensor.maxThreshold - sensor.minThreshold;
  const percentage = ((sensor.currentValue - sensor.minThreshold) / range) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Calculate setpoint position if available
  const setpointPercentage = sensor.setpoint
    ? ((sensor.setpoint - sensor.minThreshold) / range) * 100
    : null;

  // Calculate deviation from setpoint
  const deviation = sensor.setpoint
    ? sensor.currentValue - sensor.setpoint
    : null;

  // Generate sparkline data from history
  const sparklineData = sensor.history.slice(-12).map((h) => {
    const normalized = ((h.value - sensor.minThreshold) / range) * 100;
    return Math.max(5, Math.min(100, normalized));
  });

  // Calculate threshold positions for sparkline
  const minThresholdLine = 10; // 10% from bottom for visual warning zone
  const maxThresholdLine = 90; // 90% from bottom for visual warning zone

  // Calculate trend from last 2 readings
  const lastTwo = sensor.history.slice(-2);
  const trend = lastTwo.length === 2
    ? lastTwo[1].value > lastTwo[0].value ? 'up'
    : lastTwo[1].value < lastTwo[0].value ? 'down'
    : 'stable'
    : 'stable';

  // Calculate rate of change
  const rateOfChange = lastTwo.length === 2
    ? lastTwo[1].value - lastTwo[0].value
    : 0;

  // Format last updated time
  const lastUpdatedText = formatDistanceToNow(sensor.lastUpdated, { addSuffix: true });

  // Get comm status info
  const commInfo = commStatusIcon[sensor.commStatus];
  const CommIcon = commInfo.icon;

  return (
    <div
      className={cn(
        'relative overflow-hidden transition-all cursor-pointer bg-white border-2',
        'hover:shadow-md hover:border-slate-400',
        sensor.status === 'normal' && 'border-slate-300 border-l-[3px] border-l-emerald-500',
        sensor.status === 'warning' && 'border-amber-300 border-l-[3px] border-l-amber-500',
        sensor.status === 'critical' && 'border-red-300 border-l-[3px] border-l-red-500',
        sensor.commStatus === 'offline' && 'opacity-60'
      )}
      onClick={onClick}
    >
      {/* Communication status indicator */}
      {sensor.commStatus !== 'online' && (
        <div className={cn(
          'absolute top-0 right-0 px-1.5 py-0.5 text-[8px] font-bold uppercase flex items-center gap-1',
          sensor.commStatus === 'stale' && 'bg-amber-100 text-amber-700',
          sensor.commStatus === 'offline' && 'bg-red-100 text-red-700'
        )}>
          <CommIcon className="h-2.5 w-2.5" />
          {commInfo.label}
        </div>
      )}

      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate pr-2">
            {sensor.name}
          </span>
          <span className={cn(
            'text-[9px] font-bold px-1.5 py-0.5 flex-shrink-0',
            sensor.status === 'normal' && 'bg-emerald-100 text-emerald-700',
            sensor.status === 'warning' && 'bg-amber-100 text-amber-700',
            sensor.status === 'critical' && 'bg-red-100 text-red-700'
          )}>
            {statusLabel[sensor.status]}
          </span>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className={cn(
            'text-2xl font-bold font-mono tracking-tight leading-none',
            sensor.status === 'normal' && 'text-slate-700',
            sensor.status === 'warning' && 'text-amber-600',
            sensor.status === 'critical' && 'text-red-600'
          )}>
            {sensor.currentValue.toFixed(sensor.type === 'pH' ? 1 : sensor.type === 'flow' ? 0 : 1)}
          </span>
          <span className="text-xs text-slate-500 font-medium">{sensor.unit}</span>
          <div className="ml-auto flex items-center gap-1">
            {trend === 'up' && <TrendingUp className={cn('h-3.5 w-3.5', rateOfChange > 0 ? 'text-amber-500' : 'text-slate-400')} />}
            {trend === 'down' && <TrendingDown className={cn('h-3.5 w-3.5', rateOfChange < 0 ? 'text-blue-500' : 'text-slate-400')} />}
            {trend === 'stable' && <Minus className="h-3.5 w-3.5 text-slate-400" />}
            {rateOfChange !== 0 && (
              <span className={cn(
                'text-[9px] font-mono',
                rateOfChange > 0 ? 'text-amber-600' : 'text-blue-600'
              )}>
                {rateOfChange > 0 ? '+' : ''}{rateOfChange.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Setpoint deviation */}
        {deviation !== null && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[9px] text-slate-400">SP: {sensor.setpoint} {sensor.unit}</span>
            <span className={cn(
              'text-[9px] font-mono font-bold',
              Math.abs(deviation) < range * 0.1 ? 'text-emerald-600' :
              Math.abs(deviation) < range * 0.2 ? 'text-amber-600' : 'text-red-600'
            )}>
              ({deviation > 0 ? '+' : ''}{deviation.toFixed(1)})
            </span>
          </div>
        )}

        {/* Range text */}
        <p className="text-[9px] text-slate-400 mb-2 font-mono">
          {sensor.minThreshold} - {sensor.maxThreshold} {sensor.unit}
        </p>

        {/* Progress bar showing position in range with setpoint marker */}
        <div className="relative h-1.5 bg-slate-200 overflow-hidden mb-2">
          <div
            className={cn(
              'h-full transition-all duration-500',
              sensor.status === 'normal' && 'bg-emerald-500',
              sensor.status === 'warning' && 'bg-amber-500',
              sensor.status === 'critical' && 'bg-red-500'
            )}
            style={{ width: `${clampedPercentage}%` }}
          />
          {/* Setpoint marker */}
          {setpointPercentage !== null && (
            <div
              className="absolute top-0 h-full w-0.5 bg-slate-700"
              style={{ left: `${setpointPercentage}%` }}
              title={`Setpoint: ${sensor.setpoint} ${sensor.unit}`}
            />
          )}
        </div>

        {/* Sparkline with threshold reference lines */}
        <div className="relative">
          {/* Threshold zone background */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="h-[10%] bg-red-50 opacity-50" /> {/* Upper danger zone */}
            <div className="flex-1" />
            <div className="h-[10%] bg-red-50 opacity-50" /> {/* Lower danger zone */}
          </div>

          {/* Sparkline bars */}
          <div className="relative flex items-end gap-[1px] h-6">
            {sparklineData.map((height, index) => (
              <div
                key={index}
                className={cn(
                  'flex-1 transition-all duration-300',
                  index === sparklineData.length - 1
                    ? sensor.status === 'normal' ? 'bg-emerald-400'
                      : sensor.status === 'warning' ? 'bg-amber-400'
                      : 'bg-red-400'
                    : height > maxThresholdLine || height < minThresholdLine
                      ? 'bg-red-300'
                      : 'bg-slate-300'
                )}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        {/* Time indicators and last updated */}
        <div className="flex justify-between items-center mt-1">
          <span className="text-[8px] text-slate-400 font-mono">-12h</span>
          <span className={cn(
            'text-[8px] font-mono',
            sensor.commStatus === 'online' ? 'text-slate-400' :
            sensor.commStatus === 'stale' ? 'text-amber-500' : 'text-red-500'
          )}>
            {lastUpdatedText}
          </span>
          <span className="text-[8px] text-slate-400 font-mono">now</span>
        </div>
      </div>
    </div>
  );
}
