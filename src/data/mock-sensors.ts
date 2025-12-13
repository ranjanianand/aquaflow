import { Sensor, SensorReading, SensorType, SensorStatus, SensorCommStatus } from '@/types';

// Seeded random number generator for deterministic values
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate deterministic historical readings
const generateHistory = (baseValue: number, variance: number, seed: number, count: number = 24): SensorReading[] => {
  const history: SensorReading[] = [];
  const now = new Date('2025-01-15T12:00:00Z').getTime(); // Fixed timestamp for consistency

  for (let i = count - 1; i >= 0; i--) {
    const randomOffset = (seededRandom(seed + i) - 0.5) * variance * 2;
    history.push({
      timestamp: new Date(now - i * 3600000), // hourly readings
      value: parseFloat((baseValue + randomOffset).toFixed(2)),
    });
  }

  return history;
};

// Determine status based on thresholds
const getStatus = (value: number, min: number, max: number): SensorStatus => {
  if (value < min || value > max) return 'critical';
  const range = max - min;
  const warningBuffer = range * 0.1; // 10% buffer for warning
  if (value < min + warningBuffer || value > max - warningBuffer) return 'warning';
  return 'normal';
};

// Sensor configurations by type with fixed initial values for hydration stability
const sensorConfigs: Record<SensorType, { unit: string; min: number; max: number; base: number; setpoint: number; variance: number; initialOffset: number }> = {
  pH: { unit: 'pH', min: 6.5, max: 8.5, base: 7.2, setpoint: 7.0, variance: 0.5, initialOffset: -0.4 },
  flow: { unit: 'm³/h', min: 100, max: 500, base: 350, setpoint: 300, variance: 50, initialOffset: 12 },
  pressure: { unit: 'bar', min: 2.0, max: 6.0, base: 4.2, setpoint: 4.0, variance: 0.5, initialOffset: 0.1 },
  temperature: { unit: '°C', min: 15, max: 35, base: 24, setpoint: 25, variance: 3, initialOffset: 1 },
  turbidity: { unit: 'NTU', min: 0, max: 4.0, base: 1.2, setpoint: 1.0, variance: 0.8, initialOffset: 0.3 },
  chlorine: { unit: 'mg/L', min: 0.2, max: 2.0, base: 0.8, setpoint: 1.0, variance: 0.3, initialOffset: 0.1 },
  DO: { unit: 'mg/L', min: 4.0, max: 12.0, base: 7.5, setpoint: 8.0, variance: 1.5, initialOffset: 0.5 },
  level: { unit: '%', min: 20, max: 95, base: 72, setpoint: 75, variance: 15, initialOffset: 3 },
  conductivity: { unit: 'µS/cm', min: 200, max: 800, base: 450, setpoint: 400, variance: 100, initialOffset: 25 },
  ORP: { unit: 'mV', min: 200, max: 800, base: 650, setpoint: 600, variance: 100, initialOffset: -30 },
};

// Get communication status based on lastUpdated timestamp
const getCommStatus = (lastUpdated: Date): SensorCommStatus => {
  const now = Date.now();
  const age = now - lastUpdated.getTime();
  if (age > 60000) return 'offline'; // > 1 minute
  if (age > 30000) return 'stale'; // > 30 seconds
  return 'online';
};

// Plant-specific offsets for variety (deterministic)
const plantOffsets: Record<string, number> = {
  'plant-1': 1.0,
  'plant-2': 1.2,
  'plant-3': 0.8,
  'plant-4': 1.1,
  'plant-5': 0.9,
  'plant-6': 1.05,
};

// Generate sensors for a plant with deterministic values
const generateSensorsForPlant = (plantId: string, sensorTypes: SensorType[]): Sensor[] => {
  const plantOffset = plantOffsets[plantId] || 1.0;
  const now = new Date();

  return sensorTypes.map((type, index) => {
    const config = sensorConfigs[type];
    // Deterministic value based on plant and sensor index
    const seed = plantId.charCodeAt(plantId.length - 1) * 100 + index;
    const currentValue = config.base + config.initialOffset * plantOffset;
    const status = getStatus(currentValue, config.min, config.max);
    const lastUpdated = now;

    return {
      id: `${plantId}-sensor-${index + 1}`,
      plantId,
      name: `${type.toUpperCase()} Sensor ${index + 1}`,
      type,
      unit: config.unit,
      currentValue: parseFloat(currentValue.toFixed(2)),
      minThreshold: config.min,
      maxThreshold: config.max,
      setpoint: config.setpoint,
      status,
      commStatus: getCommStatus(lastUpdated),
      lastUpdated,
      history: generateHistory(config.base, config.variance, seed),
    };
  });
};

// Chennai WTP-01 Sensors
const chennaiSensors = generateSensorsForPlant('plant-1', [
  'pH', 'flow', 'pressure', 'temperature', 'turbidity', 'chlorine', 'DO', 'level'
]);

// Mumbai WTP-02 Sensors
const mumbaiSensors = generateSensorsForPlant('plant-2', [
  'pH', 'flow', 'pressure', 'temperature', 'turbidity', 'chlorine', 'conductivity', 'ORP'
]);

// Delhi WTP-03 Sensors (one in warning state)
const delhiSensors = generateSensorsForPlant('plant-3', [
  'pH', 'flow', 'pressure', 'temperature', 'turbidity', 'chlorine', 'level', 'conductivity'
]);
// Manually set one sensor to warning state
delhiSensors[0].currentValue = 8.3; // pH near upper limit
delhiSensors[0].status = 'warning';

// Bangalore WTP-04 Sensors
const bangaloreSensors = generateSensorsForPlant('plant-4', [
  'pH', 'flow', 'pressure', 'temperature', 'turbidity', 'chlorine'
]);

// Hyderabad WTP-05 Sensors
const hyderabadSensors = generateSensorsForPlant('plant-5', [
  'pH', 'flow', 'pressure', 'temperature', 'turbidity', 'level'
]);

// Pune WTP-06 Sensors (offline plant - sensors show last known values)
const puneSensors = generateSensorsForPlant('plant-6', [
  'pH', 'flow', 'pressure', 'temperature'
]);
puneSensors.forEach(sensor => {
  sensor.lastUpdated = new Date(Date.now() - 120000); // 2 minutes ago - offline
  sensor.commStatus = 'offline';
});

export const mockSensors: Sensor[] = [
  ...chennaiSensors,
  ...mumbaiSensors,
  ...delhiSensors,
  ...bangaloreSensors,
  ...hyderabadSensors,
  ...puneSensors,
];

export const getSensorsByPlant = (plantId: string): Sensor[] => {
  return mockSensors.filter(sensor => sensor.plantId === plantId);
};

export const getSensorById = (id: string): Sensor | undefined => {
  return mockSensors.find(sensor => sensor.id === id);
};

export const getSensorsByStatus = (status: SensorStatus): Sensor[] => {
  return mockSensors.filter(sensor => sensor.status === status);
};

export const getSensorsByType = (type: SensorType): Sensor[] => {
  return mockSensors.filter(sensor => sensor.type === type);
};

export const getCriticalSensorsCount = (): number => {
  return mockSensors.filter(sensor => sensor.status === 'critical').length;
};

export const getWarningSensorsCount = (): number => {
  return mockSensors.filter(sensor => sensor.status === 'warning').length;
};

// Simulate real-time value updates
export const updateSensorValue = (sensorId: string): Sensor | undefined => {
  const sensor = mockSensors.find(s => s.id === sensorId);
  if (!sensor) return undefined;

  const config = sensorConfigs[sensor.type];
  const change = (Math.random() - 0.5) * config.variance * 0.2;
  sensor.currentValue = parseFloat((sensor.currentValue + change).toFixed(2));
  sensor.status = getStatus(sensor.currentValue, sensor.minThreshold, sensor.maxThreshold);
  sensor.lastUpdated = new Date();
  sensor.commStatus = 'online';

  // Add to history
  sensor.history.push({
    timestamp: new Date(),
    value: sensor.currentValue,
  });

  // Keep only last 24 readings
  if (sensor.history.length > 24) {
    sensor.history.shift();
  }

  return sensor;
};

// Update all sensors for a plant
export const updateAllSensorsForPlant = (plantId: string): Sensor[] => {
  const plantSensors = mockSensors.filter(s => s.plantId === plantId);
  plantSensors.forEach(sensor => {
    // Skip offline plants (plant-6)
    if (sensor.plantId === 'plant-6') return;

    const config = sensorConfigs[sensor.type];
    const change = (Math.random() - 0.5) * config.variance * 0.15;
    sensor.currentValue = parseFloat((sensor.currentValue + change).toFixed(2));
    sensor.status = getStatus(sensor.currentValue, sensor.minThreshold, sensor.maxThreshold);
    sensor.lastUpdated = new Date();
    sensor.commStatus = 'online';

    // Add to history occasionally (every 5 updates roughly)
    if (Math.random() < 0.2) {
      sensor.history.push({
        timestamp: new Date(),
        value: sensor.currentValue,
      });
      if (sensor.history.length > 24) {
        sensor.history.shift();
      }
    }
  });
  return plantSensors;
};

// Refresh comm status based on lastUpdated
export const refreshCommStatus = (): void => {
  mockSensors.forEach(sensor => {
    sensor.commStatus = getCommStatus(sensor.lastUpdated);
  });
};
