import { TagMapEntry } from './types';

/**
 * The mapping table.
 *
 * This is the filter. A field with no row here is never stored — not by an
 * explicit exclusion list, but because nothing claims it. That is what keeps
 * gateway housekeeping (signal strength, GPS, battery, firmware) out of the
 * database without anyone maintaining a blocklist.
 *
 * Adding a sensor is a row. Removing one is `active: false`. Neither is a
 * code change, which is the whole point — a plant engineer can do both.
 */
export const TAG_MAP: TagMapEntry[] = [
  // ── Raw Water Intake ──────────────────────────────────────────────
  { sourceSystem: 'gw_wtp01', tag: 'PH-1001',  sensorId: 'plant-1-sensor-1',  parameter: 'pH',           sourceUnit: 'pH',    transform: 'identity',      location: 'Raw Water Intake',      active: true },
  { sourceSystem: 'gw_wtp01', tag: 'TUR-1001', sensorId: 'plant-1-sensor-2',  parameter: 'turbidity',    sourceUnit: 'NTU',   transform: 'identity',      location: 'Raw Water Intake',      active: true },
  { sourceSystem: 'gw_wtp01', tag: 'CON-1001', sensorId: 'plant-1-sensor-3',  parameter: 'conductivity', sourceUnit: 'uS/cm', transform: 'siemens',       location: 'Raw Water Intake',      active: true },
  { sourceSystem: 'gw_wtp01', tag: 'TMP-1001', sensorId: 'plant-1-sensor-4',  parameter: 'temperature',  sourceUnit: 'degC',  transform: 'celsius',       location: 'Raw Water Intake',      active: true },
  { sourceSystem: 'gw_wtp01', tag: 'FLW-1001', sensorId: 'plant-1-sensor-5',  parameter: 'flow',         sourceUnit: 'm3/h',  transform: 'cubic_metres',  location: 'Raw Water Intake',      active: true },

  // ── Flash Mixer ───────────────────────────────────────────────────
  { sourceSystem: 'gw_wtp01', tag: 'FLW-1002', sensorId: 'plant-1-sensor-6',  parameter: 'flow',         sourceUnit: 'm3/h',  transform: 'cubic_metres',  location: 'Flash Mixer',           active: true },
  { sourceSystem: 'gw_wtp01', tag: 'PH-1002',  sensorId: 'plant-1-sensor-7',  parameter: 'pH',           sourceUnit: 'pH',    transform: 'identity',      location: 'Flash Mixer',           active: true },

  // ── Treatment train ───────────────────────────────────────────────
  { sourceSystem: 'gw_wtp01', tag: 'LVL-1001', sensorId: 'plant-1-sensor-8',  parameter: 'level',        sourceUnit: '%',     transform: 'identity',      location: 'Flocculation Tank A',   active: true },
  { sourceSystem: 'gw_wtp01', tag: 'TUR-1002', sensorId: 'plant-1-sensor-9',  parameter: 'turbidity',    sourceUnit: 'NTU',   transform: 'identity',      location: 'Clarifier 1',           active: true },
  { sourceSystem: 'gw_wtp01', tag: 'TUR-1003', sensorId: 'plant-1-sensor-10', parameter: 'turbidity',    sourceUnit: 'NTU',   transform: 'identity',      location: 'Sand Filter 1',         active: true },
  { sourceSystem: 'gw_wtp01', tag: 'PRS-1001', sensorId: 'plant-1-sensor-11', parameter: 'pressure',     sourceUnit: 'bar',   transform: 'identity',      location: 'Sand Filter 1',         active: true },
  { sourceSystem: 'gw_wtp01', tag: 'TUR-1004', sensorId: 'plant-1-sensor-12', parameter: 'turbidity',    sourceUnit: 'NTU',   transform: 'identity',      location: 'Sand Filter 2',         active: true },
  { sourceSystem: 'gw_wtp01', tag: 'TUR-1005', sensorId: 'plant-1-sensor-13', parameter: 'turbidity',    sourceUnit: 'NTU',   transform: 'identity',      location: 'GAC Filter',            active: true },

  // ── Disinfection and distribution ─────────────────────────────────
  // Sent in parts per billion; stored in mg/L. Without this conversion 680
  // reads as a catastrophic chlorine overdose instead of a healthy residual.
  { sourceSystem: 'gw_wtp01', tag: 'CHL-1001', sensorId: 'plant-1-sensor-14', parameter: 'chlorine',     sourceUnit: 'ppb',   transform: 'ppb_to_mg_l',   location: 'Chlorine Contact Tank', active: true },
  { sourceSystem: 'gw_wtp01', tag: 'ORP-1001', sensorId: 'plant-1-sensor-15', parameter: 'ORP',          sourceUnit: 'mV',    transform: 'identity',      location: 'Chlorine Contact Tank', active: true },
  { sourceSystem: 'gw_wtp01', tag: 'DOX-1001', sensorId: 'plant-1-sensor-16', parameter: 'DO',           sourceUnit: 'mg/L',  transform: 'identity',      location: 'Clear Water Tank',      active: true },
  { sourceSystem: 'gw_wtp01', tag: 'LVL-1002', sensorId: 'plant-1-sensor-17', parameter: 'level',        sourceUnit: '%',     transform: 'identity',      location: 'Clear Water Tank',      active: true },
  { sourceSystem: 'gw_wtp01', tag: 'PRS-1002', sensorId: 'plant-1-sensor-18', parameter: 'pressure',     sourceUnit: 'bar',   transform: 'identity',      location: 'Distribution Pump',     active: true },
  { sourceSystem: 'gw_wtp01', tag: 'PH-1003',  sensorId: 'plant-1-sensor-19', parameter: 'pH',           sourceUnit: 'pH',    transform: 'identity',      location: 'Outlet Chamber',        active: true },
];

/**
 * Equipment and alarm tags. Kept separately: they are real signals worth
 * storing, but they are equipment state rather than water quality, so they
 * never reach the readings table or trigger a process alarm.
 */
export const EQUIPMENT_TAGS = new Set([
  'P101_RUN',
  'P101_SPEED',
  'P101_CURRENT',
  'MV601_POS',
  'ALM_HI_TURB',
]);

export function lookupTag(sourceSystem: string, tag: string): TagMapEntry | undefined {
  return TAG_MAP.find((e) => e.sourceSystem === sourceSystem && e.tag === tag);
}
