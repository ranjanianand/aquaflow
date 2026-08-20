// Mock data for Asset Monitor module

export type AssetStatus = 'operational' | 'warning' | 'critical' | 'offline' | 'maintenance';
export type AssetCategory = 'pump' | 'motor' | 'sensor' | 'valve' | 'tank' | 'filter' | 'controller' | 'blower' | 'dosing' | 'membrane';

export interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: AssetCategory;
  plantId: string;
  plantName: string;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installationDate: string;
  warrantyExpiry: string;
  status: AssetStatus;
  healthScore: number; // 0-100
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  operatingHours: number;
  specifications: Record<string, string>;
  currentMetrics: AssetMetrics;
  maintenanceHistory: MaintenanceRecord[];
}

export interface AssetMetrics {
  runtime: number; // hours today
  efficiency: number; // percentage
  temperature: number | null;
  vibration: number | null; // mm/s
  powerConsumption: number | null; // kW
  lastUpdated: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'preventive' | 'corrective' | 'breakdown';
  description: string;
  technician: string;
  cost: number;
  duration: number; // hours
}

export const assets: Asset[] = [
  {
    id: 'asset-001',
    assetCode: 'CHN-RO-001',
    name: 'RO Unit #1',
    category: 'membrane',
    plantId: 'plant-001',
    plantName: 'Chennai WTP',
    location: 'Building A - Ground Floor',
    manufacturer: 'Toray Industries',
    model: 'TM820M-400',
    serialNumber: 'TOR-2022-45678',
    installationDate: '2022-03-15',
    warrantyExpiry: '2025-03-15',
    status: 'warning',
    healthScore: 72,
    lastMaintenanceDate: '2024-01-10',
    nextMaintenanceDate: '2024-02-10',
    operatingHours: 15840,
    specifications: {
      'Capacity': '100 m³/hr',
      'Recovery Rate': '75%',
      'Membrane Area': '400 sq.ft',
      'Max Pressure': '40 bar',
    },
    currentMetrics: {
      runtime: 18.5,
      efficiency: 68,
      temperature: 32,
      vibration: 2.1,
      powerConsumption: 45,
      lastUpdated: '2024-01-15T11:30:00Z',
    },
    maintenanceHistory: [
      { id: 'mh-001', date: '2024-01-10', type: 'preventive', description: 'CIP cleaning', technician: 'Rajesh Kumar', cost: 15000, duration: 4 },
      { id: 'mh-002', date: '2023-10-15', type: 'corrective', description: 'Membrane replacement - 2 elements', technician: 'Vikram Rao', cost: 120000, duration: 8 },
    ],
  },
  {
    id: 'asset-002',
    assetCode: 'CHN-PMP-001',
    name: 'High Pressure Pump #1',
    category: 'pump',
    plantId: 'plant-001',
    plantName: 'Chennai WTP',
    location: 'Building A - Ground Floor',
    manufacturer: 'Grundfos',
    model: 'CRN 64-3',
    serialNumber: 'GRF-2021-78901',
    installationDate: '2021-06-20',
    warrantyExpiry: '2024-06-20',
    status: 'operational',
    healthScore: 92,
    lastMaintenanceDate: '2023-12-20',
    nextMaintenanceDate: '2024-03-20',
    operatingHours: 22560,
    specifications: {
      'Flow Rate': '64 m³/hr',
      'Head': '180 m',
      'Power': '55 kW',
      'Speed': '2950 RPM',
    },
    currentMetrics: {
      runtime: 22.3,
      efficiency: 94,
      temperature: 45,
      vibration: 1.2,
      powerConsumption: 52,
      lastUpdated: '2024-01-15T11:30:00Z',
    },
    maintenanceHistory: [
      { id: 'mh-003', date: '2023-12-20', type: 'preventive', description: 'Bearing inspection & lubrication', technician: 'Rajesh Kumar', cost: 5000, duration: 2 },
    ],
  },
  {
    id: 'asset-003',
    assetCode: 'BLR-BLW-001',
    name: 'Aeration Blower #1',
    category: 'blower',
    plantId: 'plant-002',
    plantName: 'Bangalore STP',
    location: 'Aeration Tank Area',
    manufacturer: 'Aerzen',
    model: 'GM 25S',
    serialNumber: 'AER-2020-12345',
    installationDate: '2020-09-10',
    warrantyExpiry: '2023-09-10',
    status: 'operational',
    healthScore: 88,
    lastMaintenanceDate: '2023-11-15',
    nextMaintenanceDate: '2024-02-15',
    operatingHours: 29200,
    specifications: {
      'Air Flow': '1500 m³/hr',
      'Pressure': '0.8 bar',
      'Power': '37 kW',
      'Noise Level': '75 dB',
    },
    currentMetrics: {
      runtime: 24,
      efficiency: 91,
      temperature: 58,
      vibration: 1.8,
      powerConsumption: 35,
      lastUpdated: '2024-01-15T11:30:00Z',
    },
    maintenanceHistory: [
      { id: 'mh-004', date: '2023-11-15', type: 'preventive', description: 'Belt tension adjustment', technician: 'Suresh Patel', cost: 3000, duration: 1.5 },
    ],
  },
  {
    id: 'asset-004',
    assetCode: 'BLR-DSG-001',
    name: 'Chemical Dosing Pump #1',
    category: 'dosing',
    plantId: 'plant-002',
    plantName: 'Bangalore STP',
    location: 'Chemical Room',
    manufacturer: 'Prominent',
    model: 'Sigma S2Cb',
    serialNumber: 'PRO-2022-56789',
    installationDate: '2022-01-25',
    warrantyExpiry: '2025-01-25',
    status: 'operational',
    healthScore: 95,
    lastMaintenanceDate: '2024-01-05',
    nextMaintenanceDate: '2024-04-05',
    operatingHours: 8760,
    specifications: {
      'Flow Rate': '150 L/hr',
      'Max Pressure': '10 bar',
      'Power': '0.37 kW',
      'Stroke Length': '0-100%',
    },
    currentMetrics: {
      runtime: 20,
      efficiency: 98,
      temperature: null,
      vibration: null,
      powerConsumption: 0.35,
      lastUpdated: '2024-01-15T11:30:00Z',
    },
    maintenanceHistory: [
      { id: 'mh-005', date: '2024-01-05', type: 'preventive', description: 'Diaphragm inspection', technician: 'Suresh Patel', cost: 2500, duration: 1 },
    ],
  },
  {
    id: 'asset-005',
    assetCode: 'HYD-PLC-001',
    name: 'Main PLC Controller',
    category: 'controller',
    plantId: 'plant-003',
    plantName: 'Hyderabad ETP',
    location: 'Control Room',
    manufacturer: 'Siemens',
    model: 'S7-1500',
    serialNumber: 'SIE-2021-34567',
    installationDate: '2021-04-12',
    warrantyExpiry: '2024-04-12',
    status: 'critical',
    healthScore: 45,
    lastMaintenanceDate: '2023-08-20',
    nextMaintenanceDate: '2024-01-20',
    operatingHours: 24528,
    specifications: {
      'CPU': '1516-3 PN/DP',
      'Memory': '1 MB',
      'I/O Points': '256',
      'Communication': 'PROFINET/PROFIBUS',
    },
    currentMetrics: {
      runtime: 24,
      efficiency: 78,
      temperature: 42,
      vibration: null,
      powerConsumption: 0.15,
      lastUpdated: '2024-01-15T11:30:00Z',
    },
    maintenanceHistory: [
      { id: 'mh-006', date: '2023-08-20', type: 'preventive', description: 'Firmware update', technician: 'Amit Singh', cost: 8000, duration: 3 },
    ],
  },
  {
    id: 'asset-006',
    assetCode: 'MUM-EVP-001',
    name: 'MVR Evaporator',
    category: 'filter',
    plantId: 'plant-004',
    plantName: 'Mumbai ZLD',
    location: 'Evaporation Building',
    manufacturer: 'Veolia',
    model: 'HPD-500',
    serialNumber: 'VEO-2019-89012',
    installationDate: '2019-11-30',
    warrantyExpiry: '2022-11-30',
    status: 'maintenance',
    healthScore: 60,
    lastMaintenanceDate: '2023-06-15',
    nextMaintenanceDate: '2024-01-20',
    operatingHours: 35040,
    specifications: {
      'Capacity': '50 m³/hr',
      'Steam Consumption': '0.05 kg/kg',
      'Power': '250 kW',
      'Material': 'SS316L',
    },
    currentMetrics: {
      runtime: 0,
      efficiency: 0,
      temperature: 25,
      vibration: 0,
      powerConsumption: 0,
      lastUpdated: '2024-01-15T11:30:00Z',
    },
    maintenanceHistory: [
      { id: 'mh-007', date: '2023-06-15', type: 'corrective', description: 'Heat exchanger tube replacement', technician: 'Vikram Rao', cost: 350000, duration: 24 },
    ],
  },
  {
    id: 'asset-007',
    assetCode: 'CHN-SNS-001',
    name: 'pH Sensor Array',
    category: 'sensor',
    plantId: 'plant-001',
    plantName: 'Chennai WTP',
    location: 'Inlet Chamber',
    manufacturer: 'Endress+Hauser',
    model: 'Orbisint CPS11D',
    serialNumber: 'EH-2023-11111',
    installationDate: '2023-02-10',
    warrantyExpiry: '2025-02-10',
    status: 'operational',
    healthScore: 98,
    lastMaintenanceDate: '2024-01-10',
    nextMaintenanceDate: '2024-02-10',
    operatingHours: 8400,
    specifications: {
      'Range': '0-14 pH',
      'Accuracy': '±0.02 pH',
      'Temperature': '0-80°C',
      'Response Time': '<10s',
    },
    currentMetrics: {
      runtime: 24,
      efficiency: 99,
      temperature: 28,
      vibration: null,
      powerConsumption: 0.01,
      lastUpdated: '2024-01-15T11:30:00Z',
    },
    maintenanceHistory: [
      { id: 'mh-008', date: '2024-01-10', type: 'preventive', description: 'Calibration', technician: 'Suresh Patel', cost: 1500, duration: 1 },
    ],
  },
  {
    id: 'asset-008',
    assetCode: 'BLR-VLV-001',
    name: 'Motorized Valve MV-101',
    category: 'valve',
    plantId: 'plant-002',
    plantName: 'Bangalore STP',
    location: 'Inlet Works',
    manufacturer: 'Rotork',
    model: 'IQ3',
    serialNumber: 'ROT-2022-22222',
    installationDate: '2022-05-18',
    warrantyExpiry: '2025-05-18',
    status: 'operational',
    healthScore: 90,
    lastMaintenanceDate: '2023-09-25',
    nextMaintenanceDate: '2024-03-25',
    operatingHours: 14600,
    specifications: {
      'Size': 'DN200',
      'Torque': '250 Nm',
      'Actuator': 'Electric',
      'Fail-safe': 'Close on power fail',
    },
    currentMetrics: {
      runtime: 18,
      efficiency: 100,
      temperature: 35,
      vibration: 0.5,
      powerConsumption: 0.8,
      lastUpdated: '2024-01-15T11:30:00Z',
    },
    maintenanceHistory: [
      { id: 'mh-009', date: '2023-09-25', type: 'preventive', description: 'Actuator greasing', technician: 'Rajesh Kumar', cost: 2000, duration: 0.5 },
    ],
  },
];

// Helper functions
export const getAssetsByStatus = (status: AssetStatus) =>
  assets.filter(a => a.status === status);

export const getAssetsNeedingMaintenance = () => {
  const today = new Date();
  return assets.filter(a => new Date(a.nextMaintenanceDate) <= today);
};

export const getCriticalAssets = () =>
  assets.filter(a => a.healthScore < 50 || a.status === 'critical');

export const getAverageHealthScore = () => {
  if (assets.length === 0) return 0;
  return Math.round(assets.reduce((sum, a) => sum + a.healthScore, 0) / assets.length);
};

export const getTotalOperatingHours = () =>
  assets.reduce((sum, a) => sum + a.operatingHours, 0);

export const getAssetsByCategory = () => {
  const categories: Record<AssetCategory, number> = {
    pump: 0, motor: 0, sensor: 0, valve: 0, tank: 0,
    filter: 0, controller: 0, blower: 0, dosing: 0, membrane: 0,
  };
  assets.forEach(a => categories[a.category]++);
  return categories;
};

export const getStatusLabel = (status: AssetStatus): string => {
  const labels: Record<AssetStatus, string> = {
    operational: 'Operational',
    warning: 'Warning',
    critical: 'Critical',
    offline: 'Offline',
    maintenance: 'Under Maintenance',
  };
  return labels[status];
};

export const getCategoryLabel = (category: AssetCategory): string => {
  const labels: Record<AssetCategory, string> = {
    pump: 'Pump',
    motor: 'Motor',
    sensor: 'Sensor',
    valve: 'Valve',
    tank: 'Tank',
    filter: 'Filter',
    controller: 'Controller',
    blower: 'Blower',
    dosing: 'Dosing System',
    membrane: 'Membrane',
  };
  return labels[category];
};
