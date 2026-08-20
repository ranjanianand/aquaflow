'use client';

/**
 * Real trend series for the compare screen.
 *
 * The page previously built its charts from `Math.sin(seed) * 10000` — ninety
 * days of invented values on the one screen whose entire purpose is analysing
 * history. It looked plausible, which is what made it dangerous: nothing on
 * screen said the line was fabricated.
 *
 * These fetch from the readings database instead, and return an explicit
 * `loading` so the chart can say "loading" rather than briefly showing an
 * empty axis that reads as "no data".
 */
import { useEffect, useRef, useState } from 'react';
import { fetchHistory, type TrendPoint } from './client';

/** Recharts wants one flat object per x-axis tick. */
interface RowBase {
  time: string;
  date: string;
  timestamp: number;
}

/** Single-series rows always carry a value — nulls are filtered out. Kept as a
 *  separate type so the statistics below do not have to narrow it. */
export interface SeriesRow extends RowBase {
  value: number;
}

/** Multi-series rows are keyed by sensor id, and a sensor may be missing from
 *  a given tick if it was offline for that bucket. */
export interface ChartRow extends RowBase {
  [sensorId: string]: number | string | undefined;
}

const label = (d: Date, days: number) =>
  days <= 7
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

function toRows(points: TrendPoint[], days: number): SeriesRow[] {
  return points
    .filter((p) => p.value !== null)
    .map((p) => ({
      time: label(p.timestamp, days),
      date: p.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      timestamp: p.timestamp.getTime(),
      value: p.value as number,
    }));
}

export function useTrend(sensorId: string | null, days: number) {
  const [rows, setRows] = useState<SeriesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sensorId) { setRows([]); return; }
    const ac = new AbortController();
    setLoading(true);
    fetchHistory(sensorId, days * 24, ac.signal)
      .then((r) => { setRows(toRows(r.points, days)); setError(null); })
      .catch((e: Error) => { if (e.name !== 'AbortError') setError(e); })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [sensorId, days]);

  return { rows, loading, error };
}

/**
 * Several sensors on one set of axes.
 *
 * Series are aligned by timestamp rather than by array index. The sensors can
 * have different numbers of points — one may have been offline for a stretch —
 * and zipping by position would silently shift a whole series sideways in time.
 */
export function useTrendComparison(sensorIds: string[], days: number) {
  const [rows, setRows] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(false);
  const key = sensorIds.join(',');
  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    if (!sensorIds.length) { setRows([]); return; }
    const ac = new AbortController();
    setLoading(true);

    Promise.all(sensorIds.map((id) => fetchHistory(id, days * 24, ac.signal)))
      .then((results) => {
        const byTime = new Map<number, ChartRow>();
        results.forEach((res, i) => {
          const id = sensorIds[i];
          for (const p of res.points) {
            if (p.value === null) continue;
            const t = p.timestamp.getTime();
            let row = byTime.get(t);
            if (!row) {
              row = {
                time: label(p.timestamp, days),
                date: p.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                timestamp: t,
              };
              byTime.set(t, row);
            }
            row[id] = p.value;
          }
        });
        setRows([...byTime.values()].sort((a, b) => a.timestamp - b.timestamp));
      })
      .catch((e: Error) => { if (e.name !== 'AbortError') setRows([]); })
      .finally(() => setLoading(false));

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, days]);

  return { rows, loading };
}
