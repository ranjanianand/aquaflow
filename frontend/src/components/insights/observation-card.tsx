'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { acknowledgeInsight } from '@/lib/api/client';
import { KIND_LABEL, type Observation } from '@/lib/insights/derive';
import { AlertTriangle, Minus, EyeOff, BarChart3, Clock } from 'lucide-react';

const KIND = {
  breach: { icon: AlertTriangle, border: 'border-l-red-500', bg: 'bg-red-50',
            fg: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  stuck:  { icon: Minus, border: 'border-l-amber-500', bg: 'bg-amber-50',
            fg: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  silent: { icon: EyeOff, border: 'border-l-slate-500', bg: 'bg-slate-100',
            fg: 'text-slate-500', badge: 'bg-slate-200 text-slate-700' },
} as const;

const PRIORITY = {
  high: { label: 'High', color: 'bg-red-600 text-white' },
  medium: { label: 'Medium', color: 'bg-amber-500 text-white' },
  low: { label: 'Low', color: 'bg-slate-400 text-white' },
} as const;

/**
 * One observation drawn from readings.
 *
 * The layout deliberately mirrors the old recommendation card, but the middle
 * block reads "measured against limit" rather than "current → recommended".
 * That is the whole difference: this states what an instrument did, not what
 * somebody should set it to.
 */
export function ObservationCard({ observation, acknowledgement, onAcknowledged, onOpenData }: {
  observation: Observation;
  acknowledgement?: { acknowledgedBy: string; acknowledgedAt: string } | null;
  onAcknowledged?: () => void;
  onOpenData?: (o: Observation) => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const k = KIND[observation.kind];
  const Icon = k.icon;
  const priority = PRIORITY[observation.priority];

  async function acknowledge() {
    setBusy(true);
    setError(null);
    try {
      await acknowledgeInsight({
        insightId: observation.id,
        acknowledgedBy: user?.name ?? user?.email ?? 'unknown',
      });
      onAcknowledged?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn('overflow-hidden border-2 border-slate-300 border-l-[3px] bg-white',
                       k.border)}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn('p-2 shrink-0', k.bg)}>
              <Icon className={cn('h-5 w-5', k.fg)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded',
                                    priority.color)}>
                  {priority.label}
                </span>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded', k.badge)}>
                  {KIND_LABEL[observation.kind]}
                </span>
              </div>
              <h3 className="text-[14px] font-semibold text-slate-800">
                {observation.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <Clock className="h-3 w-3" />
            {observation.detail}
          </div>
        </div>

        <p className="text-[12px] text-slate-600 mb-4">{observation.description}</p>

        {/* Measured against the limit. No arrow to a recommended value —
            there is no recommendation, and drawing one would put a setpoint
            on screen that nothing stands behind. */}
        {observation.value !== null && (
          <div className="border-2 border-slate-200 bg-slate-50 p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Measured
              </span>
              <span className="text-[9px] text-slate-500">{observation.location}</span>
            </div>
            <div className="flex items-end gap-6">
              <div>
                <span className={cn('text-xl font-bold font-mono', k.fg)}>
                  {observation.value}
                </span>
                <span className="text-[11px] text-slate-500 ml-1">{observation.unit}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">average</p>
              </div>
              {observation.limit !== null && (
                <div>
                  <span className="text-xl font-bold font-mono text-slate-600">
                    {observation.limit}
                  </span>
                  <span className="text-[11px] text-slate-500 ml-1">{observation.unit}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {observation.limitLabel.toLowerCase()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-[11px] text-slate-500 mb-4">
          Location: <span className="font-medium text-slate-700">{observation.plantName}</span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenData?.(observation)}
              disabled={!observation.sensorId && observation.kind !== 'silent'}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              {observation.kind === 'silent' ? 'Why' : 'View data'}
            </button>
            {!acknowledgement && (
              <button
                onClick={acknowledge}
                disabled={busy}
                className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {busy ? 'Recording…' : 'Acknowledge'}
              </button>
            )}
          </div>

          {error && <p className="text-[11px] text-red-600">{error}</p>}

          {acknowledgement && (
            <p className="text-[11px] text-slate-500">
              Acknowledged by{' '}
              <span className="font-semibold text-slate-700">
                {acknowledgement.acknowledgedBy}
              </span>
              {' · '}
              {new Date(acknowledgement.acknowledgedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
