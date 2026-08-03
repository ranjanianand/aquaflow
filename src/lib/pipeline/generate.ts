import { RawPayload, RawReading } from './types';
import { SAMPLE_PAYLOAD } from '@/data/sample-payload';

/**
 * Produce a plausible next gateway export.
 *
 * Values drift from the reference payload rather than being random, and
 * faults are injected on a fixed cadence so a running demo shows rejections,
 * conversions and alarms occurring naturally instead of only when someone
 * presses a button. Deterministic in the sequence number so a given file
 * always reproduces.
 */

const seeded = (n: number): number => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Faults a real plant produces, cycled so the feed stays interesting. */
type Fault =
  | 'none'
  | 'probe_offline'      // sentinel on a second sensor
  | 'filter_breakthrough' // turbidity spike past the filtered limit
  | 'comms_uncertain'    // extra uncertain quality codes
  | 'new_tag';           // an unmapped instrument appears

function faultFor(seq: number): Fault {
  const cycle = seq % 7;
  if (cycle === 2) return 'filter_breakthrough';
  if (cycle === 4) return 'comms_uncertain';
  if (cycle === 5) return 'new_tag';
  if (cycle === 6) return 'probe_offline';
  return 'none';
}

export interface GeneratedFile {
  seq: number;
  name: string;
  sourceUri: string;
  receivedAt: Date;
  payload: RawPayload;
  fault: Fault;
}

export function generateFile(seq: number, receivedAt: Date): GeneratedFile {
  const fault = faultFor(seq);

  const readings: RawReading[] = SAMPLE_PAYLOAD.readings.map((r, i) => {
    const drift = (seeded(seq * 100 + i) - 0.5) * 2;
    let v = r.v;
    let q = r.q;

    // Leave sentinels and booleans alone
    if (r.v !== -9999 && r.u !== 'bool') {
      const scale = Math.abs(r.v) < 10 ? 0.04 : 0.02;
      v = parseFloat((r.v * (1 + drift * scale)).toFixed(2));
    }

    if (fault === 'filter_breakthrough' && r.tag === 'TUR-1003') {
      v = parseFloat((1.4 + seeded(seq + i) * 0.8).toFixed(2)); // past 0.5 crit
    }
    if (fault === 'comms_uncertain' && (r.tag === 'ORP-1001' || r.tag === 'CON-1001')) {
      q = 64;
    }
    if (fault === 'probe_offline' && r.tag === 'PRS-1002') {
      v = -9999;
      q = 0;
    }

    return { ...r, v, q };
  });

  if (fault === 'new_tag') {
    // A chlorine analyser installed on the dosing skid that nobody mapped yet
    readings.push({
      tag: 'CHL-1007',
      loc: 'Chemical Dosing Skid',
      v: 742,
      u: 'ppb',
      q: 192,
      ts: receivedAt.toISOString(),
    });
  }

  const stamp = receivedAt
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .slice(0, 15);

  const hh = String(receivedAt.getUTCHours()).padStart(2, '0');
  const dt = receivedAt.toISOString().slice(0, 10);

  return {
    seq,
    name: `wtp01_${stamp}.json`,
    sourceUri: `s3://mwts-raw/raw/plant_id=P01/dt=${dt}/hh=${hh}/wtp01_${stamp}.json`,
    receivedAt,
    fault,
    payload: {
      ...SAMPLE_PAYLOAD,
      messageId: `${seq.toString(16).padStart(4, '0')}-2291-aa04-88f1`,
      publishedAt: receivedAt.toISOString(),
      readings,
    },
  };
}

export const FAULT_LABEL: Record<Fault, string | null> = {
  none: null,
  probe_offline: 'Pressure probe offline',
  filter_breakthrough: 'Filter breakthrough',
  comms_uncertain: 'Degraded comms',
  new_tag: 'Unrecognised instrument',
};
