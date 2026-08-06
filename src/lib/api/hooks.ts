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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Alert, Plant } from '@/types';
import {
  fetchAlertTrend, fetchAlerts, fetchAlertsHourly, fetchAllSensors, fetchHistory, fetchKpis,
  fetchPlants, fetchSensors,
  type AlertHour, type AlertTrendDay, type Kpis, type LiveAlert, type LiveSensor,
  type TrendPoint,
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


/**
 * Live alerts mapped into the app's `Alert` shape.
 *
 * Two fields have no source and are stated as such rather than invented:
 *   - `status` is always 'active'. Acknowledgement is a write, and there is
 *     no write path back to the plant, so nothing can move an alert out of
 *     'active' yet.
 *   - `duration` is unknown. Alarms are derived from the current reading, not
 *     from stored open/close events, so how long a breach has run is not
 *     recorded. The alerts table exists for this; nothing writes to it yet.
 */
export function useAlertsAsAppAlerts(pollMs = 60_000) {
  const { data, error, loading, refresh } = useAlerts(pollMs);
  const alerts = useMemo<Alert[]>(
    () => (data ?? []).map((a) => ({
      id: a.id,
      plantId: a.plantId,
      plantName: a.plantName,
      sensorId: a.sensorId,
      sensorName: a.sensorName,
      type: a.stage,
      severity: a.severity,
      message: a.message,
      value: a.value ?? 0,
      threshold: a.limit ?? 0,
      unit: a.unit,
      status: 'active',
      createdAt: a.timestamp,
    })),
    [data],
  );
  return { data: alerts, error, loading, refresh };
}

/** Breaches per day, counted from the hourly rollup. Replaces a chart built
 *  from Math.random() — which redrew differently on every render. */
export function useAlertTrend(days = 7) {
  return useResource<AlertTrendDay[]>((s) => fetchAlertTrend(days, s), [days]);
}

/** Every sensor across every plant. Fleet views only — no history is fetched. */
export function useAllSensors(pollMs = 60_000) {
  return useResource<LiveSensor[]>((s) => fetchAllSensors(s), [], pollMs);
}

/** Breaches per hour over the most recent 24h of data. */
export function useAlertsHourly(hours = 24) {
  return useResource<AlertHour[]>((s) => fetchAlertsHourly(hours, s), [hours]);
}
