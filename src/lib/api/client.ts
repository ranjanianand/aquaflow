/**
 * Client for the readings API.
 *
 * The API returns the shapes `@/types` already declares, so components are
 * unchanged — only where their data comes from. Two things need fixing on the
 * way in:
 *
 *   - JSON has no Date type. Timestamps arrive as ISO strings and every
 *     component calls `.getTime()` on them, so they are revived here rather
 *     than guarded at each call site.
 *   - `history` can be absent. The mock data always had 24 points, so the
 *     components assume it exists; a sensor with no readings yet would
 *     otherwise crash the grid on `sensor.history.slice()`.
 */
import type { Plant, Sensor, SensorReading } from '@/types';

/** Prefer 127.0.0.1 over localhost: on Windows, localhost resolves to ::1
 *  first and each request stalls ~2s before falling back to IPv4. */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (cause) {
    // A failed fetch is almost always "the API is not running". Say that,
    // rather than surfacing the browser's generic "Failed to fetch".
    if ((cause as Error)?.name === 'AbortError') throw cause;
    throw new ApiError(
      `Cannot reach the readings API at ${BASE}. Is it running?`,
      0,
      url,
    );
  }
  if (!res.ok) {
    throw new ApiError(`${res.status} ${res.statusText}`, res.status, url);
  }
  return res.json() as Promise<T>;
}

/** ISO string -> Date, tolerating null. */
const date = (v: string | null | undefined): Date =>
  v ? new Date(v) : new Date(0);

const reading = (r: { timestamp: string; value: number | null }): SensorReading => ({
  timestamp: date(r.timestamp),
  value: r.value ?? 0,
});

export async function fetchPlants(signal?: AbortSignal): Promise<Plant[]> {
  const raw = await get<Array<Omit<Plant, 'lastUpdated'> & { lastUpdated: string | null }>>(
    '/plants',
    signal,
  );
  return raw.map((p) => ({ ...p, lastUpdated: date(p.lastUpdated) }));
}

/** A sensor as the API sends it, plus the two fields the mock data never had. */
type ApiSensor = Omit<Sensor, 'lastUpdated' | 'history'> & {
  lastUpdated: string | null;
  history?: Array<{ timestamp: string; value: number | null }> | null;
  /** Where in the treatment train this sits — decides which limit applies. */
  stage?: 'raw' | 'treatment' | 'filtered' | 'final';
  /** OPC quality of the underlying reading. */
  quality?: 'good' | 'uncertain' | 'bad';
};

export type LiveSensor = Sensor & {
  stage?: ApiSensor['stage'];
  quality?: ApiSensor['quality'];
};

export async function fetchSensors(
  plantId: string,
  historyHours = 24,
  signal?: AbortSignal,
): Promise<LiveSensor[]> {
  const raw = await get<ApiSensor[]>(
    `/plants/${encodeURIComponent(plantId)}/sensors?history_hours=${historyHours}`,
    signal,
  );
  return raw.map((s) => ({
    ...s,
    lastUpdated: date(s.lastUpdated),
    history: (s.history ?? []).map(reading),
  }));
}

/** Every configured sensor, all plants, no history. For fleet views. */
export async function fetchAllSensors(signal?: AbortSignal): Promise<LiveSensor[]> {
  const raw = await get<ApiSensor[]>('/sensors', signal);
  return raw.map((s) => ({
    ...s,
    lastUpdated: date(s.lastUpdated),
    history: (s.history ?? []).map(reading),
  }));
}

export interface TrendPoint {
  timestamp: Date;
  value: number | null;
  min: number | null;
  max: number | null;
}

export async function fetchHistory(
  sensorId: string,
  hours = 24,
  signal?: AbortSignal,
): Promise<{ resolution: string; points: TrendPoint[] }> {
  const raw = await get<{
    resolution: string;
    points: Array<{ timestamp: string; value: number | null; min: number | null; max: number | null }>;
  }>(`/sensors/${encodeURIComponent(sensorId)}/history?hours=${hours}`, signal);
  return {
    resolution: raw.resolution,
    points: raw.points.map((p) => ({ ...p, timestamp: date(p.timestamp) })),
  };
}

export interface LiveAlert {
  id: string;
  plantId: string;
  /** Human name, e.g. "Chennai WTP-01". The banner shows this, not the id. */
  plantName: string;
  sensorId: string;
  sensorName: string;
  tag: string;
  severity: 'critical' | 'warning';
  status: 'active';
  message: string;
  value: number | null;
  limit: number | null;
  unit: string;
  stage: string;
  timestamp: Date;
}

export async function fetchAlerts(signal?: AbortSignal): Promise<LiveAlert[]> {
  const raw = await get<Array<Omit<LiveAlert, 'timestamp'> & { timestamp: string | null }>>(
    '/alerts',
    signal,
  );
  return raw.map((a) => ({ ...a, timestamp: date(a.timestamp) }));
}

export interface Kpis {
  plantsTotal: number;
  plantsOnline: number;
  sensorsTotal: number;
  alertsCritical: number;
  alertsWarning: number;
  /** Volume treated over the last 24h of data, m3, integrated from the outlet
   *  flow meter. null means no such meter is mapped — which is not zero. */
  volume24h: number | null;
  /** Which meter the volume came from, e.g. "FLW-1005". Shown on the tile: a
   *  volume with no stated source cannot be checked, and choosing the meter is
   *  a judgement about plant layout rather than a direct reading. */
  volumeSource: string | null;
  /** When data last arrived. Shown so the dashboard cannot imply it is live
   *  when the most recent reading is days old. */
  lastIngest: Date | null;
  lastIngestRows: number;
  lastIngestReconciled: boolean | null;
}

export async function fetchKpis(signal?: AbortSignal): Promise<Kpis> {
  const raw = await get<Omit<Kpis, 'lastIngest'> & { lastIngest: string | null }>(
    '/kpis',
    signal,
  );
  return { ...raw, lastIngest: raw.lastIngest ? new Date(raw.lastIngest) : null };
}

export interface AlertTrendDay {
  date: string;
  critical: number;
  warning: number;
  alerts: number;
  sensors: number;
}

export async function fetchAlertTrend(
  days = 7, plant?: string, signal?: AbortSignal,
): Promise<AlertTrendDay[]> {
  const scope = plant ? `&plant=${encodeURIComponent(plant)}` : '';
  return get<AlertTrendDay[]>(`/alerts/trend?days=${days}${scope}`, signal);
}

export interface AlertHour {
  hour: string;
  timestamp: string;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export async function fetchAlertsHourly(hours = 24, signal?: AbortSignal): Promise<AlertHour[]> {
  return get<AlertHour[]>(`/alerts/hourly?hours=${hours}`, signal);
}

/** Current average per parameter, across every reporting sensor. */
export interface LiveParam {
  value: number;
  unit: string;
  sensors: number;
  status: 'normal' | 'warning';
}

export async function fetchLiveKpis(signal?: AbortSignal): Promise<Record<string, LiveParam>> {
  return get<Record<string, LiveParam>>('/kpis/live', signal);
}

export interface Compliance {
  /** Share of readings inside their alarm band. Not a Water Quality Index —
   *  that needs a definition (which parameters, what weighting, whose
   *  standard) that nobody has agreed. This means exactly what it says. */
  compliancePct: number | null;
  readings: number;
  inRange: number;
  parameters: string[];
}

export async function fetchCompliance(hours = 24, signal?: AbortSignal): Promise<Compliance> {
  return get<Compliance>(`/kpis/quality?hours=${hours}`, signal);
}

export interface LiveGateway {
  id: string;
  plantId: string;
  plantName: string;
  model: string;
  countRange: [number, number];
  qualityFamily: string;
  sendsScaled: boolean;
  filesReceived: number;
  lastFile: string | null;
  status: 'online' | 'stale' | 'offline';
  lastSeq: number | null;
  /** Files the gateway produced that never arrived. A gap here is the one
   *  delivery failure that leaves no error anywhere. */
  seqGaps: number;
}

export async function fetchGateways(signal?: AbortSignal): Promise<LiveGateway[]> {
  return get<LiveGateway[]>('/gateways', signal);
}

export interface EnergyMeter {
  id: string; tag: string; location: string;
  plantId: string; plantName: string;
  /** Consumption over the window, from counter differences — not the total. */
  kwh: number | null;
  lifetimeKwh: number;
  currentKw: number | null;
  readings: number;
}

export async function fetchEnergy(hours = 24, signal?: AbortSignal) {
  return get<{ meters: EnergyMeter[]; totalKwh: number | null; hours: number }>(
    `/energy?hours=${hours}`, signal);
}

export interface Equipment {
  id: string; name: string; plantId: string; plantName: string;
  stage: string; kind: 'pump' | 'blower' | 'valve';
  running: boolean | null; fault: boolean | null;
  runHours: number | null; startCount: number | null;
  valveOpen: boolean | null; valveClosed: boolean | null;
  lastSeen: string | null;
  health: 'ok' | 'due' | 'fault';
  note: string | null;
}

export async function fetchEquipment(signal?: AbortSignal) {
  return get<Equipment[]>('/equipment', signal);
}

export interface AuditEntry {
  id: string; action: string;
  startedAt: string | null; finishedAt: string | null;
  durationSeconds: number | null;
  filesSeen: number; filesSkipped: number;
  readingsIn: number; readingsOut: number; dropped: number;
  reconciled: boolean | null;
  error: string | null;
  rejections: Record<string, number>;
  outcome: 'ok' | 'no-op' | 'failed' | 'error';
}

export async function fetchAudit(limit = 100, signal?: AbortSignal) {
  return get<AuditEntry[]>(`/audit?limit=${limit}`, signal);
}

export interface AppUser {
  id: string; email: string; name: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  status: 'active' | 'inactive';
  /** Empty means every plant — a fleet role rather than a site one. */
  plants: string[];
  lastLogin: string | null;
  createdAt: string;
  /** False until real authentication lands. An account nobody can sign into
   *  is worth showing as exactly that. */
  canSignIn: boolean;
}

export async function fetchUsers(signal?: AbortSignal) {
  return get<AppUser[]>('/users', signal);
}

export interface KbArticle {
  id: string; title: string; category: string; tags: string[];
  plantCode: string | null; author: string | null;
  updatedAt: string; excerpt: string;
}

export async function fetchKnowledge(search?: string, signal?: AbortSignal) {
  const qs = search ? `?q=${encodeURIComponent(search)}` : '';
  return get<KbArticle[]>(`/knowledge${qs}`, signal);
}

export interface ManualSensor {
  id: string; tag: string; parameter: string; unit: string;
  location: string; stage: string; plantId: string; plantName: string;
  warnMin: number | null; warnMax: number | null;
  critMin: number | null; critMax: number | null;
  lastReading: string | null; lastValue: number | null;
}

export async function fetchManualSensors(plant?: string, signal?: AbortSignal) {
  const qs = plant ? `?plant=${encodeURIComponent(plant)}` : '';
  return get<ManualSensor[]>(`/manual/sensors${qs}`, signal);
}

export interface ManualReading {
  sensorId: string; tag: string; parameter: string; unit: string;
  location: string; plantName: string; ts: string; value: number;
  status: 'normal' | 'warning' | 'critical';
  enteredBy: string; enteredAt: string | null; note: string | null;
}

export async function fetchManualReadings(limit = 50, signal?: AbortSignal) {
  return get<ManualReading[]>(`/manual/readings?limit=${limit}`, signal);
}

/** The one write this API accepts. It records a measurement in our database —
 *  it does not send anything to the plant. */
export async function submitManualReading(body: {
  sensorId: string; value: number; enteredBy: string;
  ts?: string; note?: string;
}): Promise<{ status: string; value: number; parameter: string; unit: string }> {
  const res = await fetch(`${BASE}/manual/readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // The API explains why in `detail`. Surfacing that verbatim is more use
    // than "request failed" — it says which rule the entry broke.
    throw new ApiError(data.detail ?? `${res.status} ${res.statusText}`,
                       res.status, `${BASE}/manual/readings`);
  }
  return data;
}

export interface UploadResult {
  filename: string;
  plant: string | null;
  committed: boolean;
  parsed: number;
  accepted: number;
  written: number;
  rejected: number;
  reasons: Record<string, number>;
  rejectedTags: Record<string, string[]>;
  preview: { sensorId: string; ts: string; value: number; status: string }[];
}

/** Load readings from a file, in any of the gateway formats the ingest reads.
 *
 *  Dry run unless `commit` is true — the moment to discover a file is wrong is
 *  before it is in the database. */
export async function uploadReadings(
  file: File, opts: { commit?: boolean; plant?: string; enteredBy?: string } = {},
): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  const qs = new URLSearchParams({
    commit: String(opts.commit ?? false),
    ...(opts.plant ? { plant: opts.plant } : {}),
    ...(opts.enteredBy ? { entered_by: opts.enteredBy } : {}),
  });
  const res = await fetch(`${BASE}/upload/readings?${qs}`, { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.detail ?? `${res.status} ${res.statusText}`,
                       res.status, `${BASE}/upload/readings`);
  }
  return data;
}

export interface BatchRow {
  sensorId: string;
  ok: boolean;
  error?: string;
  value?: number;
  status?: string;
  parameter?: string;
  unit?: string;
  location?: string;
}

export interface BatchResult {
  ts: string;
  submitted: number;
  recorded: number;
  failed: number;
  results: BatchRow[];
}

/** Record a round of samples: one sample time, many parameters. */
export async function submitManualBatch(body: {
  enteredBy: string;
  ts?: string;
  note?: string;
  readings: { sensorId: string; value: number }[];
}): Promise<BatchResult> {
  const res = await fetch(`${BASE}/manual/readings/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.detail ?? `${res.status} ${res.statusText}`,
                       res.status, `${BASE}/manual/readings/batch`);
  }
  return data;
}

export interface InsightParameter {
  parameter: string; stage: string; samples: number; critical: number;
  warning: number; sensors: number; plants: number; breachPct: number;
}
export interface InsightSensor {
  id: string; tag: string; parameter: string; location: string; stage: string;
  unit: string; plantId: string; plantName: string; samples: number;
  critical: number; warning: number; avgValue: number; breachPct: number;
  warnMin: number | null; warnMax: number | null;
  critMin: number | null; critMax: number | null;
}
export interface InsightsData {
  days: number;
  parameters: InsightParameter[];
  sensors: InsightSensor[];
  coverage: {
    total: number; never: number; stopped: number; reporting: number;
    byPlant: { plantId: string; plantName: string; never: number; stopped: number;
               configured: number; gatewayId: string | null; gatewayFiles: number;
               gatewayLastFile: string | null }[];
    examples: { id: string; tag: string; parameter: string; location: string;
                plantId: string; plantName: string; lastSeen: string | null }[];
  };
  flatlined: { id: string; tag: string; parameter: string; location: string;
               unit: string; plantId: string; plantName: string;
               flatHours: number; stuckAt: number }[];
  rejected: { reason: string; count: number }[];
  removal: { plantId: string; plantName: string; parameter: string; unit: string;
             rawAvg: number; finalAvg: number; removalPct: number;
             samples: number }[];
}

/** Analytics over sensor data. Observations only — nothing is modelled. */
export async function fetchInsights(days = 30, plant?: string, signal?: AbortSignal) {
  const qs = new URLSearchParams({ days: String(days), ...(plant ? { plant } : {}) });
  return get<InsightsData>(`/insights?${qs}`, signal);
}

export interface Acknowledgement {
  acknowledgedBy: string;
  acknowledgedAt: string;
  note: string | null;
}

/** Current acknowledgement per insight id. */
export async function fetchAcknowledgements(signal?: AbortSignal) {
  return get<Record<string, Acknowledgement>>('/insights/acknowledgements', signal);
}

/** Record that somebody has read an insight. Changes nothing at the plant. */
export async function acknowledgeInsight(body: {
  insightId: string; acknowledgedBy: string; note?: string;
}): Promise<Acknowledgement & { insightId: string }> {
  const res = await fetch(`${BASE}/insights/acknowledgements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.detail ?? `${res.status} ${res.statusText}`,
                       res.status, `${BASE}/insights/acknowledgements`);
  }
  return data;
}

export interface BatchValue {
  sensorId: string; parameter: string; location: string;
  unit: string; value: number; status: string;
}

export interface ManualBatch {
  id: number;
  /** Human reference, e.g. "BS-0042" — readable over a radio. */
  reference: string;
  plantId: string; plantName: string;
  sampleTs: string; enteredBy: string; enteredAt: string;
  note: string | null;
  readings: number; critical: number; warning: number; edits: number;
  lastEditedBy: string | null;
  lastEditedAt: string | null;
  values: BatchValue[];
}

export async function fetchManualBatches(limit = 30, signal?: AbortSignal) {
  return get<ManualBatch[]>(`/manual/batches?limit=${limit}`, signal);
}

export interface BatchEdit {
  sensorId: string; parameter: string; location: string; unit: string;
  from: number; to: number; editedBy: string; editedAt: string;
  reason: string | null;
}

export async function fetchBatchEdits(batchId: number, signal?: AbortSignal) {
  return get<BatchEdit[]>(`/manual/batches/${batchId}/edits`, signal);
}

/** Correct values in a submission. Every change is recorded. */
export async function editManualBatch(batchId: number, body: {
  editedBy: string; reason?: string;
  readings: { sensorId: string; value: number }[];
}): Promise<{ batchId: number; updated: number; results: BatchRow[] }> {
  const res = await fetch(`${BASE}/manual/batches/${batchId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.detail ?? `${res.status} ${res.statusText}`,
                       res.status, `${BASE}/manual/batches/${batchId}`);
  }
  return data;
}

export interface AckHistoryEntry {
  id: number; insightId: string; kind: string; subject: string;
  plantName: string | null; acknowledgedBy: string; acknowledgedAt: string;
  note: string | null;
}

/** Every acknowledgement, newest first. */
export async function fetchAckHistory(limit = 50, signal?: AbortSignal) {
  return get<AckHistoryEntry[]>(`/insights/acknowledgements/history?limit=${limit}`, signal);
}
