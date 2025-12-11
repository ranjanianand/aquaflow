import { Alert, AlertSeverity, AlertStatus } from '@/types';

// Helper to create dates relative to now
const hoursAgo = (hours: number): Date => new Date(Date.now() - hours * 3600000);
const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60000);
const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 3600000);

export const mockAlerts: Alert[] = [
  // Active Critical Alerts
  {
    id: 'alert-1',
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    sensorId: 'plant-3-sensor-1',
    sensorName: 'pH Sensor 1',
    type: 'High pH Level',
    severity: 'critical',
    message: 'pH level exceeded maximum threshold of 8.5',
    value: 8.7,
    threshold: 8.5,
    unit: 'pH',
    status: 'active',
    createdAt: minutesAgo(15),
    duration: '15 mins',
  },
  {
    id: 'alert-2',
    plantId: 'plant-6',
    plantName: 'Pune WTP-06',
    sensorId: 'plant-6-sensor-2',
    sensorName: 'Flow Sensor 1',
    type: 'Communication Lost',
    severity: 'critical',
    message: 'No data received from sensor for over 60 minutes',
    value: 0,
    threshold: 0,
    unit: '',
    status: 'active',
    createdAt: hoursAgo(1),
    duration: '1 hour',
  },
  {
    id: 'alert-3',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    sensorId: 'plant-1-sensor-5',
    sensorName: 'Turbidity Sensor 1',
    type: 'High Turbidity',
    severity: 'critical',
    message: 'Turbidity level exceeded maximum threshold of 4.0 NTU',
    value: 4.8,
    threshold: 4.0,
    unit: 'NTU',
    status: 'active',
    createdAt: minutesAgo(8),
    duration: '8 mins',
  },

  // Active Warning Alerts
  {
    id: 'alert-4',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    sensorId: 'plant-2-sensor-3',
    sensorName: 'Pressure Sensor 1',
    type: 'Low Pressure Warning',
    severity: 'warning',
    message: 'Pressure approaching minimum threshold',
    value: 2.3,
    threshold: 2.0,
    unit: 'bar',
    status: 'active',
    createdAt: minutesAgo(45),
    duration: '45 mins',
  },
  {
    id: 'alert-5',
    plantId: 'plant-4',
    plantName: 'Bangalore WTP-04',
    sensorId: 'plant-4-sensor-6',
    sensorName: 'Chlorine Sensor 1',
    type: 'Low Chlorine Level',
    severity: 'warning',
    message: 'Chlorine level approaching minimum threshold',
    value: 0.25,
    threshold: 0.2,
    unit: 'mg/L',
    status: 'active',
    createdAt: hoursAgo(2),
    duration: '2 hours',
  },

  // Acknowledged Alerts
  {
    id: 'alert-6',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    sensorId: 'plant-1-sensor-4',
    sensorName: 'Temperature Sensor 1',
    type: 'High Temperature',
    severity: 'warning',
    message: 'Temperature exceeded warning threshold',
    value: 33,
    threshold: 30,
    unit: '°C',
    status: 'acknowledged',
    createdAt: hoursAgo(3),
    acknowledgedAt: hoursAgo(2.5),
    acknowledgedBy: 'Rahul Kumar',
    duration: '3 hours',
  },
  {
    id: 'alert-7',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    sensorId: 'plant-2-sensor-1',
    sensorName: 'pH Sensor 1',
    type: 'pH Fluctuation',
    severity: 'info',
    message: 'pH showing unusual fluctuation patterns',
    value: 7.1,
    threshold: 7.0,
    unit: 'pH',
    status: 'acknowledged',
    createdAt: hoursAgo(5),
    acknowledgedAt: hoursAgo(4),
    acknowledgedBy: 'Priya Sharma',
    duration: '5 hours',
  },
  {
    id: 'alert-8',
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    sensorId: 'plant-3-sensor-2',
    sensorName: 'Flow Sensor 1',
    type: 'Flow Rate Variation',
    severity: 'warning',
    message: 'Flow rate showing significant variation',
    value: 280,
    threshold: 250,
    unit: 'm³/h',
    status: 'acknowledged',
    createdAt: hoursAgo(6),
    acknowledgedAt: hoursAgo(5.5),
    acknowledgedBy: 'Amit Singh',
    duration: '6 hours',
  },
  {
    id: 'alert-9',
    plantId: 'plant-5',
    plantName: 'Hyderabad WTP-05',
    sensorId: 'plant-5-sensor-6',
    sensorName: 'Level Sensor 1',
    type: 'Tank Level Low',
    severity: 'warning',
    message: 'Storage tank level below optimal range',
    value: 28,
    threshold: 30,
    unit: '%',
    status: 'acknowledged',
    createdAt: hoursAgo(8),
    acknowledgedAt: hoursAgo(7),
    acknowledgedBy: 'Rahul Kumar',
    duration: '8 hours',
  },
  {
    id: 'alert-10',
    plantId: 'plant-4',
    plantName: 'Bangalore WTP-04',
    sensorId: 'plant-4-sensor-4',
    sensorName: 'Temperature Sensor 1',
    type: 'Temperature Spike',
    severity: 'info',
    message: 'Brief temperature spike detected',
    value: 32,
    threshold: 30,
    unit: '°C',
    status: 'acknowledged',
    createdAt: hoursAgo(10),
    acknowledgedAt: hoursAgo(9),
    acknowledgedBy: 'Priya Sharma',
    duration: '10 hours',
  },

  // Resolved Alerts (last 7 days)
  {
    id: 'alert-11',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    sensorId: 'plant-1-sensor-1',
    sensorName: 'pH Sensor 1',
    type: 'pH Imbalance',
    severity: 'critical',
    message: 'pH level exceeded threshold',
    value: 8.8,
    threshold: 8.5,
    unit: 'pH',
    status: 'resolved',
    createdAt: daysAgo(1),
    acknowledgedAt: daysAgo(1),
    acknowledgedBy: 'Rahul Kumar',
    resolvedAt: daysAgo(1),
    resolvedBy: 'System Auto-Resolve',
    duration: '45 mins',
  },
  {
    id: 'alert-12',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    sensorId: 'plant-2-sensor-5',
    sensorName: 'Turbidity Sensor 1',
    type: 'High Turbidity',
    severity: 'warning',
    message: 'Turbidity level elevated',
    value: 3.5,
    threshold: 3.0,
    unit: 'NTU',
    status: 'resolved',
    createdAt: daysAgo(2),
    acknowledgedAt: daysAgo(2),
    acknowledgedBy: 'Priya Sharma',
    resolvedAt: daysAgo(2),
    resolvedBy: 'Priya Sharma',
    duration: '2 hours',
  },
  {
    id: 'alert-13',
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    sensorId: 'plant-3-sensor-3',
    sensorName: 'Pressure Sensor 1',
    type: 'Pressure Drop',
    severity: 'critical',
    message: 'Sudden pressure drop detected',
    value: 1.5,
    threshold: 2.0,
    unit: 'bar',
    status: 'resolved',
    createdAt: daysAgo(3),
    acknowledgedAt: daysAgo(3),
    acknowledgedBy: 'Amit Singh',
    resolvedAt: daysAgo(3),
    resolvedBy: 'Amit Singh',
    duration: '30 mins',
  },
  {
    id: 'alert-14',
    plantId: 'plant-4',
    plantName: 'Bangalore WTP-04',
    sensorId: 'plant-4-sensor-2',
    sensorName: 'Flow Sensor 1',
    type: 'Flow Anomaly',
    severity: 'info',
    message: 'Unusual flow pattern detected',
    value: 420,
    threshold: 400,
    unit: 'm³/h',
    status: 'resolved',
    createdAt: daysAgo(4),
    acknowledgedAt: daysAgo(4),
    acknowledgedBy: 'Rahul Kumar',
    resolvedAt: daysAgo(4),
    resolvedBy: 'System Auto-Resolve',
    duration: '1 hour',
  },
  {
    id: 'alert-15',
    plantId: 'plant-5',
    plantName: 'Hyderabad WTP-05',
    sensorId: 'plant-5-sensor-1',
    sensorName: 'pH Sensor 1',
    type: 'pH Warning',
    severity: 'warning',
    message: 'pH trending towards upper limit',
    value: 8.2,
    threshold: 8.0,
    unit: 'pH',
    status: 'resolved',
    createdAt: daysAgo(5),
    acknowledgedAt: daysAgo(5),
    acknowledgedBy: 'Priya Sharma',
    resolvedAt: daysAgo(5),
    resolvedBy: 'Priya Sharma',
    duration: '4 hours',
  },
];

export const getAlertsByStatus = (status: AlertStatus): Alert[] => {
  return mockAlerts.filter(alert => alert.status === status);
};

export const getAlertsBySeverity = (severity: AlertSeverity): Alert[] => {
  return mockAlerts.filter(alert => alert.severity === severity);
};

export const getAlertsByPlant = (plantId: string): Alert[] => {
  return mockAlerts.filter(alert => alert.plantId === plantId);
};

export const getActiveAlerts = (): Alert[] => {
  return mockAlerts.filter(alert => alert.status === 'active');
};

export const getActiveAlertsCount = (): number => {
  return mockAlerts.filter(alert => alert.status === 'active').length;
};

export const getCriticalAlertsCount = (): number => {
  return mockAlerts.filter(alert => alert.severity === 'critical' && alert.status === 'active').length;
};

export const getAlertById = (id: string): Alert | undefined => {
  return mockAlerts.find(alert => alert.id === id);
};

// Stats
export const getAlertStats = () => {
  const active = mockAlerts.filter(a => a.status === 'active');
  const acknowledged = mockAlerts.filter(a => a.status === 'acknowledged');
  const resolved = mockAlerts.filter(a => a.status === 'resolved');

  return {
    active: active.length,
    acknowledged: acknowledged.length,
    resolved: resolved.length,
    total: mockAlerts.length,
    critical: active.filter(a => a.severity === 'critical').length,
    warning: active.filter(a => a.severity === 'warning').length,
    info: active.filter(a => a.severity === 'info').length,
  };
};
