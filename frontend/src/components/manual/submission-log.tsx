'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { editManualBatch, fetchBatchEdits,
         type ManualBatch, type BatchEdit } from '@/lib/api/client';
import {
  Clock, ChevronDown, ChevronRight, MoreVertical, Pencil, History,
} from 'lucide-react';

/**
 * Bench sheet submissions.
 *
 * One row per round, not per reading. A technician who recorded twelve results
 * performed one act; listing it twelve times makes it look like twelve, and
 * makes the round impossible to refer to or correct as a unit.
 *
 * Each carries a reference — BS-0042 — because "the eleven-fifteen submission"
 * is not something two people can reliably mean the same thing by.
 */
export function SubmissionLog({ batches, loading, onChanged }: {
  batches: ManualBatch[] | null;
  loading?: boolean;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  const rows = batches ?? [];

  return (
    <div className="border border-slate-200 bg-white">
      <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
          Recorded submissions
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <th className="text-left px-3 py-2 font-semibold w-8"></th>
            <th className="text-left px-2 py-2 font-semibold">Reference</th>
            <th className="text-left px-3 py-2 font-semibold">Plant</th>
            <th className="text-right px-3 py-2 font-semibold">Readings</th>
            <th className="text-left px-3 py-2 font-semibold">Sample time</th>
            <th className="text-left px-3 py-2 font-semibold">By</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <SubmissionRow
              key={b.id}
              batch={b}
              expanded={open === b.id}
              editing={editing === b.id}
              onToggle={() => setOpen(open === b.id ? null : b.id)}
              onEdit={() => { setEditing(b.id); setOpen(b.id); }}
              onDone={() => { setEditing(null); onChanged?.(); }}
              onCancel={() => setEditing(null)}
            />
          ))}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
              Nothing recorded yet
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SubmissionRow({ batch, expanded, editing, onToggle, onEdit, onDone, onCancel }: {
  batch: ManualBatch;
  expanded: boolean;
  editing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trail, setTrail] = useState<BatchEdit[] | null>(null);

  // Fetched only when the row is opened and only if it has corrections, so a
  // log of thirty submissions does not make thirty requests for nothing.
  useEffect(() => {
    if (!expanded || batch.edits === 0) return;
    let live = true;
    fetchBatchEdits(batch.id)
      .then((t) => { if (live) setTrail(t); })
      .catch(() => { if (live) setTrail([]); });
    return () => { live = false; };
  }, [expanded, batch.id, batch.edits]);

  function startEdit() {
    setValues(Object.fromEntries(batch.values.map((v) => [v.sensorId, String(v.value)])));
    setReason('');
    setError(null);
    setMenu(false);
    onEdit();
  }

  async function save() {
    // Only send what actually moved. An unchanged value would still be a row
    // in the edit trail, and a trail full of non-changes is unreadable.
    const changed = batch.values
      .filter((v) => values[v.sensorId] !== undefined
                  && Number(values[v.sensorId]) !== v.value
                  && values[v.sensorId].trim() !== ''
                  && !Number.isNaN(Number(values[v.sensorId])))
      .map((v) => ({ sensorId: v.sensorId, value: Number(values[v.sensorId]) }));

    if (changed.length === 0) { onCancel(); return; }

    setBusy(true);
    setError(null);
    try {
      await editManualBatch(batch.id, {
        editedBy: user?.name ?? user?.email ?? 'unknown',
        reason: reason.trim() || undefined,
        readings: changed,
      });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50/60">
        <td className="px-3 py-2">
          <button onClick={onToggle} className="text-slate-400 hover:text-slate-700">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" />
                      : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </td>
        <td className="px-2 py-2 font-mono text-xs text-slate-700">
          {batch.reference}
          {batch.edits > 0 && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px]
                             text-amber-700 bg-amber-100 px-1 py-0.5 rounded"
                  title={`Corrected ${batch.edits} time${batch.edits === 1 ? '' : 's'}`}>
              <History className="h-2.5 w-2.5" />
              {batch.edits}
            </span>
          )}
        </td>
        <td className="px-3 py-2 text-slate-600 text-xs">{batch.plantName}</td>
        <td className="px-3 py-2 text-right">
          <span className="font-mono text-xs text-slate-700">{batch.readings}</span>
          {batch.critical > 0 && (
            <span className="ml-1.5 text-[10px] font-semibold text-red-600">
              {batch.critical} crit
            </span>
          )}
          {batch.warning > 0 && (
            <span className="ml-1.5 text-[10px] font-semibold text-amber-600">
              {batch.warning} warn
            </span>
          )}
        </td>
        <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
          {new Date(batch.sampleTs).toLocaleString()}
        </td>
        <td className="px-3 py-2 text-xs text-slate-600">
          {batch.enteredBy}
          {/* Entered by one person, corrected by another, is the normal case —
              a supervisor fixing a technician's transcription. Both belong
              here, and which is which has to be unambiguous. */}
          {batch.lastEditedBy && (
            <span className="block text-[10px] text-amber-700">
              corrected by {batch.lastEditedBy}
              {batch.lastEditedAt && (
                <> · {new Date(batch.lastEditedAt).toLocaleString()}</>
              )}
            </span>
          )}
        </td>
        <td className="px-2 py-2 relative">
          <button onClick={() => setMenu(!menu)}
                  className="text-slate-400 hover:text-slate-700">
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
          {menu && (
            <>
              {/* Click-away, so the menu does not stay open behind the next one. */}
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute right-2 top-8 z-20 w-36 border border-slate-200
                              bg-white shadow-md">
                <button
                  onClick={startEdit}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs
                             text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-3 w-3" />
                  Correct values
                </button>
              </div>
            </>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50/70 border-b border-slate-100">
          <td colSpan={7} className="px-8 py-3">
            {batch.note && (
              <p className="text-[11px] text-slate-500 mb-2">Note: {batch.note}</p>
            )}
            <table className="w-full">
              <tbody>
                {batch.values.map((v) => (
                  <tr key={v.sensorId}>
                    <td className="py-1 text-xs text-slate-600 w-40">{v.parameter}</td>
                    <td className="py-1 text-[11px] text-slate-400">{v.location}</td>
                    <td className="py-1 text-right w-32">
                      {editing ? (
                        <input
                          value={values[v.sensorId] ?? ''}
                          onChange={(e) => setValues((p) => ({ ...p, [v.sensorId]: e.target.value }))}
                          inputMode="decimal"
                          className="h-7 w-24 px-2 text-right text-xs font-mono border
                                     border-slate-300 focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <span className={cn('font-mono text-xs font-semibold',
                          v.status === 'critical' ? 'text-red-600'
                          : v.status === 'warning' ? 'text-amber-600' : 'text-slate-700')}>
                          {v.value}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-1">{v.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {batch.edits > 0 && !editing && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider
                              text-amber-700 mb-1.5">
                  Corrections
                </p>
                {trail === null ? (
                  <p className="text-[11px] text-slate-400">Loading…</p>
                ) : trail.map((e, i) => (
                  <p key={i} className="text-[11px] text-slate-600">
                    {e.parameter} at {e.location}:{' '}
                    <span className="font-mono line-through text-slate-400">{e.from}</span>
                    {' → '}
                    <span className="font-mono font-semibold">{e.to}</span>
                    <span className="text-slate-400"> {e.unit}</span>
                    {' · '}{e.editedBy}
                    {' · '}{new Date(e.editedAt).toLocaleString()}
                    {e.reason && <span className="text-slate-500"> — {e.reason}</span>}
                  </p>
                ))}
              </div>
            )}

            {editing && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                <input
                  value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this being corrected? (optional)"
                  className="w-full h-8 px-2 text-xs border border-slate-300
                             focus:outline-none focus:border-blue-500"
                />
                {/* Said plainly: a correction is not a quiet overwrite. */}
                <p className="text-[10px] text-slate-400">
                  The previous value, who changed it and when are kept.
                </p>
                {error && <p className="text-[11px] text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={save} disabled={busy}
                          className="px-3 h-8 text-[10px] font-bold uppercase tracking-wide
                                     bg-slate-800 text-white hover:bg-slate-900
                                     disabled:bg-slate-300 transition-colors">
                    {busy ? 'Saving…' : 'Save correction'}
                  </button>
                  <button onClick={onCancel}
                          className="px-3 h-8 text-[10px] font-bold uppercase tracking-wide
                                     border border-slate-300 text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
