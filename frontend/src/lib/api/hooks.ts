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
  fetchAlertTrend, fetchAlerts, fetchAlertsHourly, fetchAllSensors, fetchHistory,
  fetchInsights, type InsightsData,
  fetchManualBatches, type ManualBatch,
  fetchAcknowledgements, type Acknowledgement,
  fetchAckHistory, type AckHistoryEntry,
  fetchAudit, fetchCompliance, fetchEnergy, fetchEquipment,
  fetchGateways, fetchKnowledge, fetchKpis, fetchLiveKpis,
  fetchManualReadings, fetchManualSensors, fetchUsers,
  fetchPlants, fetchSensors,
  type AlertHour, type AlertTrendDay, type Compliance, type Kpis, type LiveAlert,
  type LiveParam,
  type AppUser, type AuditEntry, type EnergyMeter, type Equipment,
  type KbArticle, type ManualReading, type ManualSensor,
  type LiveGateway,
  type LiveSensor,
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
export function useAlertTrend(days = 7, plant?: string) {
  return useResource<AlertTrendDay[]>(
    (s) => fetchAlertTrend(days, plant, s), [days, plant]);
}

/** Every sensor across every plant. Fleet views only — no history is fetched. */
export function useAllSensors(pollMs = 60_000) {
  return useResource<LiveSensor[]>((s) => fetchAllSensors(s), [], pollMs);
}

/** Breaches per hour over the most recent 24h of data. */
export function useAlertsHourly(hours = 24) {
  return useResource<AlertHour[]>((s) => fetchAlertsHourly(hours, s), [hours]);
}

/** Current average per parameter, for the plant-floor KPI strip. */
export function useLiveKpis(pollMs = 60_000) {
  return useResource<Record<string, LiveParam>>((s) => fetchLiveKpis(s), [], pollMs);
}

/** Share of readings within limits over the recent window. */
export function useCompliance(hours = 24) {
  return useResource<Compliance>((s) => fetchCompliance(hours, s), [hours]);
}

/** Gateways, with delivery status derived from files actually received. */
export function useGateways(pollMs = 60_000) {
  return useResource<LiveGateway[]>((s) => fetchGateways(s), [], pollMs);
}

/** Consumption per motor control centre, from counter differences. */
export function useEnergy(hours = 24) {
  return useResource<{ meters: EnergyMeter[]; totalKwh: number | null; hours: number }>(
    (s) => fetchEnergy(hours, s), [hours]);
}

/** Bench sheet submissions, newest first. */
export function useManualBatches(limit = 30) {
  return useResource<ManualBatch[]>((s) => fetchManualBatches(limit, s), [limit]);
}

/** Every acknowledgement, for the history view. */
export function useAckHistory(limit = 50) {
  return useResource<AckHistoryEntry[]>((s) => fetchAckHistory(limit, s), [limit]);
}

/** Who has acknowledged which insight. */
export function useAcknowledgements() {
  return useResource<Record<string, Acknowledgement>>((s) => fetchAcknowledgements(s), []);
}

/** Breach rates, silent instruments and held values, counted from readings. */
export function useInsights(days = 30, plant?: string) {
  return useResource<InsightsData | null>(
    (s) => fetchInsights(days, plant, s), [days, plant]);
}

/** Pumps, blowers and valves, assembled from their run/fault/hours tags. */
export function useEquipment(pollMs = 60_000) {
  return useResource<Equipment[]>((s) => fetchEquipment(s), [], pollMs);
}

/** What the ingest did — the only audit trail this system can honestly keep. */
export function useAudit(limit = 100) {
  return useResource<AuditEntry[]>((s) => fetchAudit(limit, s), [limit]);
}

/** Accounts on this system. Ours to manage, not the client's to supply. */
export function useUsers() {
  return useResource<AppUser[]>((s) => fetchUsers(s), []);
}

/** Procedures and troubleshooting notes. */
export function useKnowledge(search?: string) {
  return useResource<KbArticle[]>((s) => fetchKnowledge(search, s), [search]);
}

/** Parameters that accept a hand-entered reading. */
export function useManualSensors(plant?: string) {
  return useResource<ManualSensor[]>((s) => fetchManualSensors(plant, s), [plant]);
}

/** The entry log — what has been recorded by hand, newest first. */
export function useManualReadings(limit = 50) {
  return useResource<ManualReading[]>((s) => fetchManualReadings(limit, s), [limit]);
}
