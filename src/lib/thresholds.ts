import { SensorType } from '@/types';

/**
 * Stage-aware alarm thresholds.
 *
 * A single limit per parameter does not survive contact with a real plant.
 * Turbidity of 12.8 NTU is normal at a raw water intake and a serious failure
 * at the outlet — under one shared limit the intake alarms continuously until
 * operators mute it, and by then the genuine failure reads as less severe.
 *
 * Limits therefore belong to the sensor, resolved from where it sits in the
 * treatment train. The parameter-level band remains only as a physical
 * plausibility bound: a pH of 15 is a broken probe anywhere.
 */

/**
 * 'filtered' is separate from 'treatment' deliberately. Filter effluent is the
 * regulatory control point in drinking water — it is held to the same turbidity
 * limit as finished water, not to the looser mid-process one. Folding filters
 * into 'treatment' lets a failing filter pass silently.
 */
export type ProcessStage = 'raw' | 'treatment' | 'filtered' | 'final';

export interface ThresholdBand {
  /** Normal operating range. Outside this → warning. */
  warnMin: number;
  warnMax: number;
  /** Outside this → critical. Always wider than the warning band. */
  critMin: number;
  critMax: number;
}

const RAW_HINTS = [
  'intake', 'raw', 'well', 'river', 'lake', 'bore', 'screen', 'strainer', 'sump',
];

const FINAL_HINTS = [
  'clear water', 'final', 'outlet', 'storage', 'distribution', 'dispatch',
  'elevated', 'contact', 'permeate', 'booster', 'main', 'remineral', 'ground storage',
];

/** Anything producing filtered water — its effluent meets finished-water limits. */
const FILTER_HINTS = [
  'filter', 'membrane', 'carbon', 'ro stage', 'ultrafiltration', 'softening',
];

/**
 * Classify a sensor's location into a treatment stage.
 * Order matters: a "Clear Water Tank" downstream of filters is final, and a
 * filter is checked before falling through to generic mid-process.
 */
export function classifyStage(location?: string): ProcessStage {
  if (!location) return 'treatment';
  const l = location.toLowerCase();
  if (FINAL_HINTS.some((h) => l.includes(h))) return 'final';
  if (FILTER_HINTS.some((h) => l.includes(h))) return 'filtered';
  if (RAW_HINTS.some((h) => l.includes(h))) return 'raw';
  return 'treatment';
}

/** Physical plausibility bounds — the widest a reading can be and still be real. */
const PLAUSIBLE: Record<SensorType, ThresholdBand> = {
  pH:           { warnMin: 6.5,  warnMax: 8.5,  critMin: 6.0,  critMax: 9.0 },
  flow:         { warnMin: 100,  warnMax: 500,  critMin: 50,   critMax: 600 },
  pressure:     { warnMin: 2.0,  warnMax: 6.0,  critMin: 1.0,  critMax: 8.0 },
  temperature:  { warnMin: 15,   warnMax: 35,   critMin: 5,    critMax: 45 },
  turbidity:    { warnMin: 0,    warnMax: 4.0,  critMin: 0,    critMax: 10 },
  chlorine:     { warnMin: 0.2,  warnMax: 2.0,  critMin: 0.1,  critMax: 4.0 },
  DO:           { warnMin: 4.0,  warnMax: 12.0, critMin: 2.0,  critMax: 15.0 },
  level:        { warnMin: 20,   warnMax: 95,   critMin: 10,   critMax: 98 },
  conductivity: { warnMin: 200,  warnMax: 800,  critMin: 100,  critMax: 1500 },
  ORP:          { warnMin: 200,  warnMax: 800,  critMin: 100,  critMax: 1000 },
  // Instantaneous load at a motor control centre. Drawing far more than usual
  // means a pump is struggling; far less means it has stopped.
  power:        { warnMin: 5,    warnMax: 200,  critMin: 0,    critMax: 250 },
  // States and totals, not measurements. The bands below are placeholders so
  // the map stays exhaustive — nothing should evaluate them, because a
  // pump-run bit has no limit and a kWh total is never "too high". The Python
  // side raises rather than returning a band for these.
  energy:       { warnMin: 0, warnMax: 0, critMin: 0, critMax: 0 },
  run_status:   { warnMin: 0, warnMax: 1, critMin: 0, critMax: 1 },
  fault:        { warnMin: 0, warnMax: 0, critMin: 0, critMax: 1 },
  run_hours:    { warnMin: 0, warnMax: 0, critMin: 0, critMax: 0 },
  start_count:  { warnMin: 0, warnMax: 0, critMin: 0, critMax: 0 },
  valve_open:   { warnMin: 0, warnMax: 1, critMin: 0, critMax: 1 },
  valve_closed: { warnMin: 0, warnMax: 1, critMin: 0, critMax: 1 },
};

/**
 * Stage overrides. Only parameters whose acceptable range genuinely shifts
 * along the treatment train are listed; everything else keeps its plausible band.
 */
const STAGE_OVERRIDES: Partial<
  Record<SensorType, Partial<Record<ProcessStage, ThresholdBand>>>
> = {
  turbidity: {
    // Untreated surface water is expected to be cloudy.
    raw:       { warnMin: 0, warnMax: 20,  critMin: 0, critMax: 50 },
    // Post-clarifier, pre-filter.
    treatment: { warnMin: 0, warnMax: 5.0, critMin: 0, critMax: 10 },
    // Filter effluent — 0.3 NTU is the line most utilities are held to.
    filtered:  { warnMin: 0, warnMax: 0.3, critMin: 0, critMax: 0.5 },
    final:     { warnMin: 0, warnMax: 0.3, critMin: 0, critMax: 0.5 },
  },
  pH: {
    raw:       { warnMin: 6.0, warnMax: 9.0, critMin: 5.5, critMax: 9.5 },
    // Coagulation deliberately depresses pH.
    treatment: { warnMin: 6.0, warnMax: 8.5, critMin: 5.5, critMax: 9.0 },
    filtered:  { warnMin: 6.5, warnMax: 8.5, critMin: 6.0, critMax: 9.0 },
    final:     { warnMin: 6.5, warnMax: 8.5, critMin: 6.0, critMax: 9.0 },
  },
  chlorine: {
    // Residual is only meaningful after dosing.
    treatment: { warnMin: 0.2, warnMax: 3.0, critMin: 0.1, critMax: 5.0 },
    filtered:  { warnMin: 0.2, warnMax: 3.0, critMin: 0.1, critMax: 5.0 },
    final:     { warnMin: 0.2, warnMax: 2.0, critMin: 0.1, critMax: 4.0 },
  },
  conductivity: {
    raw:       { warnMin: 100, warnMax: 1200, critMin: 50, critMax: 2000 },
  },
  DO: {
    raw:       { warnMin: 2.0, warnMax: 12.0, critMin: 1.0, critMax: 15.0 },
  },
};

/**
 * Resolve the alarm band for a sensor from its parameter and location.
 * Falls back to the parameter's plausibility band when the stage has no override.
 */
export function resolveThresholds(type: SensorType, location?: string): ThresholdBand {
  const stage = classifyStage(location);
  return STAGE_OVERRIDES[type]?.[stage] ?? PLAUSIBLE[type];
}

/** The parameter-wide plausibility band, independent of stage. */
export function plausibleBand(type: SensorType): ThresholdBand {
  return PLAUSIBLE[type];
}

/** Classify a reading against its band. */
export function evaluate(
  value: number,
  band: ThresholdBand
): 'normal' | 'warning' | 'critical' {
  if (value < band.critMin || value > band.critMax) return 'critical';
  if (value < band.warnMin || value > band.warnMax) return 'warning';
  return 'normal';
}
