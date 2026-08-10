'use client';

import { Header } from '@/components/layout/header';
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudit } from '@/lib/api/hooks';

/**
 * What this system did, and when.
 *
 * Not plant commands: there is no write path back to the controller, so there
 * are none to record. The previous version of this screen listed setpoint
 * changes and equipment starts that had never happened.
 *
 * What it shows instead is the ingest's own history — every run, what it
 * loaded, what it refused and whether the row counts reconciled. That is the
 * trail an operator actually needs to answer "why did the chart change", and
 * every input already exists in the database.
 */
const OUTCOME = {
  ok:     { label: 'Loaded',      cls: 'text-emerald-700 bg-emerald-50 border-emerald-300', icon: CheckCircle2 },
  'no-op':{ label: 'Nothing new', cls: 'text-slate-600 bg-slate-50 border-slate-300',       icon: MinusCircle },
  failed: { label: 'Unreconciled',cls: 'text-amber-700 bg-amber-50 border-amber-300',       icon: AlertTriangle },
  error:  { label: 'Error',       cls: 'text-red-700 bg-red-50 border-red-300',             icon: XCircle },
} as const;

export default function AuditLogPage() {
  const { data, error, loading } = useAudit(100);
  const runs = data ?? [];

  const loaded = runs.filter((r) => r.outcome === 'ok').length;
  const problems = runs.filter((r) => r.outcome === 'failed' || r.outcome === 'error').length;
  const totalRows = runs.reduce((t, r) => t + r.readingsOut, 0);

  return (
    <div className="min-h-screen">
      <Header title="Audit Log" subtitle="Every ingest run, what it loaded, and whether it reconciled" />

      <div className="p-6 space-y-5">
        {error && (
          <div className="border-l-4 border-red-500 bg-red-50 px-4 py-2">
            <p className="text-xs text-red-800">{error.message}</p>
          </div>
        )}

        {!loading && runs.length === 0 && (
          <div className="border border-slate-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-slate-500">No ingest runs recorded yet</p>
          </div>
        )}

        {runs.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Tile label="Runs recorded" value={runs.length.toLocaleString()} tone="grey" />
              <Tile label="Loaded data" value={loaded.toLocaleString()} tone="green" />
              <Tile label="Needing attention" value={problems.toLocaleString()}
                    tone={problems ? 'amber' : 'grey'} />
            </div>

            <div className="border border-slate-200 bg-white overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-2 font-semibold">Finished</th>
                    <th className="text-left px-4 py-2 font-semibold">Outcome</th>
                    <th className="text-right px-4 py-2 font-semibold">Files</th>
                    <th className="text-right px-4 py-2 font-semibold">Skipped</th>
                    <th className="text-right px-4 py-2 font-semibold">Loaded</th>
                    <th className="text-right px-4 py-2 font-semibold">Dropped</th>
                    <th className="text-right px-4 py-2 font-semibold">Took</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => {
                    const o = OUTCOME[r.outcome];
                    const Icon = o.icon;
                    return (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">
                          {r.finishedAt ? new Date(r.finishedAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-2">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-bold uppercase', o.cls)}>
                            <Icon className="h-3 w-3" />
                            {o.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums">{r.filesSeen.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-400">{r.filesSkipped.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums">{r.readingsOut.toLocaleString()}</td>
                        <td className={cn('px-4 py-2 text-right font-mono tabular-nums',
                                          r.dropped > 0 ? 'text-amber-600' : 'text-slate-400')}>
                          {r.dropped.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-500">
                          {r.durationSeconds != null ? `${r.durationSeconds}s` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-l-4 border-slate-400 bg-slate-50 px-4 py-2.5">
              <p className="text-xs text-slate-600">
                <span className="font-bold">&ldquo;Unreconciled&rdquo; is not always data loss.</span>{' '}
                Readings parsed minus readings loaded should equal the sum of
                logged drop reasons. Re-reading files whose rows already exist
                breaks that equation without losing anything — which is what a
                backfill does. A run over new files that fails this check is
                worth investigating.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: 'green' | 'amber' | 'grey' }) {
  const cls = {
    green: 'border-l-emerald-500 text-emerald-600',
    amber: 'border-l-amber-500 text-amber-600',
    grey: 'border-l-slate-400 text-slate-700',
  }[tone];
  return (
    <div className={cn('border border-slate-200 border-l-4 bg-white px-4 py-3', cls)}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('text-2xl font-bold font-mono tabular-nums', cls)}>{value}</p>
    </div>
  );
}
