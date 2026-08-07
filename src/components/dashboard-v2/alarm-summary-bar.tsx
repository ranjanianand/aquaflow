'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, Info, Bell, ChevronRight } from 'lucide-react';
import { useAlerts } from '@/lib/api/hooks';

/** Relative age of a reading. */
function ago(d: Date): string {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 90) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

interface AlarmCounts {
  critical: number;
  warning: number;
  info: number;
  unacknowledged: number;
}

export function AlarmSummaryBar() {
  const { data: alerts } = useAlerts();
  const list = alerts ?? [];

  const alarmCounts: AlarmCounts = {
    critical: list.filter((a) => a.severity === 'critical').length,
    warning: list.filter((a) => a.severity === 'warning').length,
    // No informational tier exists. Alarms are derived from threshold
    // breaches; an "info" alarm would come from an operator annotation, and
    // nothing writes those. The fixed 4 here claimed a category that has
    // never existed in this system.
    info: 0,
    // Every alarm is unacknowledged, because acknowledging one is a write and
    // there is no write path back to the plant.
    unacknowledged: list.length,
  };
  const totalAlarms = alarmCounts.critical + alarmCounts.warning + alarmCounts.info;

  // Worst first, then newest — the same order the alerts screen uses.
  const latest = [...list].sort(
    (a, b) => Number(b.severity === 'critical') - Number(a.severity === 'critical')
      || b.timestamp.getTime() - a.timestamp.getTime(),
  )[0];

  return (
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Alarm Summary */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Active Alarms
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Critical */}
            <button
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-colors',
                alarmCounts.critical > 0
                  ? 'text-red-700 hover:bg-red-50 border border-red-200'
                  : 'text-slate-400 border border-slate-200'
              )}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{alarmCounts.critical}</span>
              <span className="hidden sm:inline">Critical</span>
            </button>

            {/* Warning */}
            <button
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-colors',
                alarmCounts.warning > 0
                  ? 'text-amber-700 hover:bg-amber-50 border border-amber-200'
                  : 'text-slate-400 border border-slate-200'
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{alarmCounts.warning}</span>
              <span className="hidden sm:inline">Warning</span>
            </button>

            {/* Info */}
            <button
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-colors',
                alarmCounts.info > 0
                  ? 'text-blue-700 hover:bg-blue-50 border border-blue-200'
                  : 'text-slate-400 border border-slate-200'
              )}
            >
              <Info className="h-3.5 w-3.5" />
              <span>{alarmCounts.info}</span>
              <span className="hidden sm:inline">Info</span>
            </button>
          </div>

          {/* Separator */}
          <div className="h-5 w-px bg-slate-300" />

          {/* Unacknowledged */}
          {alarmCounts.unacknowledged > 0 && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-semibold text-red-600">
                {alarmCounts.unacknowledged} Unacknowledged
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Latest Alarm Preview */}
          {/* Was "pH HIGH at Plant C 5m ago" — a fixed string naming a plant
              that does not exist in this deployment, and an age that never
              advanced. */}
          {latest && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <span>Latest:</span>
              <span className={cn('font-semibold',
                latest.severity === 'critical' ? 'text-red-600' : 'text-amber-600')}>
                {latest.tag}
              </span>
              <span className="text-slate-400">at {latest.plantName}</span>
              <span className="text-slate-400 font-mono">{ago(latest.timestamp)}</span>
            </div>
          )}

          <button className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors border border-slate-300">
            View All
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* ACK ALL is hidden, not disabled. Acknowledging is a write, and
              there is no write path back to the plant — the button would have
              done nothing, which is worse than not offering it. */}
        </div>
      </div>
    </div>
  );
}
