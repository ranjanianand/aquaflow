'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { getOverallHealthScore, getCriticalEquipmentCount, getWarningEquipmentCount, getOverallProcessEfficiency } from '@/data/mock-operations';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function CircularProgress({ value, size = 120, strokeWidth = 8, className }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // Color based on health score
  const getColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  const getBgColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-100 dark:stroke-emerald-950';
    if (score >= 60) return 'stroke-amber-100 dark:stroke-amber-950';
    return 'stroke-rose-100 dark:stroke-rose-950';
  };

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={getBgColor(value)}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-500 ease-out', getColor(value))}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{value}</span>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Health</span>
      </div>
    </div>
  );
}

export function SystemHealthScore() {
  const healthScore = getOverallHealthScore();
  const criticalCount = getCriticalEquipmentCount();
  const warningCount = getWarningEquipmentCount();
  const processEfficiency = getOverallProcessEfficiency();

  // Calculate trend (mock - comparing to yesterday)
  const yesterdayScore = 71;
  const trend = healthScore - yesterdayScore;
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable';

  const getStatusLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 60) return { label: 'Good', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Needs Attention', color: 'text-rose-600 dark:text-rose-400' };
  };

  const status = getStatusLabel(healthScore);

  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Activity className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <h3 className="text-[13px] font-semibold">System Health Score</h3>
        </div>

        <div className="flex items-center gap-6">
          {/* Circular Progress */}
          <CircularProgress value={healthScore} />

          {/* Health Details */}
          <div className="flex-1 space-y-3">
            {/* Status Label */}
            <div>
              <p className={cn('text-sm font-semibold', status.color)}>{status.label}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {trendDirection === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : trendDirection === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                ) : null}
                <span className={cn(
                  'text-[11px] font-medium',
                  trendDirection === 'up' ? 'text-emerald-600' : trendDirection === 'down' ? 'text-rose-600' : 'text-muted-foreground'
                )}>
                  {trend > 0 ? '+' : ''}{trend} pts vs yesterday
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 rounded-md p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Critical</p>
                <p className={cn(
                  'text-lg font-semibold tabular-nums',
                  criticalCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                )}>
                  {criticalCount}
                </p>
              </div>
              <div className="bg-muted/50 rounded-md p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Warning</p>
                <p className={cn(
                  'text-lg font-semibold tabular-nums',
                  warningCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                )}>
                  {warningCount}
                </p>
              </div>
            </div>

            {/* Process Efficiency Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Process Efficiency</span>
                <span className="text-[11px] font-semibold tabular-nums">{processEfficiency}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    processEfficiency >= 90 ? 'bg-emerald-500' : processEfficiency >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                  )}
                  style={{ width: `${processEfficiency}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
