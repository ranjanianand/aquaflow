'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Circle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Droplets,
  Thermometer,
  Gauge,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

interface SensorDetail {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: number[];
}

interface PlantStatus {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'warning' | 'offline';
  sensors: {
    total: number;
    active: number;
    warning: number;
    critical: number;
  };
  flowRate: number;
  efficiency: number;
  lastUpdate: string;
  sensorDetails: SensorDetail[];
}

const plantData: PlantStatus[] = [
  {
    id: '1',
    name: 'Plant A - Main Treatment',
    location: 'Chennai North',
    status: 'online',
    sensors: { total: 24, active: 24, warning: 0, critical: 0 },
    flowRate: 485,
    efficiency: 98.5,
    lastUpdate: '2s ago',
    sensorDetails: [
      { id: 'a1', name: 'pH Level', value: 7.2, unit: 'pH', status: 'normal', trend: [7.1, 7.2, 7.1, 7.2, 7.2, 7.2] },
      { id: 'a2', name: 'Turbidity', value: 0.8, unit: 'NTU', status: 'normal', trend: [0.9, 0.8, 0.9, 0.8, 0.8, 0.8] },
      { id: 'a3', name: 'Flow Rate', value: 485, unit: 'm³/h', status: 'normal', trend: [480, 485, 482, 488, 485, 485] },
      { id: 'a4', name: 'Temperature', value: 24.5, unit: '°C', status: 'normal', trend: [24.2, 24.3, 24.4, 24.5, 24.5, 24.5] },
    ]
  },
  {
    id: '2',
    name: 'Plant B - Secondary',
    location: 'Chennai South',
    status: 'warning',
    sensors: { total: 18, active: 17, warning: 2, critical: 0 },
    flowRate: 320,
    efficiency: 94.2,
    lastUpdate: '5s ago',
    sensorDetails: [
      { id: 'b1', name: 'pH Level', value: 7.4, unit: 'pH', status: 'normal', trend: [7.3, 7.3, 7.4, 7.4, 7.4, 7.4] },
      { id: 'b2', name: 'Temperature', value: 28.5, unit: '°C', status: 'warning', trend: [26.5, 27.0, 27.5, 28.0, 28.3, 28.5] },
      { id: 'b3', name: 'Pressure', value: 4.2, unit: 'bar', status: 'normal', trend: [4.1, 4.2, 4.2, 4.2, 4.2, 4.2] },
      { id: 'b4', name: 'DO Level', value: 6.8, unit: 'mg/L', status: 'normal', trend: [6.9, 6.8, 6.8, 6.8, 6.8, 6.8] },
    ]
  },
  {
    id: '3',
    name: 'Plant C - Distribution',
    location: 'Chennai Central',
    status: 'warning',
    sensors: { total: 32, active: 32, warning: 1, critical: 0 },
    flowRate: 890,
    efficiency: 97.8,
    lastUpdate: '3s ago',
    sensorDetails: [
      { id: 'c1', name: 'pH Level', value: 8.4, unit: 'pH', status: 'warning', trend: [7.8, 8.0, 8.1, 8.2, 8.3, 8.4] },
      { id: 'c2', name: 'Flow Rate', value: 890, unit: 'm³/h', status: 'normal', trend: [880, 885, 888, 890, 890, 890] },
      { id: 'c3', name: 'Ammonia', value: 0.3, unit: 'mg/L', status: 'normal', trend: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3] },
      { id: 'c4', name: 'ORP', value: 650, unit: 'mV', status: 'normal', trend: [645, 648, 650, 650, 650, 650] },
    ]
  },
  {
    id: '4',
    name: 'Plant D - Reservoir',
    location: 'Chennai West',
    status: 'online',
    sensors: { total: 12, active: 12, warning: 0, critical: 0 },
    flowRate: 156,
    efficiency: 99.1,
    lastUpdate: '8s ago',
    sensorDetails: [
      { id: 'd1', name: 'Water Level', value: 85, unit: '%', status: 'normal', trend: [84, 84, 85, 85, 85, 85] },
      { id: 'd2', name: 'pH Level', value: 7.0, unit: 'pH', status: 'normal', trend: [7.0, 7.0, 7.0, 7.0, 7.0, 7.0] },
      { id: 'd3', name: 'Chlorine', value: 1.5, unit: 'mg/L', status: 'normal', trend: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5] },
      { id: 'd4', name: 'Temperature', value: 23.0, unit: '°C', status: 'normal', trend: [23.0, 23.0, 23.0, 23.0, 23.0, 23.0] },
    ]
  },
  {
    id: '5',
    name: 'Plant E - Industrial',
    location: 'Ambattur',
    status: 'offline',
    sensors: { total: 28, active: 0, warning: 0, critical: 28 },
    flowRate: 0,
    efficiency: 0,
    lastUpdate: '15m ago',
    sensorDetails: [
      { id: 'e1', name: 'pH Level', value: 0, unit: 'pH', status: 'critical', trend: [7.2, 7.2, 0, 0, 0, 0] },
      { id: 'e2', name: 'Flow Rate', value: 0, unit: 'm³/h', status: 'critical', trend: [450, 380, 0, 0, 0, 0] },
      { id: 'e3', name: 'Pressure', value: 0, unit: 'bar', status: 'critical', trend: [4.0, 3.5, 0, 0, 0, 0] },
      { id: 'e4', name: 'Temperature', value: 0, unit: '°C', status: 'critical', trend: [25.0, 24.0, 0, 0, 0, 0] },
    ]
  },
  {
    id: '6',
    name: 'Plant F - Municipal',
    location: 'Tambaram',
    status: 'online',
    sensors: { total: 28, active: 28, warning: 0, critical: 0 },
    flowRate: 996,
    efficiency: 96.4,
    lastUpdate: '1s ago',
    sensorDetails: [
      { id: 'f1', name: 'pH Level', value: 7.1, unit: 'pH', status: 'normal', trend: [7.1, 7.1, 7.1, 7.1, 7.1, 7.1] },
      { id: 'f2', name: 'Flow Rate', value: 996, unit: 'm³/h', status: 'normal', trend: [990, 992, 994, 995, 996, 996] },
      { id: 'f3', name: 'TSS', value: 8, unit: 'mg/L', status: 'normal', trend: [9, 8, 8, 8, 8, 8] },
      { id: 'f4', name: 'Conductivity', value: 420, unit: 'µS/cm', status: 'normal', trend: [418, 419, 420, 420, 420, 420] },
    ]
  },
];

function MiniSparkline({ data, status }: { data: number[]; status: string }) {
  const chartData = data.map((value, index) => ({ value }));
  const color = status === 'critical' ? '#ef4444' :
                status === 'warning' ? '#f59e0b' : '#10b981';

  return (
    <div className="w-16 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SensorDetailRow({ sensor }: { sensor: SensorDetail }) {
  return (
    <div className="flex items-center gap-4 py-2 px-4 border-b border-slate-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-slate-600">{sensor.name}</span>
      </div>
      <div className="w-20 text-right">
        <span className={cn(
          'text-sm font-mono font-bold',
          sensor.status === 'critical' && 'text-red-600',
          sensor.status === 'warning' && 'text-amber-600',
          sensor.status === 'normal' && 'text-slate-900'
        )}>
          {sensor.value}
        </span>
        <span className="text-xs text-slate-400 ml-1">{sensor.unit}</span>
      </div>
      <MiniSparkline data={sensor.trend} status={sensor.status} />
      <div className={cn(
        'w-2 h-2 rounded-full flex-shrink-0',
        sensor.status === 'critical' && 'bg-red-500',
        sensor.status === 'warning' && 'bg-amber-500',
        sensor.status === 'normal' && 'bg-emerald-500'
      )} />
    </div>
  );
}

function PlantRow({ plant }: { plant: PlantStatus }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const StatusIcon = plant.status === 'online' ? CheckCircle :
                     plant.status === 'warning' ? AlertTriangle : XCircle;

  return (
    <div className={cn(
      'border-b-2 border-slate-100',
      plant.status === 'offline' && 'bg-red-50/30'
    )}>
      {/* Main Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-4 px-4 py-3.5',
          'hover:bg-slate-50 transition-colors text-sm text-left'
        )}
      >
        {/* Expand/Collapse */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>

        {/* Plant Name & Location */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
            plant.status === 'online' && 'bg-emerald-100 border border-emerald-200',
            plant.status === 'warning' && 'bg-amber-100 border border-amber-200',
            plant.status === 'offline' && 'bg-red-100 border border-red-200'
          )}>
            <StatusIcon
              className={cn(
                'h-4 w-4',
                plant.status === 'online' && 'text-emerald-600',
                plant.status === 'warning' && 'text-amber-600',
                plant.status === 'offline' && 'text-red-600'
              )}
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{plant.name}</p>
            <p className="text-xs text-slate-500 truncate">{plant.location}</p>
          </div>
        </div>

        {/* Sensors */}
        <div className="w-20 text-center flex-shrink-0">
          <div className="flex items-center justify-center gap-1">
            <span className="text-emerald-600 font-mono font-bold">{plant.sensors.active}</span>
            <span className="text-slate-400">/</span>
            <span className="font-mono text-slate-600">{plant.sensors.total}</span>
          </div>
          {(plant.sensors.warning > 0 || plant.sensors.critical > 0) && (
            <span className={cn(
              'text-[10px] font-bold',
              plant.sensors.critical > 0 ? 'text-red-600' : 'text-amber-600'
            )}>
              ({plant.sensors.critical > 0 ? `${plant.sensors.critical} crit` : `${plant.sensors.warning} warn`})
            </span>
          )}
        </div>

        {/* Flow Rate */}
        <div className="w-24 text-right flex-shrink-0">
          <span className="font-mono font-bold text-slate-900">{plant.flowRate.toLocaleString()}</span>
          <span className="text-xs text-slate-400 ml-1">m³/h</span>
        </div>

        {/* Efficiency */}
        <div className="w-16 text-right flex-shrink-0">
          <span className={cn(
            'font-mono font-bold',
            plant.efficiency >= 95 && 'text-emerald-600',
            plant.efficiency >= 90 && plant.efficiency < 95 && 'text-amber-600',
            plant.efficiency < 90 && 'text-red-600'
          )}>
            {plant.efficiency > 0 ? `${plant.efficiency.toFixed(1)}%` : '-'}
          </span>
        </div>

        {/* Status Badge */}
        <div className="w-20 flex-shrink-0 flex justify-center">
          <span className={cn(
            'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border',
            plant.status === 'online' && 'bg-emerald-100 text-emerald-700 border-emerald-200',
            plant.status === 'warning' && 'bg-amber-100 text-amber-700 border-amber-200',
            plant.status === 'offline' && 'bg-red-100 text-red-700 border-red-200'
          )}>
            {plant.status}
          </span>
        </div>

        {/* Last Update */}
        <div className="w-16 text-right flex-shrink-0">
          <span className="text-xs text-slate-400 font-mono">{plant.lastUpdate}</span>
        </div>
      </button>

      {/* Expanded Sensor Details */}
      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-200">
          <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Key Sensors
            </span>
            <button className="text-[10px] text-primary font-bold hover:underline">
              View All {plant.sensors.total} Sensors →
            </button>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            {plant.sensorDetails.map((sensor) => (
              <SensorDetailRow key={sensor.id} sensor={sensor} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function IndustrialPlantStatus() {
  const onlineCount = plantData.filter(p => p.status === 'online').length;
  const warningCount = plantData.filter(p => p.status === 'warning').length;
  const offlineCount = plantData.filter(p => p.status === 'offline').length;

  return (
    <div className="border-2 border-slate-200 rounded-lg overflow-hidden h-full flex flex-col bg-white shadow-sm">
      {/* Header */}
      <div className="bg-slate-100 px-4 py-3 border-b-2 border-slate-200 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Plant Status Overview</span>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
            <span className="text-slate-600 font-medium">{onlineCount} Online</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
            <span className="text-slate-600 font-medium">{warningCount} Warning</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
            <span className="text-slate-600 font-medium">{offlineCount} Offline</span>
          </span>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border-b-2 border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <span className="w-4" /> {/* For expand icon */}
        <span className="flex-1">Plant</span>
        <span className="w-20 text-center">Sensors</span>
        <span className="w-24 text-right">Flow Rate</span>
        <span className="w-16 text-right">Efficiency</span>
        <span className="w-20 text-center">Status</span>
        <span className="w-16 text-right">Updated</span>
      </div>

      {/* Plant Rows */}
      <div className="flex-1 overflow-y-auto">
        {plantData.map((plant) => (
          <PlantRow key={plant.id} plant={plant} />
        ))}
      </div>
    </div>
  );
}
