'use client';

import { AlertTriangle, EyeOff, Minus, Activity } from 'lucide-react';
import { KIND_LABEL, type Observation } from '@/lib/insights/derive';

/**
 * Counts of what the readings show.
 *
 * Counted from the same list rendered underneath, so the totals cannot drift
 * from the cards. The previous version totalled a fixture while the list
 * showed something else, which put an authoritative-looking number on screen
 * that disagreed with everything below it.
 */
export function InsightsSummary({ observations, coverage }: {
  observations: Observation[];
  coverage?: { total: number; reporting: number } | null;
}) {
  const count = (kind: Observation['kind']) =>
    observations.filter((o) => o.kind === kind).length;

  const tiles = [
    {
      label: 'Observations', value: observations.length,
      sub: `${observations.filter(o => o.priority === 'high').length} high priority`,
      icon: Activity, accent: 'border-l-blue-500', fg: 'text-blue-600',
    },
    {
      label: KIND_LABEL.breach, value: count('breach'),
      sub: 'instruments outside their band',
      icon: AlertTriangle, accent: 'border-l-red-500', fg: 'text-red-600',
    },
    {
      label: KIND_LABEL.stuck, value: count('stuck'),
      sub: 'readings not moving',
      icon: Minus, accent: 'border-l-amber-500', fg: 'text-amber-600',
    },
    {
      label: 'Reporting', value: coverage ? coverage.reporting : '—',
      sub: coverage ? `of ${coverage.total} instruments` : 'coverage',
      icon: EyeOff, accent: 'border-l-slate-400', fg: 'text-slate-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <div key={t.label}
               className={`border-2 border-slate-300 bg-white p-4 border-l-[3px] ${t.accent}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t.label}
              </span>
              <Icon className={`h-4 w-4 ${t.fg}`} />
            </div>
            <span className={`text-xl font-bold font-mono ${t.fg}`}>{t.value}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">{t.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
