// Equipment/Asset types for industrial IoT
export type AssetType = 'pump' | 'filter' | 'tank' | 'valve' | 'blower' | 'motor' | 'controller' | 'meter';
export type AssetStatus = 'operational' | 'maintenance' | 'fault' | 'offline';

export interface Asset {
  id: string;
  plantId: string;
  plantName: string;
  name: string;
  assetCode: string;
  type: AssetType;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installationDate: Date;
  warrantyExpiry: Date;
  status: AssetStatus;
  zone: string;
  sensorCount: number;
  lastMaintenance: Date;
  nextMaintenance: Date;
  runningHours: number;
  efficiency: number;
  criticality: 'high' | 'medium' | 'low';
}

export const mockAssets: Asset[] = [
  {
    id: 'asset-1',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    name: 'Raw Water Intake Pump A',
    assetCode: 'CHN-PMP-001',
    type: 'pump',
    manufacturer: 'Grundfos',
    model: 'CR 95-4',
    serialNumber: 'GF-2021-45678',
    installationDate: new Date('2021-03-15'),
    warrantyExpiry: new Date('2026-03-15'),
    status: 'operational',
    zone: 'Intake Section',
    sensorCount: 4,
    lastMaintenance: new Date('2024-11-10'),
    nextMaintenance: new Date('2025-02-10'),
    runningHours: 28450,
    efficiency: 94.5,
    criticality: 'high',
  },
  {
    id: 'asset-2',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    name: 'Raw Water Intake Pump B',
    assetCode: 'CHN-PMP-002',
    type: 'pump',
    manufacturer: 'Grundfos',
    model: 'CR 95-4',
    serialNumber: 'GF-2021-45679',
    installationDate: new Date('2021-03-15'),
    warrantyExpiry: new Date('2026-03-15'),
    status: 'operational',
    zone: 'Intake Section',
    sensorCount: 4,
    lastMaintenance: new Date('2024-10-20'),
    nextMaintenance: new Date('2025-01-20'),
    runningHours: 26890,
    efficiency: 92.1,
    criticality: 'high',
  },
  {
    id: 'asset-3',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    name: 'RO Membrane Unit A',
    assetCode: 'CHN-FLT-001',
    type: 'filter',
    manufacturer: 'DOW Chemical',
    model: 'FILMTEC BW30-400',
    serialNumber: 'DOW-2022-89012',
    installationDate: new Date('2022-06-20'),
    warrantyExpiry: new Date('2025-06-20'),
    status: 'operational',
    zone: 'Treatment Section',
    sensorCount: 6,
    lastMaintenance: new Date('2024-12-01'),
    nextMaintenance: new Date('2025-03-01'),
    runningHours: 18520,
    efficiency: 97.2,
    criticality: 'high',
  },
  {
    id: 'asset-4',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    name: 'Clear Water Tank 1',
    assetCode: 'CHN-TNK-001',
    type: 'tank',
    manufacturer: 'Custom Built',
    model: 'SS304-50KL',
    serialNumber: 'CWT-2020-001',
    installationDate: new Date('2020-01-10'),
    warrantyExpiry: new Date('2030-01-10'),
    status: 'operational',
    zone: 'Storage Section',
    sensorCount: 3,
    lastMaintenance: new Date('2024-08-15'),
    nextMaintenance: new Date('2025-08-15'),
    runningHours: 43800,
    efficiency: 100,
    criticality: 'medium',
  },
  {
    id: 'asset-5',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    name: 'Distribution Pump Station A',
    assetCode: 'MUM-PMP-001',
    type: 'pump',
    manufacturer: 'KSB',
    model: 'Etanorm G 150-315',
    serialNumber: 'KSB-2020-12345',
    installationDate: new Date('2020-08-22'),
    warrantyExpiry: new Date('2025-08-22'),
    status: 'operational',
    zone: 'Distribution Section',
    sensorCount: 5,
    lastMaintenance: new Date('2024-09-05'),
    nextMaintenance: new Date('2025-03-05'),
    runningHours: 35600,
    efficiency: 91.8,
    criticality: 'high',
  },
  {
    id: 'asset-6',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    name: 'Chlorine Dosing System',
    assetCode: 'MUM-DOS-001',
    type: 'controller',
    manufacturer: 'ProMinent',
    model: 'Sigma X',
    serialNumber: 'PM-2021-67890',
    installationDate: new Date('2021-11-30'),
    warrantyExpiry: new Date('2024-11-30'),
    status: 'maintenance',
    zone: 'Disinfection Section',
    sensorCount: 2,
    lastMaintenance: new Date('2025-01-05'),
    nextMaintenance: new Date('2025-04-05'),
    runningHours: 22100,
    efficiency: 88.5,
    criticality: 'high',
  },
  {
    id: 'asset-7',
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    name: 'Backwash Blower Unit',
    assetCode: 'DEL-BLW-001',
    type: 'blower',
    manufacturer: 'Atlas Copco',
    model: 'ZB 75 VSD',
    serialNumber: 'AC-2022-34567',
    installationDate: new Date('2022-02-14'),
    warrantyExpiry: new Date('2027-02-14'),
    status: 'fault',
    zone: 'Backwash Section',
    sensorCount: 3,
    lastMaintenance: new Date('2024-07-20'),
    nextMaintenance: new Date('2025-01-20'),
    runningHours: 16800,
    efficiency: 78.2,
    criticality: 'medium',
  },
  {
    id: 'asset-8',
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    name: 'Flow Control Valve FCV-01',
    assetCode: 'DEL-VLV-001',
    type: 'valve',
    manufacturer: 'Emerson',
    model: 'Fisher V250',
    serialNumber: 'EM-2021-78901',
    installationDate: new Date('2021-05-18'),
    warrantyExpiry: new Date('2026-05-18'),
    status: 'operational',
    zone: 'Treatment Section',
    sensorCount: 2,
    lastMaintenance: new Date('2024-10-12'),
    nextMaintenance: new Date('2025-04-12'),
    runningHours: 29200,
    efficiency: 96.4,
    criticality: 'medium',
  },
  {
    id: 'asset-9',
    plantId: 'plant-4',
    plantName: 'Bangalore WTP-04',
    name: 'High Lift Pump Motor',
    assetCode: 'BLR-MTR-001',
    type: 'motor',
    manufacturer: 'ABB',
    model: 'M3BP 315SMB 4',
    serialNumber: 'ABB-2020-23456',
    installationDate: new Date('2020-12-08'),
    warrantyExpiry: new Date('2025-12-08'),
    status: 'operational',
    zone: 'Distribution Section',
    sensorCount: 4,
    lastMaintenance: new Date('2024-11-25'),
    nextMaintenance: new Date('2025-05-25'),
    runningHours: 32400,
    efficiency: 93.7,
    criticality: 'high',
  },
  {
    id: 'asset-10',
    plantId: 'plant-5',
    plantName: 'Hyderabad WTP-05',
    name: 'Ultrasonic Flow Meter',
    assetCode: 'HYD-MTR-001',
    type: 'meter',
    manufacturer: 'Endress+Hauser',
    model: 'Proline Prosonic Flow 93W',
    serialNumber: 'EH-2023-56789',
    installationDate: new Date('2023-04-22'),
    warrantyExpiry: new Date('2028-04-22'),
    status: 'operational',
    zone: 'Metering Section',
    sensorCount: 1,
    lastMaintenance: new Date('2024-12-10'),
    nextMaintenance: new Date('2025-06-10'),
    runningHours: 14200,
    efficiency: 99.1,
    criticality: 'low',
  },
  {
    id: 'asset-11',
    plantId: 'plant-6',
    plantName: 'Pune WTP-06',
    name: 'Main Transfer Pump',
    assetCode: 'PUN-PMP-001',
    type: 'pump',
    manufacturer: 'Kirloskar',
    model: 'DB 150/26',
    serialNumber: 'KIR-2019-90123',
    installationDate: new Date('2019-09-15'),
    warrantyExpiry: new Date('2024-09-15'),
    status: 'offline',
    zone: 'Transfer Section',
    sensorCount: 3,
    lastMaintenance: new Date('2024-06-30'),
    nextMaintenance: new Date('2025-01-30'),
    runningHours: 41200,
    efficiency: 85.3,
    criticality: 'high',
  },
  {
    id: 'asset-12',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    name: 'Activated Carbon Filter',
    assetCode: 'MUM-FLT-001',
    type: 'filter',
    manufacturer: 'Pall Corporation',
    model: 'HF Series',
    serialNumber: 'PALL-2022-45678',
    installationDate: new Date('2022-08-10'),
    warrantyExpiry: new Date('2027-08-10'),
    status: 'operational',
    zone: 'Treatment Section',
    sensorCount: 4,
    lastMaintenance: new Date('2024-11-15'),
    nextMaintenance: new Date('2025-02-15'),
    runningHours: 19800,
    efficiency: 95.6,
    criticality: 'medium',
  },
];

// Helper functions
export const getAssetsByPlant = (plantId: string): Asset[] => {
  return mockAssets.filter(asset => asset.plantId === plantId);
};

export const getAssetsByType = (type: AssetType): Asset[] => {
  return mockAssets.filter(asset => asset.type === type);
};

export const getAssetsByStatus = (status: AssetStatus): Asset[] => {
  return mockAssets.filter(asset => asset.status === status);
};

export const getOperationalAssetsCount = (): number => {
  return mockAssets.filter(asset => asset.status === 'operational').length;
};

export const getFaultAssetsCount = (): number => {
  return mockAssets.filter(asset => asset.status === 'fault').length;
};

export const getMaintenanceAssetsCount = (): number => {
  return mockAssets.filter(asset => asset.status === 'maintenance').length;
};

export const getAssetTypeCount = (): Record<AssetType, number> => {
  const counts: Record<AssetType, number> = {
    pump: 0,
    filter: 0,
    tank: 0,
    valve: 0,
    blower: 0,
    motor: 0,
    controller: 0,
    meter: 0,
  };

  mockAssets.forEach(asset => {
    counts[asset.type]++;
  });

  return counts;
};

export const getAverageEfficiency = (): number => {
  const total = mockAssets.reduce((sum, asset) => sum + asset.efficiency, 0);
  return parseFloat((total / mockAssets.length).toFixed(1));
};

export const getWarrantyExpiringAssets = (days: number = 90): Asset[] => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return mockAssets.filter(asset => asset.warrantyExpiry <= futureDate && asset.warrantyExpiry >= now);
};

export const getMaintenanceDueAssets = (days: number = 30): Asset[] => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return mockAssets.filter(asset => asset.nextMaintenance <= futureDate);
};

export const getAssetTypeLabel = (type: AssetType): string => {
  const labels: Record<AssetType, string> = {
    pump: 'Pump',
    filter: 'Filter/Membrane',
    tank: 'Tank/Vessel',
    valve: 'Valve',
    blower: 'Blower',
    motor: 'Motor',
    controller: 'Controller/PLC',
    meter: 'Meter/Instrument',
  };
  return labels[type];
};
