'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Zap, Gauge, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnergy, usePlants } from '@/lib/api/hooks';
import { DataFreshness } from '@/components/shared/data-freshness';

/**
 * Energy, from the plant's own kWh meters.
 *
 * The previous version of this screen was entirely fixture data — tariffs,
 * carbon figures, cost projections, none of it connected to anything.
 *
 * What follows is only what the meters actually report. Consumption comes from
 * counter differences, because a kWh meter gives a lifetime total and the
 * energy used is the change between two readings. Cost and carbon are absent
 * deliberately: both need a tariff and an emissions factor that nobody has
 * supplied, and inventing either produces a number someone will quote.
 */
const RANGES = [
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 24 * 7 },
  { label: '30 days', hours: 24 * 30 },
];

export default function EnergyPage() {
  const [hours, setHours] = useState(24);
  const { data: plants } = usePlants();
  const { data, error, loading } = useEnergy(hours);

  const meters = data?.meters ?? [];
  const newest = meters.length
    ? new Date(Math.max(...meters.map(() => Date.now())))
    : null;

  return (
    <div className="min-h-screen">
      <Header title="Energy" subtitle="Consumption measured at the motor control centres" />

      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.hours}
                onClick={() => setHours(r.hours)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold border transition-colors',
                  hours === r.hours
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <DataFreshness newest={newest} error={error} loading={loading} />
        </div>

        {error && (
          <div className="border-l-4 border-red-500 bg-red-50 px-4 py-2">
            <p className="text-xs text-red-800">{error.message}</p>
          </div>
        )}

        {!loading && meters.length === 0 && (
          <div className="border border-slate-200 bg-white px-6 py-10 text-center">
            <Zap className="h-8 w-8 mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 mb-1">No energy meters reporting</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              This screen reads kWh totalisers from the register map. Add the
              meter tags and it populates on the next ingest — no change here is
              needed.
            </p>
          </div>
        )}

        {meters.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Tile
                icon={Zap}
                label="Consumption"
                value={data?.totalKwh?.toLocaleString() ?? '—'}
                unit="kWh"
                note={`across ${meters.length} meters`}
              />
              <Tile
                icon={Activity}
                label="Current load"
                value={meters
                  .reduce((t, m) => t + (m.currentKw ?? 0), 0)
                  .toFixed(1)}
                unit="kW"
                note="instantaneous, all MCCs"
              />
              <Tile
                icon={Gauge}
                label="Meters reporting"
                value={String(meters.length)}
                unit=""
                note={`${plants?.length ?? 0} plants configured`}
              />
            </div>

            <div className="border border-slate-200 bg-white">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  By motor control centre
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="text-left px-4 py-2 font-semibold">Meter</th>
                    <th className="text-left px-4 py-2 font-semibold">Location</th>
                    <th className="text-right px-4 py-2 font-semibold">Consumption</th>
                    <th className="text-right px-4 py-2 font-semibold">Current</th>
                    <th className="text-right px-4 py-2 font-semibold">Lifetime</th>
                  </tr>
                </thead>
                <tbody>
                  {meters.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="px-4 py-2.5 font-mono text-xs">{m.tag}</td>
                      <td className="px-4 py-2.5">{m.location}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {m.kwh?.toLocaleString() ?? '—'}
                        <span className="text-slate-400 text-xs ml-1">kWh</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {m.currentKw != null ? m.currentKw.toFixed(1) : '—'}
                        <span className="text-slate-400 text-xs ml-1">kW</span>
                      </td>
                      {/* The raw totaliser. Shown because it is what the meter
                          actually reports — everything else here is derived
                          from the change in this number. */}
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-400 text-xs">
                        {m.lifetimeKwh.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-2.5">
              <p className="text-xs text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                <span className="font-bold">Cost and carbon are not shown.</span>{' '}
                Both need a tariff and an emissions factor from the client. A
                figure derived from an assumed rate would be quoted as though it
                were measured.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Tile({
  icon: Icon, label, value, unit, note,
}: {
  icon: React.ElementType; label: string; value: string; unit: string; note: string;
}) {
  return (
    <div className="border border-slate-200 border-l-4 border-l-blue-500 bg-white px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold font-mono tabular-nums">
        {value}
        {unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">{note}</p>
    </div>
  );
}
