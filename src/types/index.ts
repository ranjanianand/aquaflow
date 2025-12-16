// AquaFlow Type Definitions

export type PlantStatus = 'online' | 'warning' | 'offline';

export type SensorType =
  | 'pH'
  | 'flow'
  | 'pressure'
  | 'temperature'
  | 'turbidity'
  | 'chlorine'
  | 'DO'
  | 'level'
  | 'conductivity'
  | 'ORP';

export type SensorStatus = 'normal' | 'warning' | 'critical';

export type SensorPriority = 'low' | 'medium' | 'high' | 'critical';

export type DataSource = 'sensor' | 'manual' | 'calculated';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

export type UserStatus = 'active' | 'inactive';

export interface Plant {
  id: string;
  name: string;
  location: string;
  region: string;
  status: PlantStatus;
  sensorCount: number;
  lastUpdated: Date;
  coordinates?: { lat: number; lng: number };
}

export interface SensorReading {
  timestamp: Date;
  value: number;
}

export type SensorCommStatus = 'online' | 'stale' | 'offline';

export interface Sensor {
  id: string;
  plantId: string;
  name: string;
  type: SensorType;
  unit: string;
  currentValue: number;
  minThreshold: number;
  maxThreshold: number;
  setpoint?: number; // Target operational value
  status: SensorStatus;
  commStatus: SensorCommStatus;
  lastUpdated: Date;
  history: SensorReading[];
  priority: SensorPriority;
  location?: string; // e.g., "Inlet", "Outlet", "Tank A"
  tag?: string; // e.g., "TUR-001", "PH-002"
}

export interface ManualReading {
  id: string;
  sensorId: string;
  value: number;
  timestamp: Date;
  notes?: string;
  enteredBy: string;
  dataSource: DataSource;
}

export interface Alert {
  id: string;
  plantId: string;
  plantName: string;
  sensorId: string;
  sensorName: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  unit: string;
  status: AlertStatus;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  duration?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  plantAccess: string[];
  lastActive: Date;
  status: UserStatus;
  avatar?: string;
}

export interface DashboardStats {
  totalPlants: number;
  onlinePlants: number;
  totalSensors: number;
  activeSensors: number;
  activeAlerts: number;
  criticalAlerts: number;
  totalVolume: number;
  volumeUnit: string;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'compliance' | 'custom';
  schedule: 'auto' | 'manual';
  lastGenerated?: Date;
  format: 'pdf' | 'excel' | 'csv';
}

export interface Report {
  id: string;
  templateId: string;
  name: string;
  generatedAt: Date;
  generatedBy: string;
  status: 'completed' | 'processing' | 'failed';
  downloadUrl?: string;
  size?: string;
}

export interface Notification {
  id: string;
  type: 'alert' | 'system' | 'report' | 'maintenance';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  sensorType: SensorType;
  condition: 'above' | 'below' | 'equals' | 'between';
  threshold: number;
  thresholdMax?: number;
  severity: AlertSeverity;
  enabled: boolean;
  notifyChannels: ('email' | 'sms' | 'whatsapp' | 'push')[];
  plantIds: string[];
}

export interface MaintenanceTask {
  id: string;
  plantId: string;
  plantName: string;
  equipmentId: string;
  equipmentName: string;
  type: 'preventive' | 'corrective' | 'predictive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  scheduledDate: Date;
  completedDate?: Date;
  assignedTo?: string;
  description: string;
}

// AI Support Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface SuggestedPrompt {
  id: string;
  text: string;
  category: 'analysis' | 'report' | 'maintenance' | 'trend';
}

// Predictive Maintenance Types
export interface PredictionResult {
  equipmentId: string;
  equipmentName: string;
  plantName: string;
  remainingLife: number;
  remainingLifeUnit: 'days' | 'hours' | 'cycles';
  confidence: number;
  status: 'healthy' | 'watch' | 'warning' | 'critical';
  lastPrediction: Date;
  recommendations: string[];
}

export interface AnomalyDetection {
  sensorId: string;
  sensorName: string;
  plantName: string;
  anomalyScore: number;
  detectedAt: Date;
  type: 'spike' | 'drift' | 'pattern_change' | 'flatline';
  description: string;
}

// Process Flow Types
export interface FlowNode {
  id: string;
  type: 'intake' | 'pump' | 'tank' | 'filter' | 'treatment' | 'output' | 'sensor';
  label: string;
  status: 'running' | 'stopped' | 'warning' | 'error';
  position: { x: number; y: number };
  data?: Record<string, number | string>;
}

export interface FlowConnection {
  id: string;
  from: string;
  to: string;
  flowRate?: number;
  animated?: boolean;
}
