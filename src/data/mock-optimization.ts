// Mock data for Autonomous Optimization feature

export interface OptimizationRecommendation {
  id: string;
  plantId: string;
  plantName: string;
  equipmentId: string;
  equipmentName: string;
  parameterName: string;
  currentValue: number;
  recommendedValue: number;
  unit: string;
  expectedImprovement: {
    metric: string;
    currentValue: number;
    projectedValue: number;
    unit: string;
    percentChange: number;
  };
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  category: 'energy' | 'quality' | 'throughput' | 'maintenance';
  reasoning: string;
  rootCause: string; // The trigger/root cause that initiated this recommendation
  status: 'pending' | 'approved' | 'rejected' | 'applied' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  appliedAt?: Date;
  actualOutcome?: {
    metric: string;
    achievedValue: number;
    unit: string;
    success: boolean;
  };
}

export interface OptimizationHistory {
  id: string;
  recommendationId: string;
  action: 'created' | 'approved' | 'rejected' | 'applied' | 'expired' | 'outcome_recorded';
  performedBy: string;
  performedAt: Date;
  notes?: string;
}

export interface OptimizationStats {
  totalRecommendations: number;
  pendingApproval: number;
  approvedToday: number;
  rejectedToday: number;
  appliedThisWeek: number;
  successRate: number;
  totalSavings: number;
  savingsUnit: string;
}

// Generate mock recommendations
const now = new Date();
const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

export const mockRecommendations: OptimizationRecommendation[] = [
  {
    id: 'opt-002',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    equipmentId: 'dosing-102',
    equipmentName: 'Chlorine Dosing Unit',
    parameterName: 'Dosing Rate',
    currentValue: 2.4,
    recommendedValue: 2.1,
    unit: 'mg/L',
    expectedImprovement: {
      metric: 'Chemical Cost',
      currentValue: 8500,
      projectedValue: 7437,
      unit: '₹/day',
      percentChange: -12.5,
    },
    confidenceScore: 87,
    riskLevel: 'low',
    category: 'quality',
    rootCause: 'Chemical over-dosing detected: Outlet chlorine residual consistently at 1.8 mg/L (target: 1.5 mg/L) over 14-day monitoring period. Water quality sensors confirm stable inlet conditions with no variability requiring higher dosing.',
    reasoning: 'Reducing dosing rate to 2.1 mg/L maintains regulatory compliance (min: 1.2 mg/L) while reducing chemical usage by 12.5%. Recommended trial period: 48 hours with continuous monitoring.',
    status: 'pending',
    createdAt: twoHoursAgo,
    expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
  },
  {
    id: 'opt-001',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    equipmentId: 'pump-101',
    equipmentName: 'RO Feed Pump P1',
    parameterName: 'Pump Speed',
    currentValue: 2850,
    recommendedValue: 2650,
    unit: 'RPM',
    expectedImprovement: {
      metric: 'Energy Consumption',
      currentValue: 145,
      projectedValue: 128,
      unit: 'kWh/day',
      percentChange: -11.7,
    },
    confidenceScore: 94,
    riskLevel: 'low',
    category: 'energy',
    rootCause: 'Energy consumption anomaly detected: RO Feed Pump P1 operating at 2850 RPM while flow demand is only 88% of capacity. Pattern analysis of last 7 days shows consistent over-speed operation during low-demand periods (02:00-06:00 hrs).',
    reasoning: 'Reducing speed to 2650 RPM maintains required flow rate while reducing energy consumption by 11.7%. No impact on water quality expected based on hydraulic modeling.',
    status: 'pending',
    createdAt: hourAgo,
    expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
  },
  {
    id: 'opt-003',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    equipmentId: 'filter-201',
    equipmentName: 'Sand Filter Bank A',
    parameterName: 'Backwash Frequency',
    currentValue: 8,
    recommendedValue: 12,
    unit: 'hours',
    expectedImprovement: {
      metric: 'Water Recovery',
      currentValue: 94.2,
      projectedValue: 96.1,
      unit: '%',
      percentChange: 2.0,
    },
    confidenceScore: 91,
    riskLevel: 'medium',
    category: 'throughput',
    rootCause: 'Water loss inefficiency detected: Backwash cycles occurring every 8 hours but differential pressure analysis shows filters maintain optimal performance for 12+ hours. Current schedule results in 1.9% additional water loss.',
    reasoning: 'Extending backwash interval to 12 hours reduces water loss by 2% while maintaining filtration quality. Recommend turbidity monitoring for first week to confirm no degradation.',
    status: 'pending',
    createdAt: twoHoursAgo,
    expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),
  },
  {
    id: 'opt-004',
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    equipmentId: 'ro-301',
    equipmentName: 'RO Membrane Unit B',
    parameterName: 'Recovery Rate',
    currentValue: 75,
    recommendedValue: 72,
    unit: '%',
    expectedImprovement: {
      metric: 'Membrane Life',
      currentValue: 45,
      projectedValue: 68,
      unit: 'days remaining',
      percentChange: 51.1,
    },
    confidenceScore: 82,
    riskLevel: 'medium',
    category: 'maintenance',
    rootCause: 'Membrane degradation warning: Salt passage increased from 1.2% to 2.1% over last 30 days. Feed pressure trending up by 8% indicates fouling. Current 75% recovery rate accelerating membrane wear.',
    reasoning: 'Reducing recovery to 72% extends membrane life by 51% (from 45 to 68 days remaining). Trade-off: 3% increase in reject water volume. Cost benefit: ₹2.4L membrane replacement deferral.',
    status: 'pending',
    createdAt: dayAgo,
    expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
  },
  {
    id: 'opt-005',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    equipmentId: 'pump-202',
    equipmentName: 'Clarifier Recirculation Pump',
    parameterName: 'Flow Setpoint',
    currentValue: 450,
    recommendedValue: 520,
    unit: 'm³/h',
    expectedImprovement: {
      metric: 'Turbidity Reduction',
      currentValue: 2.8,
      projectedValue: 1.9,
      unit: 'NTU',
      percentChange: -32.1,
    },
    confidenceScore: 78,
    riskLevel: 'high',
    category: 'quality',
    rootCause: 'Outlet turbidity elevated: Average 2.8 NTU (target: <2.0 NTU) over past 72 hours. Sludge blanket depth measurements show suboptimal settling due to insufficient recirculation. Correlates with incoming raw water turbidity spike.',
    reasoning: 'Increasing recirculation to 520 m³/h improves settling efficiency, reducing turbidity by 32%. Trade-off: 8% energy increase. Recommend trial during current high-turbidity period only.',
    status: 'pending',
    createdAt: hourAgo,
    expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
  },
  // Historical (applied) recommendations
  {
    id: 'opt-006',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    equipmentId: 'aerator-103',
    equipmentName: 'Aeration Blower',
    parameterName: 'Air Flow Rate',
    currentValue: 1200,
    recommendedValue: 1050,
    unit: 'm³/h',
    expectedImprovement: {
      metric: 'Energy Consumption',
      currentValue: 89,
      projectedValue: 78,
      unit: 'kWh/day',
      percentChange: -12.4,
    },
    confidenceScore: 92,
    riskLevel: 'low',
    category: 'energy',
    rootCause: 'DO over-saturation detected: Dissolved oxygen at 8.5 mg/L consistently exceeds setpoint of 7.0 mg/L. Aeration blower operating at maximum output despite lower demand.',
    reasoning: 'Reducing air flow to 1050 m³/h maintains target DO while saving 12.4% energy consumption.',
    status: 'applied',
    createdAt: weekAgo,
    expiresAt: new Date(weekAgo.getTime() + 8 * 60 * 60 * 1000),
    approvedBy: 'Amit Singh',
    approvedAt: new Date(weekAgo.getTime() + 2 * 60 * 60 * 1000),
    appliedAt: new Date(weekAgo.getTime() + 3 * 60 * 60 * 1000),
    actualOutcome: {
      metric: 'Energy Consumption',
      achievedValue: 76,
      unit: 'kWh/day',
      success: true,
    },
  },
  {
    id: 'opt-007',
    plantId: 'plant-4',
    plantName: 'Bangalore WTP-04',
    equipmentId: 'pump-401',
    equipmentName: 'High Pressure Pump',
    parameterName: 'Pressure Setpoint',
    currentValue: 15.5,
    recommendedValue: 14.2,
    unit: 'bar',
    expectedImprovement: {
      metric: 'Energy Consumption',
      currentValue: 210,
      projectedValue: 185,
      unit: 'kWh/day',
      percentChange: -11.9,
    },
    confidenceScore: 88,
    riskLevel: 'low',
    category: 'energy',
    rootCause: 'Pressure inefficiency detected: Operating at 15.5 bar but membrane flux analysis shows optimal performance at 14.2 bar. Higher pressure causing unnecessary energy waste and accelerated membrane wear.',
    reasoning: 'Reducing pressure setpoint to 14.2 bar optimizes membrane flux while saving 11.9% energy.',
    status: 'applied',
    createdAt: new Date(weekAgo.getTime() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(weekAgo.getTime() - 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    approvedBy: 'Priya Sharma',
    approvedAt: new Date(weekAgo.getTime() - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
    appliedAt: new Date(weekAgo.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    actualOutcome: {
      metric: 'Energy Consumption',
      achievedValue: 188,
      unit: 'kWh/day',
      success: true,
    },
  },
  {
    id: 'opt-008',
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    equipmentId: 'dosing-301',
    equipmentName: 'Coagulant Dosing',
    parameterName: 'Dosing Rate',
    currentValue: 45,
    recommendedValue: 52,
    unit: 'mg/L',
    expectedImprovement: {
      metric: 'Turbidity Reduction',
      currentValue: 3.2,
      projectedValue: 2.1,
      unit: 'NTU',
      percentChange: -34.4,
    },
    confidenceScore: 75,
    riskLevel: 'medium',
    category: 'quality',
    rootCause: 'Inlet turbidity spike: Raw water turbidity increased from 15 NTU to 45 NTU due to monsoon runoff. Current coagulant dosing insufficient for elevated solids load.',
    reasoning: 'Increasing coagulant to 52 mg/L addresses elevated inlet turbidity to maintain output quality.',
    status: 'rejected',
    createdAt: new Date(dayAgo.getTime() - 12 * 60 * 60 * 1000),
    expiresAt: new Date(dayAgo.getTime() - 12 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
  },
];

// Generate optimization history
export const mockOptimizationHistory: OptimizationHistory[] = [
  {
    id: 'hist-001',
    recommendationId: 'opt-006',
    action: 'created',
    performedBy: 'AI System',
    performedAt: weekAgo,
  },
  {
    id: 'hist-002',
    recommendationId: 'opt-006',
    action: 'approved',
    performedBy: 'Amit Singh',
    performedAt: new Date(weekAgo.getTime() + 2 * 60 * 60 * 1000),
    notes: 'Approved after verifying DO sensor calibration',
  },
  {
    id: 'hist-003',
    recommendationId: 'opt-006',
    action: 'applied',
    performedBy: 'System',
    performedAt: new Date(weekAgo.getTime() + 3 * 60 * 60 * 1000),
  },
  {
    id: 'hist-004',
    recommendationId: 'opt-006',
    action: 'outcome_recorded',
    performedBy: 'AI System',
    performedAt: new Date(weekAgo.getTime() + 27 * 60 * 60 * 1000),
    notes: 'Target achieved: 76 kWh/day (better than projected 78 kWh/day)',
  },
];

// Helper functions
export const getPendingRecommendations = (): OptimizationRecommendation[] => {
  return mockRecommendations.filter(r => r.status === 'pending');
};

export const getAppliedRecommendations = (): OptimizationRecommendation[] => {
  return mockRecommendations.filter(r => r.status === 'applied');
};

export const getRejectedRecommendations = (): OptimizationRecommendation[] => {
  return mockRecommendations.filter(r => r.status === 'rejected');
};

export const getRecommendationsByPlant = (plantId: string): OptimizationRecommendation[] => {
  return mockRecommendations.filter(r => r.plantId === plantId);
};

export const getRecommendationsByCategory = (category: string): OptimizationRecommendation[] => {
  return mockRecommendations.filter(r => r.category === category);
};

export const getOptimizationStats = (): OptimizationStats => {
  const pending = mockRecommendations.filter(r => r.status === 'pending').length;
  const applied = mockRecommendations.filter(r => r.status === 'applied');
  const successful = applied.filter(r => r.actualOutcome?.success).length;

  return {
    totalRecommendations: mockRecommendations.length,
    pendingApproval: pending,
    approvedToday: 2,
    rejectedToday: 1,
    appliedThisWeek: applied.length,
    successRate: applied.length > 0 ? Math.round((successful / applied.length) * 100) : 0,
    totalSavings: 45200,
    savingsUnit: '₹/month',
  };
};

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    energy: 'Energy Optimization',
    quality: 'Water Quality',
    throughput: 'Throughput',
    maintenance: 'Maintenance',
  };
  return labels[category] || category;
};

export const getRiskLabel = (risk: string): string => {
  const labels: Record<string, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
  };
  return labels[risk] || risk;
};
