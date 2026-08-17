'use client';

import { cn } from '@/lib/utils';
import { ArrowRight, TrendingDown, AlertTriangle } from 'lucide-react';
import type { InsightsData } from '@/lib/api/client';

/**
 * How much the works actually removes.
 *
 * Raw against final, for the contaminants a treatment plant exists to take
 * out. This is the one figure the whole process is judged on, and it is a
 * subtraction — no model, no assumed dose, nothing inferred.
 *
 * The previous version listed fixed efficiency percentages and an "optimal"
 * coagulant dose. Neither had a source: nothing measures dose, and an optimal
 * one depends on raw water chemistry that changes daily.
 */
export function ProcessOptimization({ data, loading }: {
  data: InsightsData | null;
  loading?: boolean;
}) {
  const rows = data?.removal ?? [];

  if (loading && rows.length === 0) {
    return <Panel><p className="p-8 text-center text-sm text-slate-400">Loading…</p></Panel>;
  }

  if (rows.length === 0) {
    return (
      <Panel>
        <div className="p-10 text-center">
          <TrendingDown className="h-9 w-9 mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 mb-1">No removal figures available</p>
          {/* Says which of the two it is, because "no data" and "the same
              parameter is not measured at both ends" need different fixes. */}
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Removal needs the same parameter measured at both the intake and the
            outlet. No plant in this window has a contaminant instrumented at
            both ends.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b-2 border-slate-200">
              <th className="text-left px-4 py-2 font-bold">Plant</th>
              <th className="text-left px-4 py-2 font-bold">Parameter</th>
              <th className="text-right px-4 py-2 font-bold">Raw water</th>
              <th className="text-right px-4 py-2 font-bold">Final water</th>
              <th className="text-right px-4 py-2 font-bold">Removed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              // A contaminant that rises across the works is not inefficiency,
              // it is something wrong — and the sign should make that obvious.
              const rising = r.removalPct < 0;
              return (
                <tr key={`${r.plantId}-${r.parameter}`} className="border-b border-slate-100">
                  <td className="px-4 py-2 text-slate-700">{r.plantName}</td>
                  <td className="px-4 py-2 text-slate-600">{r.parameter}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-slate-600">
                    {r.rawAvg} <span className="text-slate-400">{r.unit}</span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-slate-700">
                    {r.finalAvg} <span className="text-slate-400">{r.unit}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="inline-flex items-center gap-2 justify-end">
                      <span className="relative h-1.5 w-20 bg-slate-100 overflow-hidden">
                        <span
                          className={cn('absolute inset-y-0 left-0',
                                        rising ? 'bg-red-500' : 'bg-emerald-500')}
                          style={{ width: `${Math.min(100, Math.abs(r.removalPct))}%` }}
                        />
                      </span>
                      <span className={cn('font-mono text-xs tabular-nums w-16 text-right font-semibold',
                                          rising ? 'text-red-600' : 'text-emerald-700')}>
                        {rising && <AlertTriangle className="h-3 w-3 inline mr-0.5 -mt-0.5" />}
                        {r.removalPct}%
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
        <ArrowRight className="h-3 w-3 mt-0.5 shrink-0" />
        Average raw against average final over the selected window, for
        contaminants measured at both ends. A negative figure means the
        parameter rose across the works.
      </p>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-2 border-slate-300 bg-white overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
          Removal across the works
        </span>
      </div>
      {children}
    </div>
  );
}
