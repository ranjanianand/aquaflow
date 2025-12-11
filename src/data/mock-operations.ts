// Operational metrics and insights data
// Based on Domain Expert knowledge of water treatment processes

export interface EquipmentHealth {
  id: string;
  name: string;
  type: 'pump' | 'membrane' | 'filter' | 'uv' | 'dosing' | 'blower' | 'motor';
  plantId: string;
  plantName: string;
  healthScore: number; // 0-100
  daysRemaining: number; // Until maintenance needed
  status: 'healthy' | 'attention' | 'warning' | 'critical';
  lastMaintenance: Date;
  nextMaintenance: Date;
  metrics: {
    efficiency: number; // %
    runtime: number; // hours
    cycles: number;
  };
}

export interface OperationalInsight {
  id: string;
  type: 'optimization' | 'maintenance' | 'efficiency' | 'cost' | 'compliance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    costSavings?: number; // $/month
    energySavings?: number; // kWh/month
    waterSavings?: number; // m³/month
  };
  currentValue: number;
  recommendedValue: number;
  unit: string;
  equipment?: string;
  plantId: string;
  plantName: string;
  createdAt: Date;
}

export interface CostMetrics {
  totalSavings: number; // $/month
  energyCost: number;
  chemicalCost: number;
  laborCost: number;
  maintenanceCost: number;
  savingsBreakdown: {
    energy: number;
    chemicals: number;
    labor: number;
    maintenance: number;
  };
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

export interface ProcessEfficiency {
  processType: 'clarification' | 'filtration' | 'disinfection' | 'sludge';
  efficiency: number; // %
  target: number; // %
  status: 'optimal' | 'good' | 'attention' | 'critical';
  parameters: {
    name: string;
    current: number;
    optimal: number;
    unit: string;
  }[];
}

// Mock Equipment Health Data
export const mockEquipmentHealth: EquipmentHealth[] = [
  {
    id: 'eq-1',
    name: 'RO Membrane Unit A',
    type: 'membrane',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    healthScore: 72,
    daysRemaining: 18,
    status: 'attention',
    lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    nextMaintenance: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    metrics: { efficiency: 89, runtime: 4320, cycles: 156 },
  },
  {
    id: 'eq-2',
    name: 'High Pressure Pump P-101',
    type: 'pump',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    healthScore: 85,
    daysRemaining: 42,
    status: 'healthy',
    lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    nextMaintenance: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
    metrics: { efficiency: 94, runtime: 3200, cycles: 890 },
  },
  {
    id: 'eq-3',
    name: 'UV Disinfection Unit',
    type: 'uv',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    healthScore: 45,
    daysRemaining: 7,
    status: 'warning',
    lastMaintenance: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
    nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    metrics: { efficiency: 78, runtime: 5800, cycles: 210 },
  },
  {
    id: 'eq-4',
    name: 'Sand Filter F-201',
    type: 'filter',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    healthScore: 91,
    daysRemaining: 65,
    status: 'healthy',
    lastMaintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    nextMaintenance: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000),
    metrics: { efficiency: 97, runtime: 2100, cycles: 45 },
  },
  {
    id: 'eq-5',
    name: 'Chemical Dosing Pump',
    type: 'dosing',
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    healthScore: 32,
    daysRemaining: 3,
    status: 'critical',
    lastMaintenance: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    nextMaintenance: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    metrics: { efficiency: 65, runtime: 6500, cycles: 1200 },
  },
  {
    id: 'eq-6',
    name: 'Sludge Blower B-301',
    type: 'blower',
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    healthScore: 78,
    daysRemaining: 28,
    status: 'healthy',
    lastMaintenance: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    nextMaintenance: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    metrics: { efficiency: 88, runtime: 4100, cycles: 320 },
  },
  {
    id: 'eq-7',
    name: 'Backwash Pump P-202',
    type: 'pump',
    plantId: 'plant-4',
    plantName: 'Bangalore WTP-04',
    healthScore: 58,
    daysRemaining: 12,
    status: 'attention',
    lastMaintenance: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
    nextMaintenance: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    metrics: { efficiency: 82, runtime: 3800, cycles: 560 },
  },
  {
    id: 'eq-8',
    name: 'UF Membrane Module',
    type: 'membrane',
    plantId: 'plant-5',
    plantName: 'Hyderabad WTP-05',
    healthScore: 88,
    daysRemaining: 55,
    status: 'healthy',
    lastMaintenance: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    nextMaintenance: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
    metrics: { efficiency: 95, runtime: 2800, cycles: 98 },
  },
];

// Mock Operational Insights
export const mockInsights: OperationalInsight[] = [
  {
    id: 'insight-1',
    type: 'optimization',
    priority: 'high',
    title: 'Reduce Feed Pressure on RO-1',
    description: 'Current feed pressure is 8% above optimal. Reducing to recommended level will extend membrane life and reduce energy consumption.',
    impact: { costSavings: 2450, energySavings: 1200 },
    currentValue: 15.2,
    recommendedValue: 14.0,
    unit: 'bar',
    equipment: 'RO Membrane Unit A',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    createdAt: new Date(),
  },
  {
    id: 'insight-2',
    type: 'efficiency',
    priority: 'medium',
    title: 'Optimize Chlorine Dosing Rate',
    description: 'Chlorine residual is consistently above target. Reducing dosing rate will save chemicals while maintaining compliance.',
    impact: { costSavings: 890, waterSavings: 50 },
    currentValue: 2.8,
    recommendedValue: 2.2,
    unit: 'mg/L',
    equipment: 'Chemical Dosing Pump',
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'insight-3',
    type: 'maintenance',
    priority: 'high',
    title: 'Schedule UV Lamp Replacement',
    description: 'UV intensity has dropped below 85% threshold. Schedule lamp replacement within 7 days to maintain disinfection efficacy.',
    impact: { costSavings: 0 },
    currentValue: 78,
    recommendedValue: 100,
    unit: '%',
    equipment: 'UV Disinfection Unit',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: 'insight-4',
    type: 'cost',
    priority: 'medium',
    title: 'Shift Backwash to Off-Peak Hours',
    description: 'Rescheduling filter backwash cycles to off-peak electricity hours (10 PM - 6 AM) can reduce energy costs.',
    impact: { costSavings: 1650, energySavings: 800 },
    currentValue: 14,
    recommendedValue: 22,
    unit: 'hour',
    equipment: 'Sand Filter F-201',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: 'insight-5',
    type: 'compliance',
    priority: 'low',
    title: 'Calibrate pH Sensor',
    description: 'pH sensor drift detected. Calibration recommended to ensure accurate readings and regulatory compliance.',
    impact: {},
    currentValue: 0.15,
    recommendedValue: 0.05,
    unit: 'drift',
    plantId: 'plant-4',
    plantName: 'Bangalore WTP-04',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
];

// Mock Cost Metrics
export const mockCostMetrics: CostMetrics = {
  totalSavings: 8750,
  energyCost: 45000,
  chemicalCost: 28000,
  laborCost: 65000,
  maintenanceCost: 32000,
  savingsBreakdown: {
    energy: 3200,
    chemicals: 2100,
    labor: 1800,
    maintenance: 1650,
  },
  trend: 'up',
  percentChange: 12.5,
};

// Mock Process Efficiency Data
export const mockProcessEfficiency: ProcessEfficiency[] = [
  {
    processType: 'clarification',
    efficiency: 94,
    target: 95,
    status: 'good',
    parameters: [
      { name: 'Turbidity Removal', current: 94, optimal: 95, unit: '%' },
      { name: 'Coagulant Dose', current: 25, optimal: 22, unit: 'mg/L' },
      { name: 'Settling Time', current: 45, optimal: 40, unit: 'min' },
    ],
  },
  {
    processType: 'filtration',
    efficiency: 97,
    target: 95,
    status: 'optimal',
    parameters: [
      { name: 'Filtration Rate', current: 8.5, optimal: 8.0, unit: 'm/h' },
      { name: 'Head Loss', current: 1.2, optimal: 1.5, unit: 'm' },
      { name: 'Backwash Frequency', current: 24, optimal: 24, unit: 'h' },
    ],
  },
  {
    processType: 'disinfection',
    efficiency: 88,
    target: 95,
    status: 'attention',
    parameters: [
      { name: 'CT Value', current: 28, optimal: 30, unit: 'mg·min/L' },
      { name: 'Residual Chlorine', current: 0.8, optimal: 1.0, unit: 'mg/L' },
      { name: 'Contact Time', current: 25, optimal: 30, unit: 'min' },
    ],
  },
  {
    processType: 'sludge',
    efficiency: 82,
    target: 85,
    status: 'attention',
    parameters: [
      { name: 'Solids Capture', current: 82, optimal: 85, unit: '%' },
      { name: 'Sludge Volume', current: 12, optimal: 10, unit: 'm³/day' },
      { name: 'Dewatering Efficiency', current: 18, optimal: 22, unit: '% solids' },
    ],
  },
];

// Helper functions
export const getOverallHealthScore = (): number => {
  const total = mockEquipmentHealth.reduce((acc, eq) => acc + eq.healthScore, 0);
  return Math.round(total / mockEquipmentHealth.length);
};

export const getEquipmentNeedingAttention = (): EquipmentHealth[] => {
  return mockEquipmentHealth
    .filter(eq => eq.status === 'critical' || eq.status === 'warning' || eq.status === 'attention')
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
};

export const getCriticalEquipmentCount = (): number => {
  return mockEquipmentHealth.filter(eq => eq.status === 'critical').length;
};

export const getWarningEquipmentCount = (): number => {
  return mockEquipmentHealth.filter(eq => eq.status === 'warning').length;
};

export const getHighPriorityInsights = (): OperationalInsight[] => {
  return mockInsights.filter(i => i.priority === 'high');
};

export const getTotalPotentialSavings = (): number => {
  return mockInsights.reduce((acc, insight) => acc + (insight.impact.costSavings || 0), 0);
};

export const getProcessByType = (type: ProcessEfficiency['processType']): ProcessEfficiency | undefined => {
  return mockProcessEfficiency.find(p => p.processType === type);
};

export const getOverallProcessEfficiency = (): number => {
  const total = mockProcessEfficiency.reduce((acc, p) => acc + p.efficiency, 0);
  return Math.round(total / mockProcessEfficiency.length);
};
