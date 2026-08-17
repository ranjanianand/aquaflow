'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  ResponsiveContainer, ComposedChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { ExternalLink } from 'lucide-react';
import { useSensorHistory } from '@/lib/api/hooks';
import type { Observation } from '@/lib/insights/derive';

/**
 * The readings behind an observation.
 *
 * The card asserts something about an instrument; this is where somebody
 * checks it. It charts that instrument's own history — not a curve matched by
 * unit, and not a projection — with the limit drawn across it so the breach is
 * visible rather than asserted.
 */
export function ObservationDetailModal({ observation, open, onOpenChange }: {
  observation: Observation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Only fetch while open, and only for an instrument that exists.
  const { data: history, loading } = useSensorHistory(
    open && observation?.sensorId ? observation.sensorId : null, 24 * 14);

  const points = useMemo(() => (history?.points ?? [])
    .filter((p) => p.value !== null)
    .map((p) => ({
      date: p.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round((p.value as number) * 100) / 100,
    })), [history]);

  if (!observation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-2xl p-0 gap-0">
        <div className="bg-slate-100 px-5 py-3 border-b-2 border-slate-300">
          <DialogHeader>
            <div className="text-[9px] text-slate-500 mb-1">
              {observation.plantName} · {observation.location}
            </div>
            <DialogTitle className="text-[14px] font-semibold text-slate-800">
              {observation.title}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[12px] text-slate-600">{observation.description}</p>

          {observation.kind === 'silent' ? (
            <div className="border-2 border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                Why there is nothing to chart
              </p>
              <p className="text-[12px] text-slate-600">
                These instruments have no readings, so there is no history to
                show. The next step is upstream of the dashboard: confirm the
                gateway is delivering files, then that the tags in its register
                map match what the PLC publishes.
              </p>
              <p className="text-[11px] text-slate-500 mt-3">
                Gateway <span className="font-mono">{observation.location}</span> ·{' '}
                {observation.detail}
              </p>
            </div>
          ) : (
          <div className="border-2 border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                14-day trend
              </span>
              {observation.limit !== null && (
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-3 h-0.5 bg-red-500 inline-block" />
                  {observation.limitLabel} ({observation.limit} {observation.unit})
                </span>
              )}
            </div>

            <div className="h-[190px]">
              {/* Three distinct states. An empty chart with no caption reads as
                  "the value is zero", which is the one thing it never means. */}
              {!observation.sensorId ? (
                <Empty text="This observation is not tied to a single instrument." />
              ) : loading && points.length === 0 ? (
                <Empty text="Loading readings…" />
              ) : points.length === 0 ? (
                <Empty text="No readings from this instrument in the last 14 days." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={points}>
                    <defs>
                      <linearGradient id="obsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }}
                           axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }}
                           axisLine={false} tickLine={false} width={44} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 0, border: '1px solid #cbd5e1' }}
                      formatter={(v: number) => [`${v} ${observation.unit}`, 'Reading']}
                    />
                    {observation.limit !== null && (
                      <ReferenceLine
                        y={observation.limit} stroke="#ef4444" strokeDasharray="5 5"
                        label={{ value: 'Limit', position: 'right',
                                 fill: '#ef4444', fontSize: 9 }}
                      />
                    )}
                    <Area type="monotone" dataKey="value" stroke="#0ea5e9"
                          strokeWidth={1.5} fill="url(#obsFill)" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          )}

          <p className="text-[11px] text-slate-500">
            Readings as the plant sent them. This system does not write to the
            plant — any change is made in the control system by an operator.
          </p>
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border-t-2 border-slate-200 bg-slate-50">
          <Link
            href={`/monitoring?plant=${observation.plantId}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in monitoring
          </Link>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center px-6 text-center">
      <p className="text-[11px] text-slate-400">{text}</p>
    </div>
  );
}
