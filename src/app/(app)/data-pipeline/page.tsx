'use client';

import { useState, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  FileJson,
  Filter,
  Ruler,
  ShieldCheck,
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import { ingest } from '@/lib/pipeline/ingest';
import { SAMPLE_PAYLOAD, SAMPLE_PAYLOAD_JSON } from '@/data/sample-payload';
import { IngestResult, TracedReading } from '@/lib/pipeline/types';
import { cn } from '@/lib/utils';

const STAGES = [
  { key: 'arrive', label: 'File arrives', icon: FileJson, detail: 'object storage' },
  { key: 'filter', label: 'Filter', icon: Filter, detail: 'tag_map lookup' },
  { key: 'normalise', label: 'Normalise', icon: Ruler, detail: 'unit conversion' },
  { key: 'validate', label: 'Validate', icon: ShieldCheck, detail: 'quality + range' },
  { key: 'store', label: 'Store', icon: Database, detail: 'readings table' },
] as const;

const OUTCOME_STYLE: Record<
  TracedReading['outcome'],
  { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  stored: { label: 'stored', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  rejected: { label: 'rejected', cls: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
  equipment: { label: 'equipment', cls: 'bg-sky-50 text-sky-700 border-sky-200', Icon: Wrench },
  unmapped: { label: 'unmapped', cls: 'bg-slate-100 text-slate-600 border-slate-300', Icon: Filter },
};

export default function DataPipelinePage() {
  const [result, setResult] = useState<IngestResult | null>(null);
  const [stage, setStage] = useState(-1);
  const [running, setRunning] = useState(false);

  const preview = useMemo(() => ingest(SAMPLE_PAYLOAD), []);

  const run = () => {
    setRunning(true);
    setResult(null);
    setStage(-1);
    STAGES.forEach((_, i) => {
      setTimeout(() => setStage(i), i * 420);
    });
    setTimeout(() => {
      setResult(ingest(SAMPLE_PAYLOAD));
      setRunning(false);
    }, STAGES.length * 420);
  };

  const reset = () => {
    setResult(null);
    setStage(-1);
  };

  const c = result?.counts;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* ── header ─────────────────────────────────────────── */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            Data Pipeline
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            {preview.sourceUri}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-semibold transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            {running ? 'Processing…' : 'Process file'}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* ── stage flow ─────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-slate-200 px-4 py-4">
        <div className="flex items-stretch gap-2 overflow-x-auto">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const active = stage >= i;
            return (
              <div key={s.key} className="flex items-center gap-2 shrink-0">
                <div
                  className={cn(
                    'flex flex-col items-center gap-1.5 px-4 py-3 border-2 rounded min-w-[124px] transition-colors duration-300',
                    active
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      active ? 'text-emerald-600' : 'text-slate-400'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-bold',
                      active ? 'text-slate-800' : 'text-slate-400'
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{s.detail}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <ArrowRight
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      stage > i ? 'text-emerald-500' : 'text-slate-300'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── counters ───────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-slate-200">
        <div className="flex items-stretch divide-x divide-slate-200 overflow-x-auto">
          {[
            { k: 'READINGS IN', v: c?.readingsIn, tone: 'text-slate-800' },
            { k: 'STORED', v: c?.stored, tone: 'text-emerald-600' },
            { k: 'EQUIPMENT', v: c?.equipment, tone: 'text-sky-600' },
            { k: 'REJECTED', v: c?.rejected, tone: 'text-red-600' },
            { k: 'CONVERTED', v: c?.conversions, tone: 'text-amber-600' },
            { k: 'FIELDS DROPPED', v: c?.fieldsDropped, tone: 'text-slate-500' },
            { k: 'ALARMS', v: c?.alarms, tone: 'text-red-600' },
          ].map((m) => (
            <div key={m.k} className="flex-1 min-w-[112px] px-4 py-3">
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">
                {m.k}
              </p>
              <p className={cn('text-2xl font-bold tabular-nums leading-none font-mono', m.tone)}>
                {m.v ?? '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── alarms ─────────────────────────────────────────── */}
      {result && result.alarms.length > 0 && (
        <div className="bg-red-50 border-b-2 border-red-200 px-4 py-2.5 flex flex-wrap items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          {result.alarms.map((a) => (
            <span key={a.tag} className="text-xs font-mono text-red-700">
              <span className="font-bold uppercase">{a.severity}</span> · {a.tag} ·{' '}
              {a.value} {a.unit} vs {a.limit} @ {a.location}
            </span>
          ))}
        </div>
      )}

      {/* ── body ───────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-4 p-4">
        {/* raw input */}
        <section className="bg-white border-2 border-slate-200 rounded flex flex-col min-h-0">
          <header className="px-3 py-2 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Raw file as received
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {preview.counts.fieldsDropped} housekeeping fields · {preview.counts.readingsIn} readings
            </p>
          </header>
          <pre className="flex-1 overflow-auto p-3 text-[10.5px] leading-relaxed font-mono text-slate-700 max-h-[560px]">
            {SAMPLE_PAYLOAD_JSON}
          </pre>
        </section>

        {/* decisions */}
        <section className="bg-white border-2 border-slate-200 rounded flex flex-col min-h-0">
          <header className="px-3 py-2 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              What happened to every reading
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Each row shows the decision and why
            </p>
          </header>

          {!result ? (
            <div className="flex-1 flex items-center justify-center p-10 text-center">
              <div>
                <Filter className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  Press <span className="font-semibold text-slate-700">Process file</span> to run
                  this payload through the pipeline.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto max-h-[560px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b-2 border-slate-200">
                  <tr>
                    {['Tag', 'Stage', 'Raw', 'Stored as', 'Outcome', 'Why'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-500 font-semibold whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.traced.map((t) => {
                    const o = OUTCOME_STYLE[t.outcome];
                    const OIcon = o.Icon;
                    return (
                      <tr
                        key={t.raw.tag}
                        className={cn(
                          'border-b border-slate-100',
                          t.outcome === 'rejected' && 'bg-red-50/50',
                          t.conversion && 'bg-amber-50/40'
                        )}
                      >
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-800 whitespace-nowrap">
                          {t.raw.tag}
                        </td>
                        <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">
                          {t.location ?? t.raw.loc ?? '—'}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                          {t.raw.v} {t.raw.u}
                        </td>
                        <td className="px-3 py-1.5 font-mono whitespace-nowrap tabular-nums">
                          {t.canonicalValue !== undefined ? (
                            <span
                              className={cn(
                                t.conversion ? 'text-amber-700 font-semibold' : 'text-slate-700'
                              )}
                            >
                              {t.canonicalValue} {t.canonicalUnit}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-mono font-semibold',
                              o.cls
                            )}
                          >
                            <OIcon className="h-3 w-3" />
                            {o.label}
                          </span>
                          {t.status && t.status !== 'normal' && (
                            <span
                              className={cn(
                                'ml-1 px-1.5 py-0.5 border rounded text-[10px] font-mono font-semibold',
                                t.status === 'critical'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              )}
                            >
                              {t.status}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-slate-600 min-w-[220px]">
                          {t.conversion && (
                            <span className="text-amber-700">
                              {t.conversion.transform === 'ppb_to_mg_l'
                                ? `converted ${t.conversion.fromValue} ${t.conversion.from} → ${t.conversion.toValue} ${t.conversion.to}`
                                : `unit label ${t.conversion.from} → ${t.conversion.to}`}
                            </span>
                          )}
                          {t.note && (
                            <span className={cn(t.conversion && 'block')}>{t.note}</span>
                          )}
                          {t.timestampInherited && (
                            <span className="block text-slate-400 text-[10px] font-mono">
                              no timestamp — inherited publishedAt
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
