'use client';

import { Header } from '@/components/layout/header';
import { Cog, AlertTriangle, Clock, CheckCircle2, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEquipment } from '@/lib/api/hooks';

/**
 * Equipment health, assembled from the PLC's own tags.
 *
 * There is no asset register — a plant's equipment list lives in a CMMS and we
 * have not been given one. But the controller already tells us which equipment
 * exists and how it is behaving: every pump carries a run bit, a fault bit and
 * an hours-run counter under a shared tag suffix, so XS-P-101, XA-P-101 and
 * KQ-P-101 are three views of one pump.
 *
 * Grouping by that suffix reconstructs the asset without inventing anything.
 * What it cannot supply is make, model, install date or service history — and
 * those are absent here rather than filled with plausible values.
 */
const HEALTH = {
  fault: { label: 'Fault', cls: 'text-red-700 bg-red-50 border-red-300', icon: AlertTriangle },
  due:   { label: 'Service due', cls: 'text-amber-700 bg-amber-50 border-amber-300', icon: Clock },
  ok:    { label: 'OK', cls: 'text-emerald-700 bg-emerald-50 border-emerald-300', icon: CheckCircle2 },
} as const;

export default function AssetMonitorPage() {
  const { data, error, loading } = useEquipment();
  const assets = data ?? [];

  const counts = {
    fault: assets.filter((a) => a.health === 'fault').length,
    due: assets.filter((a) => a.health === 'due').length,
    ok: assets.filter((a) => a.health === 'ok').length,
    running: assets.filter((a) => a.running).length,
  };

  return (
    <div className="min-h-screen">
      <Header title="Asset Health" subtitle="Equipment state from the controller's run, fault and hours tags" />

      <div className="p-6 space-y-5">
        {error && (
          <div className="border-l-4 border-red-500 bg-red-50 px-4 py-2">
            <p className="text-xs text-red-800">{error.message}</p>
          </div>
        )}

        {!loading && assets.length === 0 && (
          <div className="border border-slate-200 bg-white px-6 py-10 text-center">
            <Cog className="h-8 w-8 mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 mb-1">No equipment tags in the register map</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              This screen reads run status, fault bits and hours-run counters.
              Add those tags and the equipment appears automatically.
            </p>
          </div>
        )}

        {assets.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Tile label="Faulted" value={counts.fault} tone={counts.fault ? 'red' : 'grey'} />
              <Tile label="Service due" value={counts.due} tone={counts.due ? 'amber' : 'grey'} />
              <Tile label="Healthy" value={counts.ok} tone="green" />
              <Tile label="Running now" value={counts.running} tone="grey" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {assets.map((a) => {
                const h = HEALTH[a.health];
                const Icon = h.icon;
                return (
                  <div key={a.id} className={cn('border bg-white', a.health === 'fault' ? 'border-l-4 border-l-red-500' : 'border-slate-200')}>
                    <div className="flex items-start justify-between px-4 py-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{a.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{a.id}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {a.plantName} · {a.stage}
                        </p>
                      </div>
                      <span className={cn('flex items-center gap-1 px-2 py-0.5 border text-[10px] font-bold uppercase', h.cls)}>
                        <Icon className="h-3 w-3" />
                        {h.label}
                      </span>
                    </div>

                    <div className="px-4 py-3 grid grid-cols-2 gap-3 text-xs">
                      {a.kind === 'valve' ? (
                        <>
                          <Field label="Open" value={fmtBool(a.valveOpen)} />
                          <Field label="Closed" value={fmtBool(a.valveClosed)} />
                        </>
                      ) : (
                        <>
                          <Field
                            label="Status"
                            value={a.running == null ? '—' : a.running ? 'Running' : 'Stopped'}
                            icon={a.running ? Power : undefined}
                          />
                          <Field label="Fault" value={fmtBool(a.fault)} />
                          <Field
                            label="Hours run"
                            value={a.runHours != null ? a.runHours.toLocaleString() : '—'}
                          />
                          <Field
                            label="Starts"
                            value={a.startCount != null ? a.startCount.toLocaleString() : '—'}
                          />
                        </>
                      )}
                    </div>

                    {a.note && (
                      <p className="px-4 pb-3 text-[11px] text-slate-500">{a.note}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-2.5">
              <p className="text-xs text-amber-900">
                <span className="font-bold">Service intervals are assumed.</span>{' '}
                &ldquo;Service due&rdquo; uses a conventional overhaul figure, not the
                manufacturer&rsquo;s. Make, model, install date and maintenance history
                are not shown because the controller does not carry them — they
                would come from an asset register.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const fmtBool = (v: boolean | null) => (v == null ? '—' : v ? 'Yes' : 'No');

function Field({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="font-mono flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3 text-emerald-600" />}
        {value}
      </p>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone: 'red' | 'amber' | 'green' | 'grey' }) {
  const cls = {
    red: 'border-l-red-500 text-red-600',
    amber: 'border-l-amber-500 text-amber-600',
    green: 'border-l-emerald-500 text-emerald-600',
    grey: 'border-l-slate-400 text-slate-700',
  }[tone];
  return (
    <div className={cn('border border-slate-200 border-l-4 bg-white px-4 py-3', cls)}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('text-2xl font-bold font-mono tabular-nums', cls)}>{value}</p>
    </div>
  );
}
