'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pause,
  Play,
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
  Radio,
} from 'lucide-react';
import { ingest } from '@/lib/pipeline/ingest';
import { generateFile, FAULT_LABEL, GeneratedFile } from '@/lib/pipeline/generate';
import { IngestResult, TracedReading } from '@/lib/pipeline/types';
import { cn } from '@/lib/utils';
import { FEATURES } from '@/lib/features';
import { FeatureDisabled } from '@/components/shared/feature-disabled';

/** Seconds between arrivals. A real plant exports every few minutes. */
const ARRIVAL_SECONDS = 9;
const KEEP_FILES = 14;
const BACKFILL = 6;

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
  unmapped: { label: 'unmapped', cls: 'bg-amber-50 text-amber-700 border-amber-300', Icon: Filter },
};

interface Processed {
  file: GeneratedFile;
  result: IngestResult;
}

function processFile(seq: number, at: Date): Processed {
  const file = generateFile(seq, at);
  return {
    file,
    result: ingest(file.payload, { sourceUri: file.sourceUri }),
  };
}

function DataPipelineContent() {
  const [files, setFiles] = useState<Processed[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [live, setLive] = useState(true);
  const [pulse, setPulse] = useState(false);
  const seqRef = useRef(0);

  // Backfill so the screen opens on a system that has clearly been running,
  // rather than an empty state waiting to be operated.
  //
  // Deferred rather than set inline: the timestamps are client-only, so this
  // must not run during render or hydration.
  useEffect(() => {
    const id = setTimeout(() => {
      const now = Date.now();
      const seed: Processed[] = [];
      for (let i = BACKFILL; i >= 1; i--) {
        seqRef.current += 1;
        seed.push(processFile(seqRef.current, new Date(now - i * ARRIVAL_SECONDS * 1000)));
      }
      const ordered = seed.reverse();
      setFiles(ordered);
      setSelected(ordered[0].file.seq);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const arrive = useCallback(() => {
    seqRef.current += 1;
    const next = processFile(seqRef.current, new Date());
    setFiles((prev) => [next, ...prev].slice(0, KEEP_FILES));
    setSelected((cur) => (cur === null ? next.file.seq : cur));
    setPulse(true);
    setTimeout(() => setPulse(false), 1400);
  }, []);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(arrive, ARRIVAL_SECONDS * 1000);
    return () => clearInterval(t);
  }, [live, arrive]);

  const current = files.find((f) => f.file.seq === selected) ?? files[0];

  // Totals across everything ingested this session
  const totals = files.reduce(
    (a, f) => ({
      readingsIn: a.readingsIn + f.result.counts.readingsIn,
      stored: a.stored + f.result.counts.stored,
      rejected: a.rejected + f.result.counts.rejected,
      unmapped: a.unmapped + f.result.counts.unmapped,
      conversions: a.conversions + f.result.counts.conversions,
      fieldsDropped: a.fieldsDropped + f.result.counts.fieldsDropped,
      alarms: a.alarms + f.result.counts.alarms,
    }),
    { readingsIn: 0, stored: 0, rejected: 0, unmapped: 0, conversions: 0, fieldsDropped: 0, alarms: 0 }
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* ── header ─────────────────────────────────────────── */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            Ingestion
          </span>
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {live && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  live ? 'bg-emerald-500' : 'bg-slate-500'
                )}
              />
            </span>
            <span className="text-[10px] text-slate-300 font-mono uppercase tracking-wider">
              {live ? `watching · next in ~${ARRIVAL_SECONDS}s` : 'paused'}
            </span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono truncate hidden md:inline">
            s3://mwts-raw/raw/plant_id=P01/
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLive((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold transition-colors"
          >
            {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {live ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* ── stage strip ────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center gap-2 shrink-0">
                <div
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 border rounded transition-colors duration-500',
                    pulse ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors duration-500',
                      pulse ? 'text-emerald-600' : 'text-slate-400'
                    )}
                  />
                  <div className="leading-tight">
                    <p className="text-[11px] font-bold text-slate-700">{s.label}</p>
                    <p className="text-[9px] font-mono text-slate-500">{s.detail}</p>
                  </div>
                </div>
                {i < STAGES.length - 1 && (
                  <ArrowRight
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-colors duration-500',
                      pulse ? 'text-emerald-500' : 'text-slate-300'
                    )}
                  />
                )}
              </div>
            );
          })}
          <div className="ml-auto pl-4 shrink-0 hidden xl:block">
            <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
              runs on every file · no operator action
            </p>
          </div>
        </div>
      </div>

      {/* ── session totals ─────────────────────────────────── */}
      <div className="bg-white border-b-2 border-slate-200">
        <div className="flex items-stretch divide-x divide-slate-200 overflow-x-auto">
          {[
            { k: 'FILES', v: files.length, tone: 'text-slate-800' },
            { k: 'READINGS IN', v: totals.readingsIn, tone: 'text-slate-800' },
            { k: 'STORED', v: totals.stored, tone: 'text-emerald-600' },
            { k: 'REJECTED', v: totals.rejected, tone: 'text-red-600' },
            { k: 'UNMAPPED', v: totals.unmapped, tone: 'text-amber-600' },
            { k: 'CONVERTED', v: totals.conversions, tone: 'text-amber-600' },
            { k: 'FIELDS DROPPED', v: totals.fieldsDropped, tone: 'text-slate-500' },
            { k: 'ALARMS', v: totals.alarms, tone: 'text-red-600' },
          ].map((m) => (
            <div key={m.k} className="flex-1 min-w-[104px] px-4 py-2.5">
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-0.5">
                {m.k}
              </p>
              <p className={cn('text-xl font-bold tabular-nums leading-none font-mono', m.tone)}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── body ───────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)] gap-4 p-4">
        {/* file feed */}
        <section className="bg-white border-2 border-slate-200 rounded flex flex-col min-h-0">
          <header className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-slate-500" />
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Files received
            </h2>
          </header>
          <div className="flex-1 overflow-auto max-h-[600px] divide-y divide-slate-100">
            {files.map((f, idx) => {
              const sel = f.file.seq === current?.file.seq;
              const fault = FAULT_LABEL[f.file.fault];
              const bad = f.result.counts.rejected + f.result.counts.unmapped;
              return (
                <button
                  key={f.file.seq}
                  onClick={() => setSelected(f.file.seq)}
                  className={cn(
                    'w-full text-left px-3 py-2 transition-colors',
                    sel ? 'bg-slate-800' : 'hover:bg-slate-50',
                    idx === 0 && pulse && !sel && 'bg-emerald-50'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'font-mono text-[11px] truncate',
                        sel ? 'text-white font-semibold' : 'text-slate-700'
                      )}
                    >
                      {f.file.name}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-mono shrink-0',
                        sel ? 'text-slate-300' : 'text-slate-400'
                      )}
                    >
                      {f.file.receivedAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span
                      className={cn(
                        'text-[10px] font-mono px-1 rounded',
                        sel ? 'bg-slate-700 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                      )}
                    >
                      {f.result.counts.stored} stored
                    </span>
                    {bad > 0 && (
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1 rounded',
                          sel ? 'bg-slate-700 text-red-300' : 'bg-red-50 text-red-700'
                        )}
                      >
                        {bad} not stored
                      </span>
                    )}
                    {f.result.counts.alarms > 0 && (
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1 rounded',
                          sel ? 'bg-slate-700 text-amber-300' : 'bg-amber-50 text-amber-700'
                        )}
                      >
                        {f.result.counts.alarms} alarm
                      </span>
                    )}
                  </div>
                  {fault && (
                    <p
                      className={cn(
                        'text-[10px] mt-0.5',
                        sel ? 'text-amber-300' : 'text-amber-700'
                      )}
                    >
                      {fault}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* decisions for the selected file */}
        <section className="bg-white border-2 border-slate-200 rounded flex flex-col min-h-0">
          <header className="px-3 py-2 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              What happened to every reading
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
              {current?.file.sourceUri}
            </p>
          </header>

          {current && current.result.alarms.length > 0 && (
            <div className="bg-red-50 border-b border-red-200 px-3 py-2 flex flex-wrap items-center gap-3">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
              {current.result.alarms.map((a) => (
                <span key={a.tag} className="text-[11px] font-mono text-red-700">
                  <span className="font-bold uppercase">{a.severity}</span> · {a.tag} ·{' '}
                  {a.value} {a.unit} vs {a.limit} @ {a.location}
                </span>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-auto max-h-[600px]">
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
                {current?.result.traced.map((t) => {
                  const o = OUTCOME_STYLE[t.outcome];
                  const OIcon = o.Icon;
                  return (
                    <tr
                      key={t.raw.tag}
                      className={cn(
                        'border-b border-slate-100',
                        t.outcome === 'rejected' && 'bg-red-50/50',
                        t.outcome === 'unmapped' && 'bg-amber-50/60',
                        t.conversion && 'bg-amber-50/30'
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
                      <td className="px-3 py-1.5 text-slate-600 min-w-[210px]">
                        {t.conversion && (
                          <span className="text-amber-700">
                            {t.conversion.transform === 'ppb_to_mg_l'
                              ? `converted ${t.conversion.fromValue} ${t.conversion.from} → ${t.conversion.toValue} ${t.conversion.to}`
                              : `unit label ${t.conversion.from} → ${t.conversion.to}`}
                          </span>
                        )}
                        {t.note && <span className={cn(t.conversion && 'block')}>{t.note}</span>}
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
        </section>
      </div>
    </div>
  );
}

// Gated: see lib/features.ts
export default function DataPipelinePage() {
  if (!FEATURES.dataPipeline) {
    return (
      <FeatureDisabled
        title="The data pipeline view is not available"
        reason="This screen reports on how each incoming file was processed rather than analysing the readings themselves."
        requirement="A decision to surface ingestion detail alongside the analytics."
      />
    );
  }
  return <DataPipelineContent />;
}
