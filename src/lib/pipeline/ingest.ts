import { SensorType } from '@/types';
import { resolveThresholds, plausibleBand, evaluate } from '@/lib/thresholds';
import { lookupTag, EQUIPMENT_TAGS } from './tag-map';
import {
  IngestResult,
  RawPayload,
  RawReading,
  TracedReading,
  TransformName,
} from './types';

/** Canonical unit per parameter. Everything is stored in these. */
const CANONICAL_UNIT: Record<SensorType, string> = {
  pH: 'pH',
  flow: 'm³/h',
  pressure: 'bar',
  temperature: '°C',
  turbidity: 'NTU',
  chlorine: 'mg/L',
  DO: 'mg/L',
  level: '%',
  conductivity: 'µS/cm',
  ORP: 'mV',
};

/**
 * Unit conversions.
 *
 * Three of these change nothing but the label — gateways routinely cannot
 * emit UTF-8, so µS/cm arrives as "uS/cm" and m³/h as "m3/h". One of them
 * changes the magnitude, and getting it wrong produces a false critical.
 */
const TRANSFORMS: Record<TransformName, (v: number) => number> = {
  identity: (v) => v,
  ppb_to_mg_l: (v) => v / 1000,
  ug_l_to_mg_l: (v) => v / 1000,
  celsius: (v) => v,
  siemens: (v) => v,
  cubic_metres: (v) => v,
};

/**
 * Values a device sends to mean "I have nothing to report".
 * Stored naively these destroy every average and chart axis downstream.
 */
const SENTINELS = new Set([-9999, -999, 9999, 32767, -32768, 3.4e38]);

function isSentinel(v: number): boolean {
  return SENTINELS.has(v) || !Number.isFinite(v);
}

function qualityOf(q: number): 'good' | 'uncertain' | 'bad' {
  if (q >= 192) return 'good';
  if (q >= 64) return 'uncertain';
  return 'bad';
}

/** Walk the envelope and list every scalar field that carries no measurement. */
function collectDroppedFields(payload: RawPayload): string[] {
  const dropped: string[] = [];

  const walk = (obj: unknown, prefix: string) => {
    if (obj === null || typeof obj !== 'object') return;
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        walk(v, path);
      } else {
        dropped.push(path);
      }
    }
  };

  for (const key of ['messageId', 'schemaVersion'] as const) {
    if (payload[key] !== undefined) dropped.push(key);
  }
  if (payload.gateway) walk(payload.gateway, 'gateway');
  if (payload.diagnostics) walk(payload.diagnostics, 'diagnostics');
  if (payload.site) {
    for (const k of Object.keys(payload.site)) {
      // plant_code is used to resolve the plant, then itself discarded
      if (k !== 'plant_code') dropped.push(`site.${k}`);
    }
  }
  return dropped;
}

function traceOne(
  raw: RawReading,
  sourceSystem: string,
  fallbackTs: string
): TracedReading {
  const quality = qualityOf(raw.q);
  const timestampInherited = !raw.ts;
  const timestamp = raw.ts ?? fallbackTs;

  const base: TracedReading = {
    raw,
    timestamp,
    timestampInherited,
    mapped: false,
    quality,
    outcome: 'unmapped',
  };

  // Equipment and alarm bits: real signals, but not water quality.
  if (EQUIPMENT_TAGS.has(raw.tag)) {
    return {
      ...base,
      mapped: true,
      location: raw.loc,
      canonicalValue: raw.v,
      canonicalUnit: raw.u,
      outcome: 'equipment',
      note:
        raw.tag === 'ALM_HI_TURB'
          ? "The plant's own high-turbidity bit. Stored as corroboration for the computed alarm."
          : 'Equipment state — stored separately from water quality readings.',
    };
  }

  // Gate 1 — is anything claiming this field?
  const entry = lookupTag(sourceSystem, raw.tag);
  if (!entry) {
    return {
      ...base,
      outcome: 'unmapped',
      reason: 'unmapped',
      note: 'No mapping row. Counted for review, never stored.',
    };
  }
  if (!entry.active) {
    return {
      ...base,
      mapped: true,
      sensorId: entry.sensorId,
      parameter: entry.parameter,
      location: entry.location,
      outcome: 'rejected',
      reason: 'inactive',
      note: 'Mapping row is switched off.',
    };
  }

  const mapped: TracedReading = {
    ...base,
    mapped: true,
    sensorId: entry.sensorId,
    parameter: entry.parameter,
    location: entry.location,
  };

  // Gate 2 — sentinel values before anything else, so they never reach a chart
  if (isSentinel(raw.v)) {
    return {
      ...mapped,
      outcome: 'rejected',
      reason: 'sentinel_value',
      note: `${raw.v} is an offline marker, not a measurement. Quarantined with its reason.`,
    };
  }
  if (quality === 'bad') {
    return {
      ...mapped,
      outcome: 'rejected',
      reason: 'bad_quality',
      note: `Quality code ${raw.q} means the device could not vouch for this value.`,
    };
  }

  // Gate 3 — normalise units
  const canonicalUnit = CANONICAL_UNIT[entry.parameter];
  const toValue = parseFloat(TRANSFORMS[entry.transform](raw.v).toFixed(4));
  const unitChanged = raw.u !== canonicalUnit;

  const converted: TracedReading = {
    ...mapped,
    canonicalValue: toValue,
    canonicalUnit,
    conversion: unitChanged
      ? {
          from: raw.u,
          to: canonicalUnit,
          fromValue: raw.v,
          toValue,
          transform: entry.transform,
        }
      : undefined,
  };

  // Gate 4 — plausibility, then the sensor's own operating band
  const plausible = plausibleBand(entry.parameter);
  if (toValue < plausible.critMin * 0.5 || toValue > plausible.critMax * 2) {
    return {
      ...converted,
      outcome: 'rejected',
      reason: 'out_of_plausible_range',
      note: 'Outside anything physically possible for this parameter — treat as a faulty probe.',
    };
  }

  const band = resolveThresholds(entry.parameter, entry.location);
  const status = evaluate(toValue, band);

  return {
    ...converted,
    band,
    status,
    outcome: 'stored',
    note:
      quality === 'uncertain'
        ? 'Stored, but flagged uncertain — excluded from averages and alarm evaluation.'
        : undefined,
  };
}

/**
 * Run a raw gateway payload through the pipeline and return the full decision
 * trail. This is the same sequence the Python consumer performs; keeping it
 * here lets the UI show the reasoning rather than only the result.
 */
export function ingest(
  payload: RawPayload,
  opts: { sourceSystem?: string; sourceUri?: string } = {}
): IngestResult {
  const sourceSystem = opts.sourceSystem ?? 'gw_wtp01';
  const fallbackTs = payload.publishedAt ?? new Date().toISOString();

  const droppedFields = collectDroppedFields(payload);
  const traced = payload.readings.map((r) => traceOne(r, sourceSystem, fallbackTs));

  const alarms: IngestResult['alarms'] = [];
  for (const t of traced) {
    if (
      t.outcome !== 'stored' ||
      !t.band ||
      t.canonicalValue === undefined ||
      t.quality !== 'good' ||
      t.status === 'normal' ||
      !t.status
    ) {
      continue;
    }
    const isCritical = t.status === 'critical';
    const limit = isCritical ? t.band.critMax : t.band.warnMax;
    alarms.push({
      sensorId: t.sensorId!,
      tag: t.raw.tag,
      location: t.location,
      value: t.canonicalValue,
      unit: t.canonicalUnit ?? '',
      limit,
      severity: isCritical ? 'critical' : 'warning',
      message: `${t.canonicalValue} ${t.canonicalUnit} exceeds ${
        isCritical ? 'critical' : 'warning'
      } limit of ${limit} at ${t.location}`,
    });
  }

  const counts = {
    readingsIn: payload.readings.length,
    stored: traced.filter((t) => t.outcome === 'stored').length,
    equipment: traced.filter((t) => t.outcome === 'equipment').length,
    rejected: traced.filter((t) => t.outcome === 'rejected').length,
    unmapped: traced.filter((t) => t.outcome === 'unmapped').length,
    fieldsDropped: droppedFields.length,
    conversions: traced.filter((t) => t.conversion).length,
    alarms: alarms.length,
  };

  return {
    sourceUri:
      opts.sourceUri ??
      's3://mwts-raw/raw/plant_id=P01/dt=2026-07-31/hh=14/wtp01_142301.json',
    plantCode: payload.site?.plant_code,
    plantName: payload.site?.plant_name,
    publishedAt: payload.publishedAt,
    receivedAt: new Date().toISOString(),
    droppedFields,
    traced,
    counts,
    alarms,
  };
}
