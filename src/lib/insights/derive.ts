import type { InsightsData } from '@/lib/api/client';

/**
 * Observations derived from readings.
 *
 * These are not recommendations. Nothing here says "set the dose to 2.2 mg/L" —
 * that needs a process model, and a dashboard that guesses at one gets believed
 * by whoever is on shift. What the data supports is narrower and more useful:
 * this instrument is outside its limit, this one stopped sending, this one has
 * not moved in two days.
 *
 * Each carries the sensor it came from, so the drill-down opens the actual
 * readings rather than something matched by unit.
 */
export type ObservationKind = 'breach' | 'silent' | 'stuck';

export interface Observation {
  id: string;
  kind: ObservationKind;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  /** The instrument this is about. Null only when nothing has ever reported. */
  sensorId: string | null;
  plantId: string;
  plantName: string;
  location: string;
  parameter: string;
  unit: string;
  /** What it reads, and the limit it is being judged against. Both null for a
   *  silent instrument, which by definition has no value. */
  value: number | null;
  limit: number | null;
  limitLabel: string;
  /** Supporting figure — breach rate, hours silent, hours held. */
  detail: string;
  observedAt: Date;
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

export function deriveObservations(
  data: InsightsData | null,
  now: Date = new Date(),
): Observation[] {
  if (!data) return [];
  const out: Observation[] = [];

  // ── outside limits ─────────────────────────────────────────────────────
  for (const s of data.sensors) {
    // Which limit it broke. Critical readings are judged against the critical
    // band; warning-only against the warning band. Quoting the tighter limit
    // when the reading blew through the wider one understates the problem.
    const breachedCritical = s.critical > 0;
    const upper = breachedCritical ? s.critMax : s.warnMax;
    const lower = breachedCritical ? s.critMin : s.warnMin;
    const above = upper != null && s.avgValue > upper;
    const limit = above ? upper : lower;

    const hasLimit = limit != null;

    out.push({
      id: `breach:${s.id}`,
      kind: 'breach',
      priority: breachedCritical ? 'high' : 'medium',
      title: hasLimit
        ? `${s.parameter} ${above ? 'above' : 'below'} limit at ${s.location}`
        : `${s.parameter} reported at ${s.location}`,
      description: hasLimit
        ? `Averaged ${s.avgValue} ${s.unit} over ${s.samples.toLocaleString()} readings, ` +
          `against a ${breachedCritical ? 'critical' : 'normal'} limit of ${limit} ${s.unit}. ` +
          `${s.breachPct}% of readings were outside the band.`
        : `Flagged on ${s.breachPct}% of ${s.samples.toLocaleString()} readings. ` +
          `This is a status bit rather than a measurement, so there is no ` +
          `numeric limit to compare against.`,
      sensorId: s.id,
      plantId: s.plantId,
      plantName: s.plantName,
      location: s.location,
      parameter: s.parameter,
      unit: s.unit,
      value: s.avgValue,
      limit: limit ?? null,
      limitLabel: hasLimit
        ? (breachedCritical ? 'Critical limit' : 'Normal limit') : '',
      detail: `${s.breachPct}% of ${s.samples.toLocaleString()} readings`,
      observedAt: now,
    });
  }

  // ── stopped moving ─────────────────────────────────────────────────────
  for (const f of data.flatlined) {
    out.push({
      id: `stuck:${f.id}`,
      kind: 'stuck',
      // A held value hides everything downstream of it, so it outranks a
      // breach you can at least see.
      priority: 'high',
      title: `${f.parameter} not changing at ${f.location}`,
      description:
        `Identical for ${plural(f.flatHours, 'hour')} at ${f.stuckAt} ${f.unit}. ` +
        `Usually a failed probe whose last reading is still being published — ` +
        `nothing else on the dashboard would show a problem.`,
      sensorId: f.id,
      plantId: f.plantId,
      plantName: f.plantName,
      location: f.location,
      parameter: f.parameter,
      unit: f.unit,
      value: f.stuckAt,
      limit: null,
      limitLabel: '',
      detail: plural(f.flatHours, 'hour') + ' unchanged',
      observedAt: now,
    });
  }

  // ── configured but silent ──────────────────────────────────────────────
  //
  // One entry per plant. Thirty-eight cards saying "not reporting at
  // Hyderabad" are thirty-eight symptoms of a single fact — that site's
  // gateway has never delivered a file — and listing them individually buries
  // the cause under its own consequences.
  for (const p of data.coverage.byPlant) {
    const silent = p.never + p.stopped;
    if (silent === 0) continue;

    // The gateway's delivery record separates the two very different causes.
    // Nothing arriving at all is an integration problem; readings arriving and
    // then stopping is a plant or instrument problem.
    const gatewayDark = p.gatewayFiles === 0;
    const allSilent = silent >= p.configured;

    out.push({
      id: `silent:${p.plantId}`,
      kind: 'silent',
      priority: gatewayDark || allSilent ? 'high' : 'medium',
      title: gatewayDark
        ? `No data from ${p.plantName}`
        : `${silent} instrument${silent === 1 ? '' : 's'} not reporting at ${p.plantName}`,
      description: gatewayDark
        ? `All ${p.configured} instruments are configured in the register map, ` +
          `but gateway ${p.gatewayId ?? 'for this plant'} has never delivered a ` +
          `file. Nothing is arriving to interpret, so this is an integration ` +
          `problem rather than an instrument fault.`
        : `${p.stopped} stopped sending and ${p.never} never sent a reading, ` +
          `out of ${p.configured} configured. Gateway ${p.gatewayId ?? ''} has ` +
          `delivered ${p.gatewayFiles.toLocaleString()} files` +
          `${p.gatewayLastFile
              ? `, most recently ${new Date(p.gatewayLastFile).toLocaleString()}`
              : ''}.`,
      // A plant-wide outage is not about one instrument, so there is nothing
      // to chart and the drill-down says so rather than showing an empty axis.
      sensorId: null,
      plantId: p.plantId,
      plantName: p.plantName,
      location: p.gatewayId ?? 'gateway',
      parameter: 'coverage',
      unit: '',
      value: null,
      limit: null,
      limitLabel: '',
      detail: gatewayDark ? 'no files received' : `${silent} of ${p.configured} silent`,
      observedAt: p.gatewayLastFile ? new Date(p.gatewayLastFile) : now,
    });
  }

  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.priority] - rank[b.priority]);
}

export const KIND_LABEL: Record<ObservationKind, string> = {
  breach: 'Outside limits',
  stuck: 'Not changing',
  silent: 'Not reporting',
};
