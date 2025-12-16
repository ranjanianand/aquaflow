import { Sensor, SensorReading, SensorType, SensorStatus, SensorCommStatus, SensorPriority } from '@/types';

// Seeded random number generator for deterministic values
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate deterministic historical readings
const generateHistory = (baseValue: number, variance: number, seed: number, count: number = 24): SensorReading[] => {
  const history: SensorReading[] = [];
  const now = new Date('2025-01-15T12:00:00Z').getTime();

  for (let i = count - 1; i >= 0; i--) {
    const randomOffset = (seededRandom(seed + i) - 0.5) * variance * 2;
    history.push({
      timestamp: new Date(now - i * 3600000),
      value: parseFloat((baseValue + randomOffset).toFixed(2)),
    });
  }

  return history;
};

// Determine status based on thresholds
const getStatus = (value: number, min: number, max: number): SensorStatus => {
  if (value < min || value > max) return 'critical';
  const range = max - min;
  const warningBuffer = range * 0.1;
  if (value < min + warningBuffer || value > max - warningBuffer) return 'warning';
  return 'normal';
};

// Sensor configurations by type
const sensorConfigs: Record<SensorType, { unit: string; min: number; max: number; base: number; setpoint: number; variance: number }> = {
  pH: { unit: 'pH', min: 6.5, max: 8.5, base: 7.2, setpoint: 7.0, variance: 0.5 },
  flow: { unit: 'm³/h', min: 100, max: 500, base: 350, setpoint: 300, variance: 50 },
  pressure: { unit: 'bar', min: 2.0, max: 6.0, base: 4.2, setpoint: 4.0, variance: 0.5 },
  temperature: { unit: '°C', min: 15, max: 35, base: 24, setpoint: 25, variance: 3 },
  turbidity: { unit: 'NTU', min: 0, max: 4.0, base: 1.2, setpoint: 1.0, variance: 0.8 },
  chlorine: { unit: 'mg/L', min: 0.2, max: 2.0, base: 0.8, setpoint: 1.0, variance: 0.3 },
  DO: { unit: 'mg/L', min: 4.0, max: 12.0, base: 7.5, setpoint: 8.0, variance: 1.5 },
  level: { unit: '%', min: 20, max: 95, base: 72, setpoint: 75, variance: 15 },
  conductivity: { unit: 'µS/cm', min: 200, max: 800, base: 450, setpoint: 400, variance: 100 },
  ORP: { unit: 'mV', min: 200, max: 800, base: 650, setpoint: 600, variance: 100 },
};

// Get communication status based on lastUpdated
const getCommStatus = (lastUpdated: Date): SensorCommStatus => {
  const now = Date.now();
  const age = now - lastUpdated.getTime();
  if (age > 60000) return 'offline';
  if (age > 30000) return 'stale';
  return 'online';
};

// Location names for realistic sensor naming
const locations: Record<string, string[]> = {
  'plant-1': ['Raw Water Intake', 'Flash Mixer', 'Flocculation Tank A', 'Flocculation Tank B', 'Clarifier 1', 'Clarifier 2', 'Sand Filter 1', 'Sand Filter 2', 'Sand Filter 3', 'GAC Filter', 'Clear Water Tank', 'Chlorine Contact Tank', 'Distribution Pump', 'Outlet Chamber'],
  'plant-2': ['Intake Well', 'Pre-Chlorination', 'Aeration Tank', 'Primary Clarifier', 'Secondary Clarifier', 'Rapid Sand Filter 1', 'Rapid Sand Filter 2', 'Rapid Sand Filter 3', 'Rapid Sand Filter 4', 'Activated Carbon', 'Post-Chlorination', 'Storage Tank A', 'Storage Tank B', 'Booster Station'],
  'plant-3': ['River Intake', 'Screen Chamber', 'Coagulation Basin', 'Sedimentation Tank 1', 'Sedimentation Tank 2', 'Dual Media Filter 1', 'Dual Media Filter 2', 'Dual Media Filter 3', 'UV Disinfection', 'Fluoridation', 'Ground Storage', 'Elevated Tank', 'Distribution Main'],
  'plant-4': ['Bore Well 1', 'Bore Well 2', 'Collection Sump', 'Iron Removal Filter', 'Softening Unit', 'RO Stage 1', 'RO Stage 2', 'Permeate Tank', 'Remineralization', 'Final Tank', 'Dispatch Pump'],
  'plant-5': ['Lake Intake', 'Strainer', 'Chemical Dosing', 'Mixing Chamber', 'Tube Settler 1', 'Tube Settler 2', 'Pressure Filter 1', 'Pressure Filter 2', 'Ozone Contact', 'Balance Tank', 'Dispatch'],
  'plant-6': ['Well Pump', 'Holding Tank', 'Treatment Unit', 'Clean Water Tank', 'Distribution'],
};

// Priority distribution (70% normal, 20% medium, 7% high, 3% critical)
const getPriority = (seed: number): SensorPriority => {
  const rand = seededRandom(seed);
  if (rand < 0.03) return 'critical';
  if (rand < 0.10) return 'high';
  if (rand < 0.30) return 'medium';
  return 'low';
};

// Sensor type priorities (some types are inherently more critical)
const typePriorityBoost: Partial<Record<SensorType, SensorPriority>> = {
  chlorine: 'high',
  turbidity: 'high',
  pH: 'medium',
};

// Status distribution: 70% normal, 20% warning, 10% critical
const getStatusDistribution = (seed: number, baseStatus: SensorStatus): SensorStatus => {
  const rand = seededRandom(seed * 7);
  if (rand < 0.10) return 'critical';
  if (rand < 0.30) return 'warning';
  return baseStatus;
};

// Plant sensor distribution - total ~250 sensors
const plantSensorConfig: Record<string, { count: number; sensorTypes: SensorType[] }> = {
  'plant-1': {
    count: 52,
    sensorTypes: ['pH', 'flow', 'pressure', 'temperature', 'turbidity', 'chlorine', 'DO', 'level', 'conductivity', 'ORP'],
  },
  'plant-2': {
    count: 48,
    sensorTypes: ['pH', 'flow', 'pressure', 'temperature', 'turbidity', 'chlorine', 'DO', 'level', 'conductivity'],
  },
  'plant-3': {
    count: 45,
    sensorTypes: ['pH', 'flow', 'pressure', 'temperature', 'turbidity', 'chlorine', 'level', 'conductivity', 'ORP'],
  },
  'plant-4': {
    count: 42,
    sensorTypes: ['pH', 'flow', 'pressure', 'temperature', 'turbidity', 'conductivity', 'DO', 'level'],
  },
  'plant-5': {
    count: 38,
    sensorTypes: ['pH', 'flow', 'pressure', 'temperature', 'turbidity', 'chlorine', 'level', 'ORP'],
  },
  'plant-6': {
    count: 25,
    sensorTypes: ['pH', 'flow', 'pressure', 'temperature', 'turbidity', 'chlorine'],
  },
};

// Generate sensor tag
const generateTag = (type: SensorType, plantId: string, index: number): string => {
  const typePrefix: Record<SensorType, string> = {
    pH: 'PH',
    flow: 'FLW',
    pressure: 'PRS',
    temperature: 'TMP',
    turbidity: 'TUR',
    chlorine: 'CHL',
    DO: 'DOX',
    level: 'LVL',
    conductivity: 'CON',
    ORP: 'ORP',
  };
  const plantNum = plantId.replace('plant-', '');
  return `${typePrefix[type]}-${plantNum}${String(index + 1).padStart(3, '0')}`;
};

// Generate sensors for a plant with scaled distribution
const generateSensorsForPlant = (plantId: string): Sensor[] => {
  const config = plantSensorConfig[plantId];
  if (!config) return [];

  const plantLocations = locations[plantId] || ['Main Area'];
  const now = new Date();
  const sensors: Sensor[] = [];
  const isOfflinePlant = plantId === 'plant-6';

  let typeIndex: Record<SensorType, number> = {
    pH: 0, flow: 0, pressure: 0, temperature: 0, turbidity: 0,
    chlorine: 0, DO: 0, level: 0, conductivity: 0, ORP: 0,
  };

  for (let i = 0; i < config.count; i++) {
    const type = config.sensorTypes[i % config.sensorTypes.length];
    const sensorConfig = sensorConfigs[type];
    const locationIndex = i % plantLocations.length;
    const location = plantLocations[locationIndex];

    // Deterministic seed based on plant and sensor index
    const seed = plantId.charCodeAt(plantId.length - 1) * 1000 + i;

    // Generate value with some variation
    const valueVariation = (seededRandom(seed) - 0.5) * sensorConfig.variance * 1.5;
    let currentValue = parseFloat((sensorConfig.base + valueVariation).toFixed(2));

    // Clamp to reasonable bounds
    currentValue = Math.max(sensorConfig.min * 0.9, Math.min(sensorConfig.max * 1.1, currentValue));

    let status = getStatus(currentValue, sensorConfig.min, sensorConfig.max);

    // Apply status distribution for variety
    status = getStatusDistribution(seed, status);

    // Adjust value if status was changed
    if (status === 'critical' && currentValue >= sensorConfig.min && currentValue <= sensorConfig.max) {
      currentValue = seededRandom(seed + 100) > 0.5
        ? sensorConfig.max * 1.05
        : sensorConfig.min * 0.95;
      currentValue = parseFloat(currentValue.toFixed(2));
    } else if (status === 'warning' && currentValue >= sensorConfig.min + (sensorConfig.max - sensorConfig.min) * 0.15 && currentValue <= sensorConfig.max - (sensorConfig.max - sensorConfig.min) * 0.15) {
      const range = sensorConfig.max - sensorConfig.min;
      currentValue = seededRandom(seed + 200) > 0.5
        ? sensorConfig.max - range * 0.08
        : sensorConfig.min + range * 0.08;
      currentValue = parseFloat(currentValue.toFixed(2));
    }

    // Determine priority
    let priority = getPriority(seed + 300);
    if (typePriorityBoost[type] && priority === 'low') {
      priority = typePriorityBoost[type]!;
    }

    const lastUpdated = isOfflinePlant
      ? new Date(Date.now() - 120000)
      : now;

    typeIndex[type]++;

    sensors.push({
      id: `${plantId}-sensor-${i + 1}`,
      plantId,
      name: `${location} - ${type.toUpperCase()}`,
      type,
      unit: sensorConfig.unit,
      currentValue,
      minThreshold: sensorConfig.min,
      maxThreshold: sensorConfig.max,
      setpoint: sensorConfig.setpoint,
      status,
      commStatus: isOfflinePlant ? 'offline' : getCommStatus(lastUpdated),
      lastUpdated,
      history: generateHistory(sensorConfig.base, sensorConfig.variance, seed),
      priority,
      location,
      tag: generateTag(type, plantId, typeIndex[type] - 1),
    });
  }

  return sensors;
};

// Generate all sensors for all plants
const generateAllSensors = (): Sensor[] => {
  const allSensors: Sensor[] = [];

  Object.keys(plantSensorConfig).forEach(plantId => {
    const plantSensors = generateSensorsForPlant(plantId);
    allSensors.push(...plantSensors);
  });

  return allSensors;
};

export const mockSensors: Sensor[] = generateAllSensors();

// Helper functions
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

export const getSensorsByPriority = (priority: SensorPriority): Sensor[] => {
  return mockSensors.filter(sensor => sensor.priority === priority);
};

export const getCriticalSensorsCount = (): number => {
  return mockSensors.filter(sensor => sensor.status === 'critical').length;
};

export const getWarningSensorsCount = (): number => {
  return mockSensors.filter(sensor => sensor.status === 'warning').length;
};

export const getTotalSensorCount = (): number => {
  return mockSensors.length;
};

export const getSensorCountByPlant = (plantId: string): number => {
  return mockSensors.filter(sensor => sensor.plantId === plantId).length;
};

// Stats summary
export const getSensorStats = () => {
  const total = mockSensors.length;
  const normal = mockSensors.filter(s => s.status === 'normal').length;
  const warning = mockSensors.filter(s => s.status === 'warning').length;
  const critical = mockSensors.filter(s => s.status === 'critical').length;
  const online = mockSensors.filter(s => s.commStatus === 'online').length;
  const offline = mockSensors.filter(s => s.commStatus === 'offline').length;

  const byPriority = {
    critical: mockSensors.filter(s => s.priority === 'critical').length,
    high: mockSensors.filter(s => s.priority === 'high').length,
    medium: mockSensors.filter(s => s.priority === 'medium').length,
    low: mockSensors.filter(s => s.priority === 'low').length,
  };

  const byType: Record<string, number> = {};
  mockSensors.forEach(s => {
    byType[s.type] = (byType[s.type] || 0) + 1;
  });

  return {
    total,
    status: { normal, warning, critical },
    comm: { online, offline },
    priority: byPriority,
    byType,
  };
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

  sensor.history.push({
    timestamp: new Date(),
    value: sensor.currentValue,
  });

  if (sensor.history.length > 24) {
    sensor.history.shift();
  }

  return sensor;
};

// Update all sensors for a plant
export const updateAllSensorsForPlant = (plantId: string): Sensor[] => {
  const plantSensors = mockSensors.filter(s => s.plantId === plantId);
  plantSensors.forEach(sensor => {
    if (sensor.plantId === 'plant-6') return; // Skip offline plant

    const config = sensorConfigs[sensor.type];
    const change = (Math.random() - 0.5) * config.variance * 0.15;
    sensor.currentValue = parseFloat((sensor.currentValue + change).toFixed(2));
    sensor.status = getStatus(sensor.currentValue, sensor.minThreshold, sensor.maxThreshold);
    sensor.lastUpdated = new Date();
    sensor.commStatus = 'online';

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

// Refresh comm status
export const refreshCommStatus = (): void => {
  mockSensors.forEach(sensor => {
    sensor.commStatus = getCommStatus(sensor.lastUpdated);
  });
};

// Console log stats on load (for debugging)
if (typeof window !== 'undefined') {
  console.log('Sensor Stats:', getSensorStats());
}
