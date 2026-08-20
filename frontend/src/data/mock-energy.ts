// Energy Management Mock Data

export interface EnergyReading {
  id: string;
  plantId: string;
  meterId: string;
  timestamp: Date;
  activeEnergy: number; // kWh
  reactiveEnergy: number; // kVArh
  apparentPower: number; // kVA
  activePower: number; // kW
  powerFactor: number;
  voltage: { r: number; y: number; b: number };
  current: { r: number; y: number; b: number };
  frequency: number;
}

export interface EnergyKPI {
  plantId: string;
  plantName: string;
  period: { start: Date; end: Date };
  totalEnergy: number; // kWh
  totalWaterProcessed: number; // m³
  specificEnergy: number; // kWh/m³
  averagePowerFactor: number;
  peakDemand: number; // kW
  peakDemandTime: Date;
  loadFactor: number; // %
  energyCost: number; // ₹
  costPerCubicMeter: number; // ₹/m³
  carbonEmissions: number; // kg CO2
  comparisonWithBenchmark: number; // %
}

export interface EquipmentEnergy {
  id: string;
  name: string;
  type: string;
  plantId: string;
  ratedPower: number; // kW
  currentPower: number; // kW
  runningHours: number;
  energyConsumed: number; // kWh
  percentageOfTotal: number;
  status: 'running' | 'stopped' | 'standby';
}

export interface EnergyTrend {
  timestamp: Date;
  energy: number;
  cost: number;
  waterProcessed: number;
}

// Generate hourly data for the last 24 hours
const generateHourlyData = (): EnergyTrend[] => {
  const data: EnergyTrend[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 3600000);
    const hour = timestamp.getHours();

    // Simulate higher energy during day hours
    const baseEnergy = hour >= 6 && hour <= 22 ? 120 : 80;
    const energy = baseEnergy + Math.random() * 40;

    data.push({
      timestamp,
      energy: Math.round(energy * 10) / 10,
      cost: Math.round(energy * 7.5 * 10) / 10,
      waterProcessed: Math.round((energy / 1.8) * 10) / 10,
    });
  }

  return data;
};

// Generate daily data for the last 30 days
const generateDailyData = (): EnergyTrend[] => {
  const data: EnergyTrend[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 3600000);
    const isWeekend = timestamp.getDay() === 0 || timestamp.getDay() === 6;

    // Simulate lower energy on weekends
    const baseEnergy = isWeekend ? 1800 : 2400;
    const energy = baseEnergy + Math.random() * 400;

    data.push({
      timestamp,
      energy: Math.round(energy),
      cost: Math.round(energy * 7.5),
      waterProcessed: Math.round(energy / 1.85),
    });
  }

  return data;
};

export const mockEnergyKPIs: EnergyKPI[] = [
  {
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    period: { start: new Date('2024-12-01'), end: new Date('2024-12-12') },
    totalEnergy: 28450,
    totalWaterProcessed: 15200,
    specificEnergy: 1.87,
    averagePowerFactor: 0.92,
    peakDemand: 185,
    peakDemandTime: new Date('2024-12-10T14:30:00'),
    loadFactor: 72,
    energyCost: 213375,
    costPerCubicMeter: 14.04,
    carbonEmissions: 22760,
    comparisonWithBenchmark: -5.2,
  },
  {
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    period: { start: new Date('2024-12-01'), end: new Date('2024-12-12') },
    totalEnergy: 35680,
    totalWaterProcessed: 19500,
    specificEnergy: 1.83,
    averagePowerFactor: 0.94,
    peakDemand: 220,
    peakDemandTime: new Date('2024-12-09T15:00:00'),
    loadFactor: 75,
    energyCost: 267600,
    costPerCubicMeter: 13.72,
    carbonEmissions: 28544,
    comparisonWithBenchmark: -8.1,
  },
  {
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    period: { start: new Date('2024-12-01'), end: new Date('2024-12-12') },
    totalEnergy: 31200,
    totalWaterProcessed: 16800,
    specificEnergy: 1.86,
    averagePowerFactor: 0.89,
    peakDemand: 195,
    peakDemandTime: new Date('2024-12-11T13:45:00'),
    loadFactor: 68,
    energyCost: 234000,
    costPerCubicMeter: 13.93,
    carbonEmissions: 24960,
    comparisonWithBenchmark: -3.8,
  },
  {
    plantId: 'plant-4',
    plantName: 'Bangalore WTP-04',
    period: { start: new Date('2024-12-01'), end: new Date('2024-12-12') },
    totalEnergy: 22100,
    totalWaterProcessed: 12500,
    specificEnergy: 1.77,
    averagePowerFactor: 0.95,
    peakDemand: 145,
    peakDemandTime: new Date('2024-12-08T11:30:00'),
    loadFactor: 78,
    energyCost: 165750,
    costPerCubicMeter: 13.26,
    carbonEmissions: 17680,
    comparisonWithBenchmark: -12.4,
  },
  {
    plantId: 'plant-5',
    plantName: 'Hyderabad WTP-05',
    period: { start: new Date('2024-12-01'), end: new Date('2024-12-12') },
    totalEnergy: 19800,
    totalWaterProcessed: 10600,
    specificEnergy: 1.87,
    averagePowerFactor: 0.91,
    peakDemand: 130,
    peakDemandTime: new Date('2024-12-10T16:00:00'),
    loadFactor: 70,
    energyCost: 148500,
    costPerCubicMeter: 14.01,
    carbonEmissions: 15840,
    comparisonWithBenchmark: -4.9,
  },
  {
    plantId: 'plant-6',
    plantName: 'Pune WTP-06',
    period: { start: new Date('2024-12-01'), end: new Date('2024-12-12') },
    totalEnergy: 0,
    totalWaterProcessed: 0,
    specificEnergy: 0,
    averagePowerFactor: 0,
    peakDemand: 0,
    peakDemandTime: new Date(),
    loadFactor: 0,
    energyCost: 0,
    costPerCubicMeter: 0,
    carbonEmissions: 0,
    comparisonWithBenchmark: 0,
  },
];

export const mockEquipmentEnergy: EquipmentEnergy[] = [
  {
    id: 'eq-1',
    name: 'RO High Pressure Pump A',
    type: 'Pump',
    plantId: 'plant-1',
    ratedPower: 75,
    currentPower: 68,
    runningHours: 288,
    energyConsumed: 19584,
    percentageOfTotal: 45,
    status: 'running',
  },
  {
    id: 'eq-2',
    name: 'Feed Pump B',
    type: 'Pump',
    plantId: 'plant-1',
    ratedPower: 37,
    currentPower: 32,
    runningHours: 288,
    energyConsumed: 9216,
    percentageOfTotal: 28,
    status: 'running',
  },
  {
    id: 'eq-3',
    name: 'Dosing System',
    type: 'Dosing',
    plantId: 'plant-1',
    ratedPower: 5.5,
    currentPower: 4.2,
    runningHours: 288,
    energyConsumed: 1210,
    percentageOfTotal: 8,
    status: 'running',
  },
  {
    id: 'eq-4',
    name: 'Instrumentation Panel',
    type: 'Instrumentation',
    plantId: 'plant-1',
    ratedPower: 3,
    currentPower: 2.5,
    runningHours: 288,
    energyConsumed: 720,
    percentageOfTotal: 6,
    status: 'running',
  },
  {
    id: 'eq-5',
    name: 'Backwash Pump',
    type: 'Pump',
    plantId: 'plant-1',
    ratedPower: 22,
    currentPower: 0,
    runningHours: 24,
    energyConsumed: 528,
    percentageOfTotal: 5,
    status: 'standby',
  },
  {
    id: 'eq-6',
    name: 'CIP Pump',
    type: 'Pump',
    plantId: 'plant-1',
    ratedPower: 15,
    currentPower: 0,
    runningHours: 8,
    energyConsumed: 120,
    percentageOfTotal: 3,
    status: 'stopped',
  },
  {
    id: 'eq-7',
    name: 'Utilities (Lighting, HVAC)',
    type: 'Utilities',
    plantId: 'plant-1',
    ratedPower: 10,
    currentPower: 6,
    runningHours: 288,
    energyConsumed: 1728,
    percentageOfTotal: 5,
    status: 'running',
  },
];

export const hourlyEnergyData = generateHourlyData();
export const dailyEnergyData = generateDailyData();

export const getEnergyKPIByPlant = (plantId: string): EnergyKPI | undefined => {
  return mockEnergyKPIs.find((kpi) => kpi.plantId === plantId);
};

export const getEquipmentByPlant = (plantId: string): EquipmentEnergy[] => {
  return mockEquipmentEnergy.filter((eq) => eq.plantId === plantId);
};

export const getTotalEnergyConsumed = (): number => {
  return mockEnergyKPIs.reduce((acc, kpi) => acc + kpi.totalEnergy, 0);
};

export const getTotalEnergyCost = (): number => {
  return mockEnergyKPIs.reduce((acc, kpi) => acc + kpi.energyCost, 0);
};

export const getTotalCarbonEmissions = (): number => {
  return mockEnergyKPIs.reduce((acc, kpi) => acc + kpi.carbonEmissions, 0);
};

export const getAverageSpecificEnergy = (): number => {
  const activePlants = mockEnergyKPIs.filter((kpi) => kpi.totalEnergy > 0);
  if (activePlants.length === 0) return 0;
  return (
    Math.round(
      (activePlants.reduce((acc, kpi) => acc + kpi.specificEnergy, 0) / activePlants.length) * 100
    ) / 100
  );
};

export const getAveragePowerFactor = (): number => {
  const activePlants = mockEnergyKPIs.filter((kpi) => kpi.averagePowerFactor > 0);
  if (activePlants.length === 0) return 0;
  return (
    Math.round(
      (activePlants.reduce((acc, kpi) => acc + kpi.averagePowerFactor, 0) / activePlants.length) *
        100
    ) / 100
  );
};

// Sustainability metrics
export interface SustainabilityMetrics {
  carbonFootprint: number; // tons CO2
  renewablePercentage: number;
  waterRecycled: number; // m³
  chemicalReduction: number; // %
  wasteReduction: number; // %
  treesEquivalent: number;
}

export const mockSustainabilityMetrics: SustainabilityMetrics = {
  carbonFootprint: 109.78, // tons CO2 this month
  renewablePercentage: 15,
  waterRecycled: 12500,
  chemicalReduction: 8.5,
  wasteReduction: 12.3,
  treesEquivalent: 5489,
};
