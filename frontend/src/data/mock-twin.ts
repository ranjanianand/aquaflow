// Mock data for Virtual Twin Sandbox

export interface TwinParameter {
  id: string;
  name: string;
  category: 'pump' | 'chemical' | 'filter' | 'process' | 'environmental';
  currentValue: number;
  simulatedValue: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  description: string;
}

export interface SimulationOutcome {
  metric: string;
  category: 'energy' | 'quality' | 'throughput' | 'cost' | 'environmental';
  currentValue: number;
  simulatedValue: number;
  unit: string;
  change: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  parameters: { parameterId: string; value: number }[];
  createdAt: Date;
  createdBy: string;
  isFavorite: boolean;
}

export interface HistoricalSnapshot {
  timestamp: Date;
  parameters: Record<string, number>;
  outcomes: SimulationOutcome[];
}

// Available parameters for simulation
export const twinParameters: TwinParameter[] = [
  // Pump Parameters
  {
    id: 'pump-speed-ro',
    name: 'RO Feed Pump Speed',
    category: 'pump',
    currentValue: 2850,
    simulatedValue: 2850,
    unit: 'RPM',
    min: 1500,
    max: 3500,
    step: 50,
    description: 'Controls feed water pressure to RO membranes',
  },
  {
    id: 'pump-speed-hp',
    name: 'High Pressure Pump',
    category: 'pump',
    currentValue: 3200,
    simulatedValue: 3200,
    unit: 'RPM',
    min: 2000,
    max: 4000,
    step: 50,
    description: 'Main pressure source for RO system',
  },
  {
    id: 'pump-recirculation',
    name: 'Recirculation Rate',
    category: 'pump',
    currentValue: 450,
    simulatedValue: 450,
    unit: 'm³/h',
    min: 200,
    max: 800,
    step: 25,
    description: 'Clarifier recirculation flow rate',
  },

  // Chemical Dosing Parameters
  {
    id: 'dosing-chlorine',
    name: 'Chlorine Dosing',
    category: 'chemical',
    currentValue: 2.4,
    simulatedValue: 2.4,
    unit: 'mg/L',
    min: 0.5,
    max: 5.0,
    step: 0.1,
    description: 'Post-treatment chlorine dosing rate',
  },
  {
    id: 'dosing-coagulant',
    name: 'Coagulant Dosing',
    category: 'chemical',
    currentValue: 45,
    simulatedValue: 45,
    unit: 'mg/L',
    min: 20,
    max: 80,
    step: 1,
    description: 'Alum/PAC dosing for flocculation',
  },
  {
    id: 'dosing-antiscalant',
    name: 'Antiscalant Dosing',
    category: 'chemical',
    currentValue: 3.5,
    simulatedValue: 3.5,
    unit: 'mg/L',
    min: 1.0,
    max: 8.0,
    step: 0.5,
    description: 'RO membrane antiscalant dosing',
  },

  // Filter Parameters
  {
    id: 'filter-backwash',
    name: 'Backwash Interval',
    category: 'filter',
    currentValue: 8,
    simulatedValue: 8,
    unit: 'hours',
    min: 4,
    max: 24,
    step: 1,
    description: 'Time between filter backwash cycles',
  },
  {
    id: 'ro-recovery',
    name: 'RO Recovery Rate',
    category: 'filter',
    currentValue: 75,
    simulatedValue: 75,
    unit: '%',
    min: 50,
    max: 90,
    step: 1,
    description: 'Percentage of feed water converted to permeate',
  },

  // Process Parameters
  {
    id: 'process-ph-target',
    name: 'pH Setpoint',
    category: 'process',
    currentValue: 7.2,
    simulatedValue: 7.2,
    unit: 'pH',
    min: 6.0,
    max: 8.5,
    step: 0.1,
    description: 'Target pH for treated water',
  },
  {
    id: 'process-retention',
    name: 'Retention Time',
    category: 'process',
    currentValue: 45,
    simulatedValue: 45,
    unit: 'min',
    min: 20,
    max: 90,
    step: 5,
    description: 'Clarifier retention time',
  },

  // Environmental Parameters
  {
    id: 'env-inlet-turbidity',
    name: 'Inlet Turbidity',
    category: 'environmental',
    currentValue: 12,
    simulatedValue: 12,
    unit: 'NTU',
    min: 2,
    max: 50,
    step: 1,
    description: 'Simulated raw water turbidity',
  },
  {
    id: 'env-temperature',
    name: 'Water Temperature',
    category: 'environmental',
    currentValue: 28,
    simulatedValue: 28,
    unit: '°C',
    min: 15,
    max: 40,
    step: 1,
    description: 'Inlet water temperature',
  },
];

// Calculate simulation outcomes based on parameter changes
export const calculateOutcomes = (parameters: TwinParameter[]): SimulationOutcome[] => {
  // This is a simplified simulation model - in production, this would use actual process models
  const outcomes: SimulationOutcome[] = [];

  // Find parameter changes
  const pumpSpeedRO = parameters.find(p => p.id === 'pump-speed-ro');
  const chlorineDosing = parameters.find(p => p.id === 'dosing-chlorine');
  const roRecovery = parameters.find(p => p.id === 'ro-recovery');
  const backwashInterval = parameters.find(p => p.id === 'filter-backwash');
  const coagulantDosing = parameters.find(p => p.id === 'dosing-coagulant');
  const inletTurbidity = parameters.find(p => p.id === 'env-inlet-turbidity');

  // Energy consumption calculation
  let energyChange = 0;
  if (pumpSpeedRO) {
    const speedChange = (pumpSpeedRO.simulatedValue - pumpSpeedRO.currentValue) / pumpSpeedRO.currentValue;
    energyChange += speedChange * 150; // Approximate energy impact
  }

  const baseEnergy = 2450;
  const simulatedEnergy = baseEnergy + energyChange;
  outcomes.push({
    metric: 'Energy Consumption',
    category: 'energy',
    currentValue: baseEnergy,
    simulatedValue: Math.round(simulatedEnergy),
    unit: 'kWh/day',
    change: Math.round(((simulatedEnergy - baseEnergy) / baseEnergy) * 100 * 10) / 10,
    impact: simulatedEnergy < baseEnergy ? 'positive' : simulatedEnergy > baseEnergy ? 'negative' : 'neutral',
  });

  // Chemical cost calculation
  let chemicalChange = 0;
  if (chlorineDosing) {
    const dosingChange = (chlorineDosing.simulatedValue - chlorineDosing.currentValue) / chlorineDosing.currentValue;
    chemicalChange += dosingChange * 8500; // ₹ per day
  }
  if (coagulantDosing) {
    const dosingChange = (coagulantDosing.simulatedValue - coagulantDosing.currentValue) / coagulantDosing.currentValue;
    chemicalChange += dosingChange * 12000; // ₹ per day
  }

  const baseChemicalCost = 24500;
  const simulatedChemicalCost = baseChemicalCost + chemicalChange;
  outcomes.push({
    metric: 'Chemical Cost',
    category: 'cost',
    currentValue: baseChemicalCost,
    simulatedValue: Math.round(simulatedChemicalCost),
    unit: '₹/day',
    change: Math.round(((simulatedChemicalCost - baseChemicalCost) / baseChemicalCost) * 100 * 10) / 10,
    impact: simulatedChemicalCost < baseChemicalCost ? 'positive' : simulatedChemicalCost > baseChemicalCost ? 'negative' : 'neutral',
  });

  // Water recovery calculation
  let recoveryChange = 0;
  if (roRecovery) {
    recoveryChange = roRecovery.simulatedValue - roRecovery.currentValue;
  }
  if (backwashInterval) {
    const intervalChange = (backwashInterval.simulatedValue - backwashInterval.currentValue) / backwashInterval.currentValue;
    recoveryChange += intervalChange * 2; // % points
  }

  const baseRecovery = 94.2;
  const simulatedRecovery = Math.min(99, Math.max(85, baseRecovery + recoveryChange));
  outcomes.push({
    metric: 'Water Recovery',
    category: 'throughput',
    currentValue: baseRecovery,
    simulatedValue: Math.round(simulatedRecovery * 10) / 10,
    unit: '%',
    change: Math.round((simulatedRecovery - baseRecovery) * 10) / 10,
    impact: simulatedRecovery > baseRecovery ? 'positive' : simulatedRecovery < baseRecovery ? 'negative' : 'neutral',
  });

  // Output quality calculation
  let qualityChange = 0;
  if (chlorineDosing) {
    qualityChange += chlorineDosing.simulatedValue - chlorineDosing.currentValue > 0 ? 5 : -3;
  }
  if (coagulantDosing && inletTurbidity) {
    const ratio = coagulantDosing.simulatedValue / inletTurbidity.simulatedValue;
    if (ratio > 4) qualityChange += 8;
    else if (ratio < 2.5) qualityChange -= 10;
  }

  const baseQuality = 92;
  const simulatedQuality = Math.min(100, Math.max(70, baseQuality + qualityChange));
  outcomes.push({
    metric: 'Output Quality Score',
    category: 'quality',
    currentValue: baseQuality,
    simulatedValue: Math.round(simulatedQuality),
    unit: 'pts',
    change: simulatedQuality - baseQuality,
    impact: simulatedQuality > baseQuality ? 'positive' : simulatedQuality < baseQuality ? 'negative' : 'neutral',
  });

  // Throughput calculation
  let throughputChange = 0;
  if (pumpSpeedRO) {
    const speedRatio = pumpSpeedRO.simulatedValue / pumpSpeedRO.currentValue;
    throughputChange += (speedRatio - 1) * 850;
  }
  if (roRecovery) {
    throughputChange += (roRecovery.simulatedValue - roRecovery.currentValue) * 10;
  }

  const baseThroughput = 8500;
  const simulatedThroughput = baseThroughput + throughputChange;
  outcomes.push({
    metric: 'Daily Throughput',
    category: 'throughput',
    currentValue: baseThroughput,
    simulatedValue: Math.round(simulatedThroughput),
    unit: 'm³/day',
    change: Math.round(((simulatedThroughput - baseThroughput) / baseThroughput) * 100 * 10) / 10,
    impact: simulatedThroughput > baseThroughput ? 'positive' : simulatedThroughput < baseThroughput ? 'negative' : 'neutral',
  });

  // Carbon footprint calculation
  const carbonPerKwh = 0.82; // kg CO2 per kWh (India grid average)
  const baseCarbonDaily = baseEnergy * carbonPerKwh;
  const simulatedCarbonDaily = simulatedEnergy * carbonPerKwh;
  outcomes.push({
    metric: 'Carbon Footprint',
    category: 'environmental',
    currentValue: Math.round(baseCarbonDaily),
    simulatedValue: Math.round(simulatedCarbonDaily),
    unit: 'kg CO₂/day',
    change: Math.round(((simulatedCarbonDaily - baseCarbonDaily) / baseCarbonDaily) * 100 * 10) / 10,
    impact: simulatedCarbonDaily < baseCarbonDaily ? 'positive' : simulatedCarbonDaily > baseCarbonDaily ? 'negative' : 'neutral',
  });

  return outcomes;
};

// Generate historical snapshots for playback
export const generateHistoricalSnapshots = (hours: number = 24): HistoricalSnapshot[] => {
  const snapshots: HistoricalSnapshot[] = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const parameters: Record<string, number> = {};

    // Simulate parameter variations over time
    twinParameters.forEach(param => {
      const variation = (Math.sin(i / 3) + Math.random() * 0.2) * (param.max - param.min) * 0.05;
      parameters[param.id] = Math.max(param.min, Math.min(param.max, param.currentValue + variation));
    });

    // Calculate outcomes for this snapshot
    const paramsWithSimulated = twinParameters.map(p => ({
      ...p,
      simulatedValue: parameters[p.id],
    }));

    snapshots.push({
      timestamp,
      parameters,
      outcomes: calculateOutcomes(paramsWithSimulated),
    });
  }

  return snapshots;
};

// Saved scenarios
export const savedScenarios: SimulationScenario[] = [
  {
    id: 'scenario-1',
    name: 'Energy Saver Mode',
    description: 'Reduces pump speeds and extends backwash intervals for maximum energy savings',
    parameters: [
      { parameterId: 'pump-speed-ro', value: 2500 },
      { parameterId: 'pump-speed-hp', value: 2800 },
      { parameterId: 'filter-backwash', value: 12 },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    createdBy: 'Amit Singh',
    isFavorite: true,
  },
  {
    id: 'scenario-2',
    name: 'High Turbidity Response',
    description: 'Increased chemical dosing and recirculation for high turbidity events',
    parameters: [
      { parameterId: 'dosing-coagulant', value: 65 },
      { parameterId: 'pump-recirculation', value: 650 },
      { parameterId: 'process-retention', value: 60 },
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdBy: 'Priya Sharma',
    isFavorite: true,
  },
  {
    id: 'scenario-3',
    name: 'Membrane Protection',
    description: 'Lower recovery rate and increased antiscalant for membrane longevity',
    parameters: [
      { parameterId: 'ro-recovery', value: 70 },
      { parameterId: 'dosing-antiscalant', value: 5.0 },
    ],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdBy: 'Rahul Kumar',
    isFavorite: false,
  },
];

// Category metadata
export const categoryInfo: Record<string, { label: string; color: string; bgColor: string }> = {
  pump: { label: 'Pump Controls', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  chemical: { label: 'Chemical Dosing', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  filter: { label: 'Filtration', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  process: { label: 'Process', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  environmental: { label: 'Environmental', color: 'text-teal-700', bgColor: 'bg-teal-50' },
};

export const outcomeInfo: Record<string, { label: string; icon: string; color: string }> = {
  energy: { label: 'Energy', icon: 'Zap', color: 'text-amber-600' },
  quality: { label: 'Quality', icon: 'Droplets', color: 'text-blue-600' },
  throughput: { label: 'Throughput', icon: 'TrendingUp', color: 'text-emerald-600' },
  cost: { label: 'Cost', icon: 'DollarSign', color: 'text-green-600' },
  environmental: { label: 'Environmental', icon: 'Leaf', color: 'text-teal-600' },
};
