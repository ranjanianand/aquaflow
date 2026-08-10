import { Alert, AlertSeverity, AlertStatus, Sensor, SensorType } from '@/types';
import { mockSensors } from '@/data/mock-sensors';
import { mockPlants } from '@/data/mock-plants';

/**
 * Alerts are derived from the sensors, not authored by hand.
 *
 * Hand-written fixtures drift: the alarm list said one thing while the sensor
 * grid said another, and a threshold change fixed one without touching the
 * other. Deriving them means the badge, the ticker, the alarm page and the
 * ingestion screen all read from the same bands.
 *
 * This is also how the real system behaves — alarms are a consequence of a
 * reading crossing its sensor's limit, never a separate list to maintain.
 */

const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60000);
const hoursAgo = (hours: number): Date => new Date(Date.now() - hours * 3600000);

const plantName = (plantId: string): string =>
  mockPlants.find((p) => p.id === plantId)?.name ?? plantId;

/** Deterministic pseudo-random, so alert ages are stable across renders. */
const seeded = (n: number): number => {
  const x = Math.sin(n * 7.13) * 10000;
  return x - Math.floor(x);
};

/**
 * Which warnings are worth waking someone for.
 *
 * Every sensor outside its band is a warning, but surfacing all of them is
 * alarm flood — the failure mode this whole exercise exists to avoid.
 * Criticals always raise; warnings only on the parameters that carry
 * compliance or public-health consequences.
 */
const WARN_WORTHY: SensorType[] = ['turbidity', 'chlorine', 'pH'];

const PARAMETER_LABEL: Record<SensorType, string> = {
  pH: 'pH',
  flow: 'Flow',
  pressure: 'Pressure',
  temperature: 'Temperature',
  turbidity: 'Turbidity',
  chlorine: 'Chlorine',
  DO: 'Dissolved Oxygen',
  level: 'Level',
  conductivity: 'Conductivity',
  ORP: 'ORP',
  energy: 'Energy',
  power: 'Power',
  run_status: 'Run Status',
  fault: 'Fault',
  run_hours: 'Run Hours',
  start_count: 'Start Count',
  valve_open: 'Valve Open',
  valve_closed: 'Valve Closed',
};

function describe(sensor: Sensor): {
  type: string;
  threshold: number;
  direction: 'High' | 'Low';
} {
  const critMax = sensor.critMax ?? sensor.maxThreshold;
  const critMin = sensor.critMin ?? sensor.minThreshold;
  const label = PARAMETER_LABEL[sensor.type];

  if (sensor.status === 'critical') {
    const high = sensor.currentValue > critMax;
    return {
      type: `${high ? 'High' : 'Low'} ${label}`,
      threshold: high ? critMax : critMin,
      direction: high ? 'High' : 'Low',
    };
  }
  const high = sensor.currentValue > sensor.maxThreshold;
  return {
    type: `${high ? 'High' : 'Low'} ${label}`,
    threshold: high ? sensor.maxThreshold : sensor.minThreshold,
    direction: high ? 'High' : 'Low',
  };
}

function toAlert(sensor: Sensor, index: number): Alert {
  const { type, threshold } = describe(sensor);
  const severity: AlertSeverity = sensor.status === 'critical' ? 'critical' : 'warning';

  // Criticals are recent; warnings have usually been standing a while.
  const ageMinutes =
    severity === 'critical'
      ? Math.round(3 + seeded(index) * 90)
      : Math.round(30 + seeded(index + 500) * 600);

  const duration =
    ageMinutes < 60
      ? `${ageMinutes} mins`
      : `${Math.round(ageMinutes / 60)} hour${ageMinutes >= 120 ? 's' : ''}`;

  return {
    id: `alert-${sensor.id}`,
    plantId: sensor.plantId,
    plantName: plantName(sensor.plantId),
    sensorId: sensor.id,
    sensorName: sensor.tag ? `${sensor.tag} · ${sensor.location}` : sensor.name,
    type,
    severity,
    message:
      `${PARAMETER_LABEL[sensor.type]} ${sensor.currentValue} ${sensor.unit} ` +
      `is outside the ${severity} limit of ${threshold} ${sensor.unit} at ${sensor.location}`,
    value: sensor.currentValue,
    threshold,
    unit: sensor.unit,
    status: 'active',
    createdAt: minutesAgo(ageMinutes),
    duration,
  };
}

/** A sensor whose comms have stopped is an alarm in its own right. */
function commsAlert(sensor: Sensor, index: number): Alert {
  const ageMinutes = Math.round(60 + seeded(index + 900) * 180);
  return {
    id: `alert-comms-${sensor.id}`,
    plantId: sensor.plantId,
    plantName: plantName(sensor.plantId),
    sensorId: sensor.id,
    sensorName: sensor.tag ? `${sensor.tag} · ${sensor.location}` : sensor.name,
    type: 'Communication Lost',
    severity: 'critical',
    message: `No file containing ${sensor.tag ?? sensor.name} has been received for over an hour`,
    value: 0,
    threshold: 0,
    unit: '',
    status: 'active',
    createdAt: minutesAgo(ageMinutes),
    duration: `${Math.round(ageMinutes / 60)} hours`,
  };
}

const activeAlerts: Alert[] = mockSensors
  .filter(
    (s) =>
      s.status === 'critical' ||
      (s.status === 'warning' && WARN_WORTHY.includes(s.type))
  )
  .map(toAlert);

// One plant is simulated as having lost its feed; report it once per plant
// rather than 25 times, because a missing file is a plant-level fact.
const offlinePlants = Array.from(
  new Set(mockSensors.filter((s) => s.commStatus === 'offline').map((s) => s.plantId))
);
const commsAlerts: Alert[] = offlinePlants.map((pid, i) => {
  const first = mockSensors.find((s) => s.plantId === pid)!;
  return commsAlert(first, i);
});

/**
 * A short history so the acknowledged and resolved views are not empty.
 * Derived from real sensors so the tags and locations stay consistent.
 */
const historicalAlerts: Alert[] = mockSensors
  .filter((s) => s.status === 'normal' && WARN_WORTHY.includes(s.type))
  .slice(0, 8)
  .map((sensor, i) => {
    const resolved = i % 2 === 0;
    const openedHours = 4 + i * 3;
    const base = toAlert(sensor, i + 2000);
    return {
      ...base,
      id: `alert-hist-${sensor.id}`,
      status: (resolved ? 'resolved' : 'acknowledged') as AlertStatus,
      createdAt: hoursAgo(openedHours),
      acknowledgedAt: hoursAgo(openedHours - 1),
      acknowledgedBy: ['Amit Singh', 'Ananya Reddy', 'Admin User'][i % 3],
      ...(resolved
        ? {
            resolvedAt: hoursAgo(openedHours - 2),
            resolvedBy: ['Amit Singh', 'Ananya Reddy'][i % 2],
          }
        : {}),
      duration: `${openedHours} hours`,
    };
  });

export const mockAlerts: Alert[] = [
  ...commsAlerts,
  ...activeAlerts.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1
  ),
  ...historicalAlerts,
];

export const getAlertsByStatus = (status: AlertStatus): Alert[] => {
  return mockAlerts.filter((a) => a.status === status);
};

export const getAlertsBySeverity = (severity: AlertSeverity): Alert[] => {
  return mockAlerts.filter((a) => a.severity === severity);
};

export const getAlertsByPlant = (plantId: string): Alert[] => {
  return mockAlerts.filter((a) => a.plantId === plantId);
};

export const getActiveAlerts = (): Alert[] => {
  return mockAlerts.filter((a) => a.status === 'active');
};

export const getActiveAlertsCount = (): number => {
  return getActiveAlerts().length;
};

export const getCriticalAlertsCount = (): number => {
  return mockAlerts.filter((a) => a.status === 'active' && a.severity === 'critical').length;
};

export const getAlertById = (id: string): Alert | undefined => {
  return mockAlerts.find((a) => a.id === id);
};

export const getAlertStats = () => {
  const active = getActiveAlerts();
  return {
    total: mockAlerts.length,
    active: active.length,
    critical: active.filter((a) => a.severity === 'critical').length,
    warning: active.filter((a) => a.severity === 'warning').length,
    // Retained for the alarm page's filter row. Derived alarms are only ever
    // warning or critical — an informational tier would come from operator
    // annotations, not from a threshold breach.
    info: active.filter((a) => a.severity === 'info').length,
    acknowledged: mockAlerts.filter((a) => a.status === 'acknowledged').length,
    resolved: mockAlerts.filter((a) => a.status === 'resolved').length,
  };
};
