import { SensorType } from '@/types';

/** A single reading as it arrives in a gateway export. */
export interface RawReading {
  tag: string;
  loc?: string;
  v: number;
  u: string;
  /** OPC-UA quality code: 192 good, 64 uncertain, 0 bad. */
  q: number;
  /** Absent on some tags — falls back to the envelope's publishedAt. */
  ts?: string;
}

/** The envelope a plant gateway writes into object storage. */
export interface RawPayload {
  messageId?: string;
  schemaVersion?: string;
  gateway?: Record<string, unknown>;
  site?: { plant_code?: string; plant_name?: string; [k: string]: unknown };
  publishedAt?: string;
  readings: RawReading[];
  diagnostics?: Record<string, unknown>;
}

/** One row of the mapping table that decides what gets stored. */
export interface TagMapEntry {
  sourceSystem: string;
  tag: string;
  sensorId: string;
  parameter: SensorType;
  /** Unit as the gateway sends it, before normalisation. */
  sourceUnit: string;
  transform: TransformName;
  location: string;
  active: boolean;
}

export type TransformName =
  | 'identity'
  | 'ppb_to_mg_l'
  | 'ug_l_to_mg_l'
  | 'celsius'      // ASCII alias only, value unchanged
  | 'siemens'      // ASCII alias only, value unchanged
  | 'cubic_metres'; // ASCII alias only, value unchanged

/** Why a reading did not reach the readings table. */
export type RejectReason =
  | 'unmapped'
  | 'inactive'
  | 'bad_quality'
  | 'sentinel_value'
  | 'out_of_plausible_range';

export type Outcome = 'stored' | 'rejected' | 'equipment' | 'unmapped';

/** Full decision trail for one raw reading — this is what the UI renders. */
export interface TracedReading {
  raw: RawReading;
  /** Resolved timestamp, after falling back to publishedAt. */
  timestamp: string;
  timestampInherited: boolean;

  mapped: boolean;
  sensorId?: string;
  parameter?: SensorType;
  location?: string;

  /** Set when the source unit differed from the canonical one. */
  conversion?: {
    from: string;
    to: string;
    fromValue: number;
    toValue: number;
    transform: TransformName;
  };

  canonicalValue?: number;
  canonicalUnit?: string;

  quality: 'good' | 'uncertain' | 'bad';
  status?: 'normal' | 'warning' | 'critical';
  band?: { warnMin: number; warnMax: number; critMin: number; critMax: number };

  outcome: Outcome;
  reason?: RejectReason;
  /** Human-readable explanation, shown in the UI. */
  note?: string;
}

export interface IngestResult {
  sourceUri: string;
  plantCode?: string;
  plantName?: string;
  publishedAt?: string;
  receivedAt: string;

  /** Envelope fields carried no measurement and were never stored. */
  droppedFields: string[];

  traced: TracedReading[];

  counts: {
    readingsIn: number;
    stored: number;
    equipment: number;
    rejected: number;
    unmapped: number;
    fieldsDropped: number;
    conversions: number;
    alarms: number;
  };

  alarms: {
    sensorId: string;
    tag: string;
    location?: string;
    value: number;
    unit: string;
    limit: number;
    severity: 'warning' | 'critical';
    message: string;
  }[];
}
