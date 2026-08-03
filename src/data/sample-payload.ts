import { RawPayload } from '@/lib/pipeline/types';

/**
 * A representative gateway export from Chennai WTP-01.
 *
 * Deliberately kept exactly as a real device would send it, including the
 * things that go wrong: chlorine in ppb rather than mg/L, ASCII-mangled unit
 * strings, an offline sentinel, an uncertain quality code, a reading thirty
 * seconds behind the rest, and five equipment tags with no timestamp at all.
 *
 * Roughly 70% of the fields here are gateway housekeeping that must never
 * reach the database.
 */
export const SAMPLE_PAYLOAD: RawPayload = {
  messageId: 'b7f3-2291-aa04-88f1',
  schemaVersion: '1.2',
  gateway: {
    serial: 'GW-4471-P01',
    model: 'Advantech ECU-1251',
    firmware: '3.14.2',
    uptime_s: 884213,
    cpu_temp_c: 51.2,
    free_mem_kb: 88214,
    rssi_dbm: -67,
    cellular: { carrier: 'Airtel', tech: 'LTE', iccid: '8991000012345678901' },
    gps: { lat: 13.0827, lon: 80.2707, fix: '3D' },
    poll: { duration_ms: 214, modbus_errors: 0, retries: 1 },
  },
  site: {
    plant_code: 'WTP-01',
    plant_name: 'Chennai WTP-01',
    line: 'A',
    shift: 'B',
  },
  publishedAt: '2026-07-31T14:23:01.482Z',
  readings: [
    { tag: 'PH-1001',  loc: 'Raw Water Intake',      v: 7.42,   u: 'pH',    q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'TUR-1001', loc: 'Raw Water Intake',      v: 12.8,   u: 'NTU',   q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'CON-1001', loc: 'Raw Water Intake',      v: 412.5,  u: 'uS/cm', q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'TMP-1001', loc: 'Raw Water Intake',      v: 27.3,   u: 'degC',  q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'FLW-1001', loc: 'Raw Water Intake',      v: 342.0,  u: 'm3/h',  q: 192, ts: '2026-07-31T14:23:00Z' },

    { tag: 'FLW-1002', loc: 'Flash Mixer',           v: 338.6,  u: 'm3/h',  q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'PH-1002',  loc: 'Flash Mixer',           v: 6.98,   u: 'pH',    q: 192, ts: '2026-07-31T14:23:00Z' },

    { tag: 'LVL-1001', loc: 'Flocculation Tank A',   v: 78.4,   u: '%',     q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'TUR-1002', loc: 'Clarifier 1',           v: 3.94,   u: 'NTU',   q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'TUR-1003', loc: 'Sand Filter 1',         v: 0.31,   u: 'NTU',   q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'PRS-1001', loc: 'Sand Filter 1',         v: 4.12,   u: 'bar',   q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'TUR-1004', loc: 'Sand Filter 2',         v: 0.28,   u: 'NTU',   q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'TUR-1005', loc: 'GAC Filter',            v: 4.8,    u: 'NTU',   q: 192, ts: '2026-07-31T14:23:00Z' },

    { tag: 'CHL-1001', loc: 'Chlorine Contact Tank', v: 680.0,  u: 'ppb',   q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'ORP-1001', loc: 'Chlorine Contact Tank', v: 712.0,  u: 'mV',    q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'DOX-1001', loc: 'Clear Water Tank',      v: 7.6,    u: 'mg/L',  q: 64,  ts: '2026-07-31T14:22:30Z' },
    { tag: 'LVL-1002', loc: 'Clear Water Tank',      v: 84.2,   u: '%',     q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'PRS-1002', loc: 'Distribution Pump',     v: 3.42,   u: 'bar',   q: 192, ts: '2026-07-31T14:23:00Z' },
    { tag: 'PH-1003',  loc: 'Outlet Chamber',        v: -9999,  u: 'pH',    q: 0,   ts: '2026-07-31T14:23:00Z' },

    // No timestamp on any of these — they inherit publishedAt
    { tag: 'P101_RUN',     loc: 'Distribution Pump', v: 1,      u: 'bool',  q: 192 },
    { tag: 'P101_SPEED',   loc: 'Distribution Pump', v: 78.4,   u: '%',     q: 192 },
    { tag: 'P101_CURRENT', loc: 'Distribution Pump', v: 42.1,   u: 'A',     q: 192 },
    { tag: 'MV601_POS',    loc: 'Outlet Chamber',    v: 64.0,   u: '%',     q: 192 },
    { tag: 'ALM_HI_TURB',  loc: 'GAC Filter',        v: 1,      u: 'bool',  q: 192 },
  ],
  diagnostics: {
    queue_depth: 0,
    last_sync: '2026-07-31T14:22:01Z',
    dropped_since_boot: 3,
    battery_pct: 100,
    door_open: false,
  },
};

/** Pretty-printed, for the raw-input panel. */
export const SAMPLE_PAYLOAD_JSON = JSON.stringify(SAMPLE_PAYLOAD, null, 2);
