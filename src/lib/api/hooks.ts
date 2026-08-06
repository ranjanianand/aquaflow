'use client';

/**
 * Data hooks for the dashboard.
 *
 * Each returns `{ data, error, loading, refresh }` rather than throwing, so a
 * screen can show what it has alongside a clear failure notice. A monitoring
 * dashboard that renders nothing when the API is down is worse than one that
 * says "cannot reach the API" over the last known values — the operator needs
 * to know which of the two they are looking at.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Plant } from '@/types';
import {
  fetchAlerts, fetchHistory, fetchKpis, fetchPlants, fetchSensors,
  type Kpis, type LiveAlert, type LiveSensor, type TrendPoint,
} from './client';

interface State<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

/**
 * @param fn        the fetch, receiving an AbortSignal
 * @param deps      re-runs when these change
 * @param pollMs    optional background refresh; 0 disables it
 */
function useResource<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  pollMs = 0,
) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  // Keep the fetch out of the dependency array — an inline arrow would
  // otherwise be a new function each render and re-fetch forever.
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const ac = new AbortController();
    let alive = true;

    // Keep the previous data visible while refetching. Blanking the screen on
    // every poll makes a working dashboard look like it is failing.
    setState((s) => ({ ...s, loading: true }));

    fnRef.current(ac.signal)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((err: Error) => {
        if (err.name === 'AbortError' || !alive) return;
        setState((s) => ({ data: s.data, error: err, loading: false }));
      });

    return () => { alive = false; ac.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [pollMs, refresh]);

  return { ...state, refresh };
}

export function usePlants(pollMs = 0) {
  return useResource<Plant[]>((s) => fetchPlants(s), [], pollMs);
}

/**
 * @param pollMs  defaults to 60s. The prototype polled every 2 seconds against
 *   an in-memory array; against a real API on hourly data that is 1,800
 *   requests per reading, and none of them can show anything new.
 */
export function useSensors(plantId: string | null, historyHours = 24, pollMs = 60_000) {
  return useResource<LiveSensor[]>(
    (s) => (plantId ? fetchSensors(plantId, historyHours, s) : Promise.resolve([])),
    [plantId, historyHours],
    plantId ? pollMs : 0,
  );
}

export function useSensorHistory(sensorId: string | null, hours = 24) {
  return useResource<{ resolution: string; points: TrendPoint[] }>(
    (s) => (sensorId ? fetchHistory(sensorId, hours, s)
                     : Promise.resolve({ resolution: 'none', points: [] })),
    [sensorId, hours],
  );
}

export function useAlerts(pollMs = 60_000) {
  return useResource<LiveAlert[]>((s) => fetchAlerts(s), [], pollMs);
}

export function useKpis(pollMs = 60_000) {
  return useResource<Kpis>((s) => fetchKpis(s), [], pollMs);
}
