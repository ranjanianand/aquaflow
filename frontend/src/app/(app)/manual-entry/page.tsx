'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { FlaskConical, Check, AlertTriangle, Upload, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { usePlants, useManualSensors, useManualBatches } from '@/lib/api/hooks';
import { SubmissionLog } from '@/components/manual/submission-log';
import { submitManualBatch, uploadReadings,
         type UploadResult, type BatchResult } from '@/lib/api/client';

/**
 * Recording measurements taken by hand.
 *
 * Not everything a plant measures comes from an instrument. Lab results — COD,
 * BOD, coliforms — are taken daily by a technician, and they land in the same
 * table as sensor readings, so a trend chart shows both and the same alarm
 * bands apply.
 *
 * Laid out as a bench sheet rather than a single field, because that is the
 * shape of the work: one sample is drawn and a dozen things are measured from
 * it. Those readings share a sample time because they describe the same water,
 * and entering them one at a time would give each a slightly different
 * timestamp, so nothing would line up on a chart.
 *
 * A typed number has nothing upstream to catch a transposed digit, so each row
 * carries its expected range and is judged before it is submitted.
 */
export default function ManualEntryPage() {
  const { user } = useAuth();
  const { data: plants } = usePlants();
  const [plantId, setPlantId] = useState('');
  const { data: sensors, loading } = useManualSensors(plantId || undefined);
  const { data: batches, loading: batchesLoading,
          refresh: refreshBatches } = useManualBatches(30);

  const [mode, setMode] = useState<'sheet' | 'file'>('sheet');
  const [values, setValues] = useState<Record<string, string>>({});
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plantId && plants?.length) setPlantId(plants[0].id);
  }, [plants, plantId]);

  // A half-filled sheet for one plant must not carry over to another.
  useEffect(() => { setValues({}); setResult(null); setError(null); }, [plantId]);

  // Grouped by where the sample is drawn, which is the order a technician
  // walks the plant — not alphabetically by parameter.
  const groups = useMemo(() => {
    const by = new Map<string, typeof sensors>();
    for (const s of sensors ?? []) {
      if (!by.has(s.location)) by.set(s.location, []);
      by.get(s.location)!.push(s);
    }
    return [...by.entries()];
  }, [sensors]);

  const filled = useMemo(
    () => Object.entries(values).filter(([, v]) => v.trim() !== ''),
    [values]);
  const anyInvalid = filled.some(([, v]) => Number.isNaN(Number(v)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!filled.length || anyInvalid) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await submitManualBatch({
        enteredBy: user?.name ?? user?.email ?? 'unknown',
        ts: when ? new Date(when).toISOString() : undefined,
        note: note.trim() || undefined,
        readings: filled.map(([sensorId, v]) => ({ sensorId, value: Number(v) })),
      });
      setResult(r);
      // Clear only what was actually stored. A row that failed keeps its value
      // on screen, so it can be corrected rather than typed again from memory.
      const kept: Record<string, string> = {};
      for (const row of r.results) {
        if (!row.ok && values[row.sensorId]) kept[row.sensorId] = values[row.sensorId];
      }
      setValues(kept);
      if (r.failed === 0) setNote('');
      refreshBatches();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Manual Entry"
              subtitle="Record a round of samples, or load a file of readings" />

      <div className="p-6 grid grid-cols-1 xl:grid-cols-[minmax(0,34rem)_1fr] gap-5 items-start">
        <div className="border border-slate-200 bg-white">
          <div className="flex border-b border-slate-200 bg-slate-100">
            {MODES.map(({ key, label, Icon }) => (
              <button
                key={key} type="button" onClick={() => setMode(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5',
                  'text-[10px] font-bold uppercase tracking-wider transition-colors',
                  mode === key
                    ? 'bg-white text-slate-800 border-b-2 border-slate-800 -mb-px'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {mode === 'sheet' && (
          <form onSubmit={submit}>
            <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-100">
              <Field label="Plant">
                <select value={plantId} onChange={(e) => setPlantId(e.target.value)}
                        className={INPUT}>
                  {(plants ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Sample taken">
                <input type="datetime-local" value={when}
                       onChange={(e) => setWhen(e.target.value)} className={INPUT} />
              </Field>
            </div>

            {/* One time for the whole sheet: these readings describe the same
                water, so they must share a timestamp to line up on a chart. */}
            <p className="px-4 pt-2 text-[11px] text-slate-400">
              {when
                ? 'All readings below are recorded at this time.'
                : 'Leave the time blank to record this round as now.'}
            </p>

            <div className="p-4 space-y-4 max-h-[26rem] overflow-y-auto">
              {groups.map(([location, list]) => (
                <div key={location}>
                  <p className="text-[10px] font-bold uppercase tracking-wider
                                text-slate-400 border-b border-slate-100 pb-1 mb-1.5">
                    {location}
                  </p>
                  <div className="space-y-1">
                    {(list ?? []).map((sn) => (
                      <Row key={sn.id} sensor={sn} value={values[sn.id] ?? ''}
                           onChange={(v) => setValues((p) => ({ ...p, [sn.id]: v }))} />
                    ))}
                  </div>
                </div>
              ))}
              {!loading && groups.length === 0 && (
                <p className="text-sm text-slate-400 py-6 text-center">
                  No manual parameters configured for this plant.
                </p>
              )}
            </div>

            <div className="p-4 pt-0 space-y-3">
              <Field label="Note (optional)">
                <input value={note} onChange={(e) => setNote(e.target.value)}
                       placeholder="e.g. daily composite" className={INPUT} />
              </Field>

              <button type="submit" disabled={busy || !filled.length || anyInvalid}
                      className="w-full h-9 text-xs font-bold uppercase tracking-wide
                                 bg-slate-800 text-white disabled:bg-slate-300
                                 disabled:cursor-not-allowed hover:bg-slate-900
                                 transition-colors">
                {busy ? 'Recording...'
                      : filled.length === 0 ? 'Enter a value'
                      : `Record ${filled.length} reading${filled.length === 1 ? '' : 's'}`}
              </button>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2 text-xs border-l-4
                                border-red-500 bg-red-50 text-red-900">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {result && (
                <div className={cn('border-l-4 px-3 py-2 text-xs space-y-1',
                  result.failed === 0 ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                      : 'border-amber-500 bg-amber-50 text-amber-900')}>
                  <div className="flex items-start gap-2 font-semibold">
                    {result.failed === 0
                      ? <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                    <span>
                      Recorded {result.recorded} of {result.submitted} at{' '}
                      {new Date(result.ts).toLocaleString()}
                    </span>
                  </div>
                  {result.results.filter((r) => !r.ok).map((r) => (
                    <p key={r.sensorId} className="pl-5">
                      {r.parameter ?? r.sensorId}: {r.error}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                Entries are attributed to <b>{user?.name ?? 'you'}</b> and kept
                alongside sensor readings, marked as manually entered.
              </p>
            </div>
          </form>
          )}

          {mode === 'file' && <UploadPanel plants={plants ?? null} onLoaded={refreshBatches} />}
        </div>

        {/* ── submissions ──────────────────────────────────────────────── */}
        <SubmissionLog batches={batches} loading={batchesLoading}
                       onChanged={refreshBatches} />
      </div>
    </div>
  );
}

/** Loading a file of readings, in the shape a gateway sends.
 *
 *  The form beside this takes one figure at a time, which suits a technician
 *  with a clipboard and does not suit a lab instrument that exports a hundred
 *  results at once. This takes the same JSON the gateways send, so a file off a
 *  SCADA export or an analyser needs no reformatting.
 *
 *  Dry run first, always. The report says what would be written and what would
 *  be rejected, before anything is.
 */
function UploadPanel({ plants, onLoaded }: {
  plants: { id: string; name: string }[] | null;
  onLoaded: () => void;
}) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [plant, setPlant] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<UploadResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(commit: boolean) {
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      setRes(await uploadReadings(file, {
        commit, plant: plant || undefined,
        enteredBy: user?.name ?? user?.email ?? 'upload',
      }));
      if (commit) onLoaded();
    } catch (e) {
      setErr((e as Error).message); setRes(null);
    } finally { setBusy(false); }
  }

  // Only offer to commit what a dry run has already been seen to accept.
  const canCommit = res !== null && !res.committed && res.accepted > 0;

  return (
      <div className="p-4 space-y-3.5">
        <Field label="File">
          <input
            type="file" accept=".json,.txt,.gz,application/json"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null); setRes(null); setErr(null);
            }}
            className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:border-0
                       file:text-[10px] file:font-bold file:uppercase file:tracking-wide
                       file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            The same JSON a gateway sends. Any of the formats the ingest reads.
          </p>
        </Field>

        <Field label="Plant">
          <select value={plant} onChange={(e) => setPlant(e.target.value)} className={INPUT}>
            <option value="">Take it from the gateway id in the file</option>
            {(plants ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {/* Tags are unique per plant, not globally: most integrators number
              from 1 at every site, so PH-1001 can exist at all six. */}
          <p className="text-[11px] text-slate-400 mt-1">
            Needed when the file carries no gateway id and the same tag exists
            at more than one plant.
          </p>
        </Field>

        <div className="flex gap-2">
          <button type="button" onClick={() => run(false)} disabled={!file || busy}
                  className="flex-1 h-9 text-xs font-bold uppercase tracking-wide border
                             border-slate-300 text-slate-700 hover:bg-slate-50
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {busy ? 'Checking...' : 'Check file'}
          </button>
          <button type="button" onClick={() => run(true)} disabled={!canCommit || busy}
                  className="flex-1 h-9 text-xs font-bold uppercase tracking-wide
                             bg-slate-800 text-white hover:bg-slate-900
                             disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">
            {res?.committed ? 'Loaded' : `Load${res ? ` ${res.accepted}` : ''}`}
          </button>
        </div>

        {err && (
          <div className="flex items-start gap-2 px-3 py-2 text-xs border-l-4
                          border-red-500 bg-red-50 text-red-900">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {res && (
          <div className={cn('border-l-4 px-3 py-2.5 text-xs space-y-2',
            res.committed ? 'border-emerald-500 bg-emerald-50'
                          : 'border-blue-500 bg-blue-50')}>
            <div className="font-semibold text-slate-800">
              {res.committed
                ? `Loaded ${res.written} reading${res.written === 1 ? '' : 's'}`
                : `${res.accepted} of ${res.parsed} readings would be loaded`}
              {res.plant && <span className="font-normal text-slate-500"> - {res.plant}</span>}
            </div>

            {/* Written can trail accepted: a reading already present for that
                sensor and time is left alone rather than overwritten. */}
            {res.committed && res.written < res.accepted && (
              <p className="text-slate-600">
                {res.accepted - res.written} already recorded, left unchanged.
              </p>
            )}

            {res.rejected > 0 && (
              <div className="space-y-1">
                <p className="font-semibold text-slate-700">{res.rejected} rejected</p>
                {Object.entries(res.reasons)
                  .filter(([k]) => k !== 'accepted')
                  .map(([reason, n]) => (
                    <p key={reason} className="text-slate-600 flex gap-2">
                      <span className="font-mono text-[11px] text-slate-500">{n}x</span>
                      <span>
                        {REASONS[reason] ?? reason}
                        {(res.rejectedTags[reason]?.length ?? 0) > 0 && (
                          <span className="text-slate-400">
                            {' '}- {res.rejectedTags[reason].join(', ')}
                          </span>
                        )}
                      </span>
                    </p>
                  ))}
              </div>
            )}

            {!res.committed && res.preview.length > 0 && (
              <div className="pt-1 border-t border-blue-200/60">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                  First few
                </p>
                {res.preview.slice(0, 5).map((p, i) => (
                  <p key={i} className="font-mono text-[11px] text-slate-600">
                    {p.sensorId} &middot; {p.value}
                    <span className={cn('ml-1 font-sans font-semibold',
                      p.status === 'critical' ? 'text-red-600'
                        : p.status === 'warning' ? 'text-amber-600' : 'text-emerald-700')}>
                      {p.status}
                    </span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <details className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <summary className="cursor-pointer font-semibold text-slate-600 flex items-center gap-1.5">
            <FileJson className="h-3 w-3" /> What the file must contain
          </summary>
          <pre className="mt-2 p-2.5 bg-slate-800 text-slate-100 overflow-x-auto
                          text-[10px] leading-relaxed">
{`{
  "gw": "GW-4472-P01",     // which gateway. Identifies the plant.
  "ts": 1786420800,        // epoch seconds, or ISO 8601
  "d": [
    { "t": "PH-1001",  "v": 17252, "q": 192 },
    { "t": "TUR-1003", "v":  7609, "q": 192 }
  ]
}`}
          </pre>
          <p className="mt-2">
            One entry per tag. <b>t</b> is the tag from the register map, and it
            carries the plant, the parameter, the unit and the range, so none of
            those are repeated here. <b>v</b> is the raw count. <b>q</b> is OPC
            quality: 192 good, 64 uncertain, 0 bad.
          </p>
        </details>
      </div>
  );
}

/** Rejection reasons, in words an operator can act on. */
const REASONS: Record<string, string> = {
  unmapped_tag: 'not in the register map',
  bad_quality: 'the source flagged the reading as bad',
  uncertain_quality: 'the source was unsure of the reading',
  sentinel: 'a placeholder value, not a measurement',
  out_of_span: 'outside the range the instrument can report',
};

/** One parameter on the sheet.
 *
 *  The expected range sits beside the field rather than behind a tooltip: a
 *  technician transcribing from a lab notebook is comparing, not exploring.
 */
function Row({ sensor, value, onChange }: {
  sensor: { id: string; parameter: string; unit: string;
            warnMin: number | null; warnMax: number | null;
            critMin: number | null; critMax: number | null;
            lastValue: number | null };
  value: string;
  onChange: (v: string) => void;
}) {
  const numeric = value.trim() === '' ? null : Number(value);
  const invalid = numeric !== null && Number.isNaN(numeric);

  // People type the unit along with the figure — "180 mg/L" — because the
  // label invites it. Requires a digit as well as a letter: "abc" is not a
  // number with a unit attached, it is not a number at all.
  const looksLikeUnit = invalid && /\d/.test(value) && /[a-zA-Z/%]/.test(value);

  // A band of 0 to 0 is not a range, it is a threshold of zero: coliform,
  // where any detection is a failure. Printing "0-0" reads as a bug.
  const zeroTolerance =
    sensor.warnMin === 0 && sensor.warnMax === 0 && sensor.critMax === 0;

  // Judged against the same band the API will apply, so a mistyped digit is
  // visible before submitting rather than after.
  const verdict = (() => {
    if (numeric === null || invalid || sensor.critMin === null) return null;
    if (numeric < sensor.critMin! || numeric > sensor.critMax!) return 'critical';
    if (numeric < sensor.warnMin! || numeric > sensor.warnMax!) return 'warning';
    return 'normal';
  })();

  return (
    <div className="grid grid-cols-[1fr_7.5rem] gap-2 items-center">
      <div className="min-w-0">
        <p className="text-sm text-slate-700 truncate">{sensor.parameter}</p>
        <p className="text-[10px] text-slate-400 truncate">
          {invalid
            ? <span className="text-red-600 font-semibold">
                {looksLikeUnit ? `Number only — unit is ${sensor.unit}` : 'Not a number'}
              </span>
            : verdict && verdict !== 'normal'
            ? <span className={cn('font-semibold',
                verdict === 'critical' ? 'text-red-600' : 'text-amber-600')}>
                Outside the {verdict === 'critical' ? 'critical' : 'normal'} range
              </span>
            : sensor.warnMax == null ? sensor.unit
            : zeroTolerance ? `${sensor.unit} · any detection is a failure`
            : `${sensor.unit} · expects ${sensor.warnMin}-${sensor.warnMax}`}
        </p>
      </div>
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        inputMode="decimal" placeholder="—"
        className={cn(
          'h-8 px-2 text-sm text-right font-mono tabular-nums border bg-white',
          'focus:outline-none focus:border-blue-500',
          invalid ? 'border-red-400'
            : verdict === 'critical' ? 'border-red-300 text-red-700'
            : verdict === 'warning' ? 'border-amber-300 text-amber-700'
            : 'border-slate-300')}
      />
    </div>
  );
}

/** Two ways a reading arrives that no gateway sent: typed, or in a file. */
const MODES = [
  { key: 'sheet' as const, label: 'Bench sheet', Icon: FlaskConical },
  { key: 'file'  as const, label: 'Upload file', Icon: Upload },
];

const INPUT = 'w-full h-9 px-3 text-sm border border-slate-300 bg-white '
            + 'focus:outline-none focus:border-blue-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
