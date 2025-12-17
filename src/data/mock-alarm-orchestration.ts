import { Alert } from '@/types';
import { mockAlerts } from './mock-alerts';

// Correlated Alert Group - alerts that share a root cause
export interface CorrelatedAlertGroup {
  id: string;
  rootCause: string;
  rootCauseType: 'equipment_failure' | 'process_upset' | 'sensor_malfunction' | 'environmental' | 'human_error';
  confidence: number; // 0-100%
  alerts: Alert[];
  firstOccurrence: Date;
  suggestedAction: string;
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
  suppressed: boolean;
}

// Operator Fatigue Score
export interface FatigueMetrics {
  currentScore: number; // 0-100 (100 = exhausted)
  alertsLastHour: number;
  alertsLastShift: number;
  avgAcknowledgeTime: number; // minutes
  missedAlerts: number;
  trend: 'improving' | 'stable' | 'worsening';
  recommendation: string;
}

// First-Out Analysis - sequence of events leading to alarms
export interface FirstOutEvent {
  timestamp: Date;
  alertId: string;
  alertType: string;
  sensorName: string;
  isRootCause: boolean;
  sequence: number;
  value: number;
  unit: string;
  deviation: string; // e.g., "+15% above threshold"
}

export interface FirstOutAnalysis {
  id: string;
  incident: string;
  startTime: Date;
  duration: string;
  rootCauseAlert: string;
  events: FirstOutEvent[];
  aiAnalysis: string;
  preventionRecommendation: string;
}

// Suppression Rule
export interface SuppressionRule {
  id: string;
  name: string;
  condition: string;
  duration: number; // minutes
  scope: 'sensor' | 'plant' | 'type';
  active: boolean;
  suppressedCount: number;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date | null;
}

// Helper to create dates relative to now
const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60000);

// Generate correlated alert groups from existing alerts
export const getCorrelatedAlertGroups = (): CorrelatedAlertGroup[] => {
  const activeAlerts = mockAlerts.filter(a => a.status === 'active' || a.status === 'acknowledged');

  return [
    {
      id: 'group-1',
      rootCause: 'Inlet Pump P-101 Degraded Performance',
      rootCauseType: 'equipment_failure',
      confidence: 87,
      alerts: activeAlerts.filter(a =>
        a.type.includes('Pressure') || a.type.includes('Flow')
      ).slice(0, 3),
      firstOccurrence: minutesAgo(45),
      suggestedAction: 'Inspect pump P-101 bearings and impeller. Check VFD settings.',
      estimatedImpact: 'high',
      affectedSystems: ['Inlet Works', 'Primary Treatment', 'Flow Distribution'],
      suppressed: false,
    },
    {
      id: 'group-2',
      rootCause: 'Chemical Dosing System Imbalance',
      rootCauseType: 'process_upset',
      confidence: 92,
      alerts: activeAlerts.filter(a =>
        a.type.includes('pH') || a.type.includes('Chlorine')
      ).slice(0, 2),
      firstOccurrence: minutesAgo(15),
      suggestedAction: 'Review chemical dosing pump calibration. Check chemical stock levels.',
      estimatedImpact: 'critical',
      affectedSystems: ['Chemical Dosing', 'Disinfection', 'Final Effluent'],
      suppressed: false,
    },
    {
      id: 'group-3',
      rootCause: 'Sensor Communication Hub Offline',
      rootCauseType: 'sensor_malfunction',
      confidence: 95,
      alerts: activeAlerts.filter(a =>
        a.type.includes('Communication')
      ).slice(0, 2),
      firstOccurrence: minutesAgo(60),
      suggestedAction: 'Restart PLC communication module. Check network switch status.',
      estimatedImpact: 'medium',
      affectedSystems: ['SCADA Network', 'Remote I/O'],
      suppressed: false,
    },
  ];
};

// Get operator fatigue metrics
export const getFatigueMetrics = (): FatigueMetrics => {
  return {
    currentScore: 42,
    alertsLastHour: 8,
    alertsLastShift: 34,
    avgAcknowledgeTime: 4.2,
    missedAlerts: 1,
    trend: 'stable',
    recommendation: 'Alert load is manageable. Consider enabling smart suppression for recurring low-priority alerts.',
  };
};

// Get first-out analysis for recent incidents
export const getFirstOutAnalyses = (): FirstOutAnalysis[] => {
  return [
    {
      id: 'foa-1',
      incident: 'Primary Clarifier Overflow Event',
      startTime: minutesAgo(120),
      duration: '45 mins',
      rootCauseAlert: 'Inlet Flow Rate High',
      events: [
        {
          timestamp: minutesAgo(120),
          alertId: 'foa-1-evt-1',
          alertType: 'Inlet Flow Rate High',
          sensorName: 'FT-101 Inlet Flow',
          isRootCause: true,
          sequence: 1,
          value: 485,
          unit: 'm³/h',
          deviation: '+21% above setpoint',
        },
        {
          timestamp: minutesAgo(115),
          alertId: 'foa-1-evt-2',
          alertType: 'Clarifier Level Rising',
          sensorName: 'LT-201 Clarifier Level',
          isRootCause: false,
          sequence: 2,
          value: 82,
          unit: '%',
          deviation: '+12% above normal',
        },
        {
          timestamp: minutesAgo(108),
          alertId: 'foa-1-evt-3',
          alertType: 'Sludge Pump Overload',
          sensorName: 'P-201 Current Draw',
          isRootCause: false,
          sequence: 3,
          value: 45,
          unit: 'A',
          deviation: '+28% above rated',
        },
        {
          timestamp: minutesAgo(95),
          alertId: 'foa-1-evt-4',
          alertType: 'High High Level Alarm',
          sensorName: 'LT-201 Clarifier Level',
          isRootCause: false,
          sequence: 4,
          value: 95,
          unit: '%',
          deviation: 'Critical threshold exceeded',
        },
      ],
      aiAnalysis: 'Storm water ingress caused sudden flow surge. Clarifier capacity exceeded before operators could respond. Sludge pump unable to keep pace with incoming load.',
      preventionRecommendation: 'Implement predictive flow monitoring with 15-min lookahead. Add automatic flow diversion to equalization basin when surge detected.',
    },
    {
      id: 'foa-2',
      incident: 'pH Control Loop Oscillation',
      startTime: minutesAgo(240),
      duration: '28 mins',
      rootCauseAlert: 'Caustic Dosing Pump Cavitation',
      events: [
        {
          timestamp: minutesAgo(240),
          alertId: 'foa-2-evt-1',
          alertType: 'Dosing Pump Vibration High',
          sensorName: 'VT-301 Pump Vibration',
          isRootCause: true,
          sequence: 1,
          value: 12.5,
          unit: 'mm/s',
          deviation: '+150% above normal',
        },
        {
          timestamp: minutesAgo(235),
          alertId: 'foa-2-evt-2',
          alertType: 'Caustic Flow Low',
          sensorName: 'FT-301 Caustic Flow',
          isRootCause: false,
          sequence: 2,
          value: 2.1,
          unit: 'L/min',
          deviation: '-65% below setpoint',
        },
        {
          timestamp: minutesAgo(228),
          alertId: 'foa-2-evt-3',
          alertType: 'pH Dropping',
          sensorName: 'AT-401 pH Analyzer',
          isRootCause: false,
          sequence: 3,
          value: 6.2,
          unit: 'pH',
          deviation: '-0.8 below setpoint',
        },
        {
          timestamp: minutesAgo(220),
          alertId: 'foa-2-evt-4',
          alertType: 'pH Low Low Alarm',
          sensorName: 'AT-401 pH Analyzer',
          isRootCause: false,
          sequence: 4,
          value: 5.8,
          unit: 'pH',
          deviation: 'Below discharge permit',
        },
      ],
      aiAnalysis: 'Caustic chemical tank level dropped causing pump suction loss. Cavitation reduced flow rate, triggering pH control loop instability.',
      preventionRecommendation: 'Add low-level alarm on caustic tank with 24-hour advance warning. Implement pump cavitation detection interlock.',
    },
  ];
};

// Get active suppression rules
export const getSuppressionRules = (): SuppressionRule[] => {
  return [
    {
      id: 'supp-1',
      name: 'Maintenance Mode - Pump P-301',
      condition: 'All alerts from sensor group P-301-*',
      duration: 120,
      scope: 'sensor',
      active: true,
      suppressedCount: 5,
      createdBy: 'Amit Singh',
      createdAt: minutesAgo(45),
      expiresAt: new Date(Date.now() + 75 * 60000),
    },
    {
      id: 'supp-2',
      name: 'Chattering Sensor - TT-205',
      condition: 'Temperature alerts < 2°C deviation',
      duration: 60,
      scope: 'sensor',
      active: true,
      suppressedCount: 12,
      createdBy: 'System Auto',
      createdAt: minutesAgo(30),
      expiresAt: new Date(Date.now() + 30 * 60000),
    },
    {
      id: 'supp-3',
      name: 'Known Issue - Level Sensor Drift',
      condition: 'Level alerts from LT-102 within ±5%',
      duration: 480,
      scope: 'sensor',
      active: false,
      suppressedCount: 28,
      createdBy: 'Priya Sharma',
      createdAt: minutesAgo(480),
      expiresAt: null,
    },
  ];
};

// Orchestration stats
export interface OrchestrationStats {
  correlatedGroups: number;
  suppressedAlerts: number;
  avgTimeToRootCause: number; // minutes
  alertReduction: number; // percentage
  operatorSavedTime: number; // minutes per shift
}

export const getOrchestrationStats = (): OrchestrationStats => {
  return {
    correlatedGroups: 3,
    suppressedAlerts: 45,
    avgTimeToRootCause: 2.3,
    alertReduction: 34,
    operatorSavedTime: 42,
  };
};

// Smart priority scoring
export interface AlertPriority {
  alertId: string;
  baseScore: number;
  adjustedScore: number;
  factors: {
    severity: number;
    duration: number;
    frequency: number;
    impact: number;
    correlation: number;
  };
  recommendation: 'immediate' | 'soon' | 'monitor' | 'defer';
}

export const getAlertPriorities = (): AlertPriority[] => {
  return mockAlerts
    .filter(a => a.status === 'active')
    .map((alert, idx) => ({
      alertId: alert.id,
      baseScore: alert.severity === 'critical' ? 90 : alert.severity === 'warning' ? 60 : 30,
      adjustedScore: alert.severity === 'critical' ? 95 - idx * 5 : alert.severity === 'warning' ? 65 - idx * 3 : 35 - idx * 2,
      factors: {
        severity: alert.severity === 'critical' ? 1.0 : alert.severity === 'warning' ? 0.6 : 0.3,
        duration: Math.min(1.0, parseInt(alert.duration || '0') / 60),
        frequency: 0.4 + Math.random() * 0.4,
        impact: alert.severity === 'critical' ? 0.9 : 0.5,
        correlation: 0.3 + Math.random() * 0.5,
      },
      recommendation: alert.severity === 'critical' ? 'immediate' : alert.severity === 'warning' ? 'soon' : 'monitor',
    }));
};
