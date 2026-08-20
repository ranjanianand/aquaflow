// Gateway and Integration configuration for Industrial IoT
// Each plant has its own Edge Gateway connecting local PLCs to cloud

export interface PLCConnection {
  id: string;
  name: string;
  protocol: 'Modbus TCP' | 'Modbus RTU' | 'OPC-UA' | 'EtherNet/IP' | 'Profinet';
  ipAddress: string;
  port: number;
  status: 'connected' | 'disconnected' | 'error';
  lastPoll: Date;
  pollIntervalMs: number;
  registerCount: number;
  vendor?: string;
  model?: string;
}

export interface Gateway {
  id: string;
  plantId: string;
  plantName: string;
  name: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  ipAddress: string;
  macAddress: string;
  status: 'online' | 'offline' | 'warning';
  lastHeartbeat: Date;
  uptime: number; // in hours
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  storageUsage: number; // percentage
  plcConnections: PLCConnection[];
  mqttConnected: boolean;
  mqttLastMessage: Date;
  dataPointsPerSecond: number;
  bufferSize: number; // MB of offline buffer
  bufferUsed: number; // MB currently used
}

export interface MQTTBrokerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'mqtt' | 'mqtts' | 'ws' | 'wss';
  username: string;
  clientIdPrefix: string;
  keepAlive: number;
  cleanSession: boolean;
  qos: 0 | 1 | 2;
  status: 'connected' | 'disconnected' | 'connecting';
  connectedGateways: number;
  messagesPerSecond: number;
  lastConnected: Date;
}

// Helper for recent timestamps
const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60000);
const hoursAgo = (hours: number): Date => new Date(Date.now() - hours * 3600000);

// System-wide MQTT Broker Configuration
export const mqttBrokerConfig: MQTTBrokerConfig = {
  id: 'mqtt-1',
  name: 'AquaFlow Cloud Broker',
  host: 'mqtt.aquaflow.io',
  port: 8883,
  protocol: 'mqtts',
  username: 'aquaflow_system',
  clientIdPrefix: 'aquaflow_gw_',
  keepAlive: 60,
  cleanSession: false,
  qos: 1,
  status: 'connected',
  connectedGateways: 5,
  messagesPerSecond: 1250,
  lastConnected: minutesAgo(0),
};

// Per-Plant Gateway Configurations
export const mockGateways: Gateway[] = [
  {
    id: 'gw-001',
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    name: 'Chennai Edge Gateway',
    model: 'Siemens IOT2050',
    serialNumber: 'SN-CHN-2024-001',
    firmwareVersion: 'v2.4.1',
    ipAddress: '192.168.10.1',
    macAddress: '00:1A:2B:3C:4D:01',
    status: 'online',
    lastHeartbeat: minutesAgo(0),
    uptime: 720, // 30 days
    cpuUsage: 32,
    memoryUsage: 45,
    storageUsage: 28,
    mqttConnected: true,
    mqttLastMessage: minutesAgo(0),
    dataPointsPerSecond: 250,
    bufferSize: 512,
    bufferUsed: 12,
    plcConnections: [
      {
        id: 'plc-chn-001',
        name: 'Main Process PLC',
        protocol: 'Modbus TCP',
        ipAddress: '192.168.10.10',
        port: 502,
        status: 'connected',
        lastPoll: minutesAgo(0),
        pollIntervalMs: 1000,
        registerCount: 128,
        vendor: 'Siemens',
        model: 'S7-1500',
      },
      {
        id: 'plc-chn-002',
        name: 'Chemical Dosing PLC',
        protocol: 'Modbus TCP',
        ipAddress: '192.168.10.11',
        port: 502,
        status: 'connected',
        lastPoll: minutesAgo(0),
        pollIntervalMs: 2000,
        registerCount: 64,
        vendor: 'Allen-Bradley',
        model: 'CompactLogix',
      },
    ],
  },
  {
    id: 'gw-002',
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    name: 'Mumbai Edge Gateway',
    model: 'Advantech UNO-2484G',
    serialNumber: 'SN-MUM-2024-002',
    firmwareVersion: 'v2.4.0',
    ipAddress: '192.168.20.1',
    macAddress: '00:1A:2B:3C:4D:02',
    status: 'online',
    lastHeartbeat: minutesAgo(1),
    uptime: 480, // 20 days
    cpuUsage: 28,
    memoryUsage: 52,
    storageUsage: 35,
    mqttConnected: true,
    mqttLastMessage: minutesAgo(0),
    dataPointsPerSecond: 180,
    bufferSize: 512,
    bufferUsed: 8,
    plcConnections: [
      {
        id: 'plc-mum-001',
        name: 'Primary Process Control',
        protocol: 'OPC-UA',
        ipAddress: '192.168.20.10',
        port: 4840,
        status: 'connected',
        lastPoll: minutesAgo(0),
        pollIntervalMs: 1000,
        registerCount: 96,
        vendor: 'Siemens',
        model: 'S7-1200',
      },
    ],
  },
  {
    id: 'gw-003',
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    name: 'Delhi Edge Gateway',
    model: 'Siemens IOT2050',
    serialNumber: 'SN-DEL-2024-003',
    firmwareVersion: 'v2.3.8',
    ipAddress: '192.168.30.1',
    macAddress: '00:1A:2B:3C:4D:03',
    status: 'warning',
    lastHeartbeat: minutesAgo(5),
    uptime: 168, // 7 days
    cpuUsage: 78,
    memoryUsage: 85,
    storageUsage: 62,
    mqttConnected: true,
    mqttLastMessage: minutesAgo(2),
    dataPointsPerSecond: 145,
    bufferSize: 256,
    bufferUsed: 45,
    plcConnections: [
      {
        id: 'plc-del-001',
        name: 'Water Treatment PLC',
        protocol: 'Modbus TCP',
        ipAddress: '192.168.30.10',
        port: 502,
        status: 'connected',
        lastPoll: minutesAgo(0),
        pollIntervalMs: 1000,
        registerCount: 80,
        vendor: 'Schneider',
        model: 'M340',
      },
      {
        id: 'plc-del-002',
        name: 'Pump Station PLC',
        protocol: 'Modbus RTU',
        ipAddress: '192.168.30.11',
        port: 502,
        status: 'error',
        lastPoll: minutesAgo(15),
        pollIntervalMs: 2000,
        registerCount: 32,
        vendor: 'ABB',
        model: 'AC500',
      },
    ],
  },
  {
    id: 'gw-004',
    plantId: 'plant-4',
    plantName: 'Bangalore WTP-04',
    name: 'Bangalore Edge Gateway',
    model: 'Dell Edge Gateway 5200',
    serialNumber: 'SN-BLR-2024-004',
    firmwareVersion: 'v2.4.1',
    ipAddress: '192.168.40.1',
    macAddress: '00:1A:2B:3C:4D:04',
    status: 'online',
    lastHeartbeat: minutesAgo(0),
    uptime: 960, // 40 days
    cpuUsage: 22,
    memoryUsage: 38,
    storageUsage: 18,
    mqttConnected: true,
    mqttLastMessage: minutesAgo(0),
    dataPointsPerSecond: 165,
    bufferSize: 512,
    bufferUsed: 5,
    plcConnections: [
      {
        id: 'plc-blr-001',
        name: 'Process Automation',
        protocol: 'EtherNet/IP',
        ipAddress: '192.168.40.10',
        port: 44818,
        status: 'connected',
        lastPoll: minutesAgo(0),
        pollIntervalMs: 500,
        registerCount: 112,
        vendor: 'Rockwell',
        model: 'ControlLogix',
      },
    ],
  },
  {
    id: 'gw-005',
    plantId: 'plant-5',
    plantName: 'Hyderabad WTP-05',
    name: 'Hyderabad Edge Gateway',
    model: 'Advantech UNO-2484G',
    serialNumber: 'SN-HYD-2024-005',
    firmwareVersion: 'v2.4.1',
    ipAddress: '192.168.50.1',
    macAddress: '00:1A:2B:3C:4D:05',
    status: 'online',
    lastHeartbeat: minutesAgo(0),
    uptime: 336, // 14 days
    cpuUsage: 35,
    memoryUsage: 48,
    storageUsage: 22,
    mqttConnected: true,
    mqttLastMessage: minutesAgo(0),
    dataPointsPerSecond: 120,
    bufferSize: 256,
    bufferUsed: 3,
    plcConnections: [
      {
        id: 'plc-hyd-001',
        name: 'Treatment Control',
        protocol: 'Modbus TCP',
        ipAddress: '192.168.50.10',
        port: 502,
        status: 'connected',
        lastPoll: minutesAgo(0),
        pollIntervalMs: 1000,
        registerCount: 72,
        vendor: 'Siemens',
        model: 'S7-1200',
      },
    ],
  },
  {
    id: 'gw-006',
    plantId: 'plant-6',
    plantName: 'Pune WTP-06',
    name: 'Pune Edge Gateway',
    model: 'Siemens IOT2050',
    serialNumber: 'SN-PUN-2024-006',
    firmwareVersion: 'v2.3.5',
    ipAddress: '192.168.60.1',
    macAddress: '00:1A:2B:3C:4D:06',
    status: 'offline',
    lastHeartbeat: hoursAgo(2),
    uptime: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    storageUsage: 45,
    mqttConnected: false,
    mqttLastMessage: hoursAgo(2),
    dataPointsPerSecond: 0,
    bufferSize: 256,
    bufferUsed: 128,
    plcConnections: [
      {
        id: 'plc-pun-001',
        name: 'Plant Control',
        protocol: 'Modbus TCP',
        ipAddress: '192.168.60.10',
        port: 502,
        status: 'disconnected',
        lastPoll: hoursAgo(2),
        pollIntervalMs: 1000,
        registerCount: 48,
        vendor: 'Siemens',
        model: 'S7-300',
      },
    ],
  },
];

// Helper functions
export const getGatewayByPlantId = (plantId: string): Gateway | undefined => {
  return mockGateways.find((gw) => gw.plantId === plantId);
};

export const getGatewayById = (id: string): Gateway | undefined => {
  return mockGateways.find((gw) => gw.id === id);
};

export const getOnlineGatewaysCount = (): number => {
  return mockGateways.filter((gw) => gw.status === 'online').length;
};

export const getTotalPLCConnections = (): number => {
  return mockGateways.reduce((acc, gw) => acc + gw.plcConnections.length, 0);
};

export const getConnectedPLCCount = (): number => {
  return mockGateways.reduce(
    (acc, gw) => acc + gw.plcConnections.filter((plc) => plc.status === 'connected').length,
    0
  );
};

export const getTotalDataPointsPerSecond = (): number => {
  return mockGateways.reduce((acc, gw) => acc + gw.dataPointsPerSecond, 0);
};

// Status color helpers
export const getGatewayStatusColor = (status: Gateway['status']) => {
  switch (status) {
    case 'online':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    case 'warning':
      return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
    case 'offline':
      return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
  }
};

export const getPLCStatusColor = (status: PLCConnection['status']) => {
  switch (status) {
    case 'connected':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    case 'disconnected':
      return { bg: 'bg-slate-100', text: 'text-slate-600' };
    case 'error':
      return { bg: 'bg-red-100', text: 'text-red-700' };
  }
};
