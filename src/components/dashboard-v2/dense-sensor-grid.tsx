'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertCircle
} from 'lucide-react';

interface SensorReading {
  id: string;
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  setpoint?: number;
  status: 'normal' | 'warning' | 'critical';
  commStatus: 'online' | 'offline' | 'stale';
  trend: 'up' | 'down' | 'stable';
  trendValue?: string;
  lastUpdate: string;
  plant: string;
}

interface PlantSensors {
  plant: string;
  location: string;
  status: 'online' | 'warning' | 'offline';
  sensors: SensorReading[];
}

const plantSensorData: PlantSensors[] = [
  {
    plant: 'Plant A',
    location: 'Chennai North - Main Treatment',
    status: 'online',
    sensors: [
      { id: '1', name: 'pH Level', value: 7.2, unit: 'pH', min: 6.5, max: 8.5, setpoint: 7.0, status: 'normal', commStatus: 'online', trend: 'stable', trendValue: '+0.1', lastUpdate: '2s', plant: 'Plant A' },
      { id: '2', name: 'Turbidity', value: 0.8, unit: 'NTU', min: 0, max: 4, setpoint: 1.0, status: 'normal', commStatus: 'online', trend: 'down', trendValue: '-0.2', lastUpdate: '2s', plant: 'Plant A' },
      { id: '3', name: 'Chlorine', value: 1.2, unit: 'mg/L', min: 0.5, max: 2.0, setpoint: 1.5, status: 'normal', commStatus: 'online', trend: 'stable', trendValue: '0.0', lastUpdate: '5s', plant: 'Plant A' },
      { id: '4', name: 'Flow Rate', value: 485, unit: 'm³/h', min: 200, max: 600, status: 'normal', commStatus: 'online', trend: 'up', trendValue: '+12', lastUpdate: '1s', plant: 'Plant A' },
    ]
  },
  {
    plant: 'Plant B',
    location: 'Chennai South - Secondary',
    status: 'warning',
    sensors: [
      { id: '5', name: 'Pressure', value: 4.2, unit: 'bar', min: 2.0, max: 6.0, setpoint: 4.0, status: 'normal', commStatus: 'online', trend: 'stable', trendValue: '0.0', lastUpdate: '3s', plant: 'Plant B' },
      { id: '6', name: 'Temperature', value: 28.5, unit: '°C', min: 15, max: 30, setpoint: 25, status: 'warning', commStatus: 'online', trend: 'up', trendValue: '+1.2', lastUpdate: '2s', plant: 'Plant B' },
      { id: '7', name: 'DO Level', value: 6.8, unit: 'mg/L', min: 5.0, max: 9.0, setpoint: 7.0, status: 'normal', commStatus: 'online', trend: 'stable', trendValue: '-0.1', lastUpdate: '4s', plant: 'Plant B' },
      { id: '8', name: 'Conductivity', value: 450, unit: 'µS/cm', min: 200, max: 800, setpoint: 500, status: 'normal', commStatus: 'stale', trend: 'down', trendValue: '-15', lastUpdate: '45s', plant: 'Plant B' },
    ]
  },
  {
    plant: 'Plant C',
    location: 'Chennai Central - Distribution',
    status: 'warning',
    sensors: [
      { id: '9', name: 'pH Level', value: 8.4, unit: 'pH', min: 6.5, max: 8.5, setpoint: 7.0, status: 'warning', commStatus: 'online', trend: 'up', trendValue: '+0.3', lastUpdate: '1s', plant: 'Plant C' },
      { id: '10', name: 'Ammonia', value: 0.3, unit: 'mg/L', min: 0, max: 0.5, setpoint: 0.2, status: 'normal', commStatus: 'online', trend: 'stable', trendValue: '0.0', lastUpdate: '3s', plant: 'Plant C' },
      { id: '11', name: 'TSS', value: 12, unit: 'mg/L', min: 0, max: 25, setpoint: 10, status: 'normal', commStatus: 'online', trend: 'down', trendValue: '-2', lastUpdate: '2s', plant: 'Plant C' },
      { id: '12', name: 'ORP', value: 650, unit: 'mV', min: 400, max: 800, setpoint: 600, status: 'normal', commStatus: 'online', trend: 'stable', trendValue: '+5', lastUpdate: '5s', plant: 'Plant C' },
    ]
  },
];

function SensorCard({ sensor }: { sensor: SensorReading }) {
  const percentage = ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100;
  const setpointPercentage = sensor.setpoint
    ? ((sensor.setpoint - sensor.min) / (sensor.max - sensor.min)) * 100
    : null;
  const TrendIcon = sensor.trend === 'up' ? TrendingUp : sensor.trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        // Industrial: sharp corners, clean borders
        'relative p-3 bg-white border border-slate-300',
        'hover:border-slate-400 transition-colors cursor-pointer',
        // Status via left border - thicker for better visibility
        sensor.status === 'critical' && 'border-l-[3px] border-l-red-600',
        sensor.status === 'warning' && 'border-l-[3px] border-l-amber-500',
        sensor.commStatus === 'stale' && 'opacity-75',
        sensor.commStatus === 'offline' && 'opacity-50 bg-slate-100'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {sensor.commStatus === 'offline' ? (
            <WifiOff className="h-3 w-3 text-red-600" />
          ) : sensor.commStatus === 'stale' ? (
            <AlertCircle className="h-3 w-3 text-amber-600" />
          ) : (
            <Wifi className="h-3 w-3 text-emerald-600" />
          )}
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
            {sensor.name}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Clock className="h-2.5 w-2.5" />
          <span>{sensor.lastUpdate}</span>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className={cn(
          'text-2xl font-bold tabular-nums leading-none',
          sensor.status === 'critical' && 'text-red-700',
          sensor.status === 'warning' && 'text-amber-700',
          sensor.status === 'normal' && 'text-slate-900'
        )}>
          {sensor.value}
        </span>
        <span className="text-xs text-slate-500 font-medium">{sensor.unit}</span>

        {/* Trend */}
        <div className={cn(
          'ml-auto flex items-center gap-0.5 text-xs font-semibold',
          sensor.trend === 'up' && 'text-emerald-700',
          sensor.trend === 'down' && 'text-blue-700',
          sensor.trend === 'stable' && 'text-slate-500'
        )}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="tabular-nums">{sensor.trendValue}</span>
        </div>
      </div>

      {/* Progress bar - industrial style: sharp edges, clearer colors */}
      <div className="relative h-2 bg-slate-200 overflow-hidden">
        {/* Safe zone indicator - subtle background band */}
        <div
          className="absolute h-full bg-emerald-100/50"
          style={{
            left: '20%',
            right: '20%'
          }}
        />

        {/* Current value bar - sharp edges, stronger colors */}
        <div
          className={cn(
            'absolute h-full transition-all',
            sensor.status === 'critical' && 'bg-red-600',
            sensor.status === 'warning' && 'bg-amber-500',
            sensor.status === 'normal' && 'bg-emerald-600'
          )}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />

        {/* Setpoint marker - more visible */}
        {setpointPercentage !== null && (
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-slate-900"
            style={{ left: `${setpointPercentage}%` }}
            title={`Setpoint: ${sensor.setpoint}`}
          />
        )}
      </div>

      {/* Range */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-slate-500 tabular-nums font-medium">{sensor.min}</span>
        {sensor.setpoint && (
          <span className="text-[10px] text-slate-700 font-semibold">SP: {sensor.setpoint}</span>
        )}
        <span className="text-[10px] text-slate-500 tabular-nums font-medium">{sensor.max}</span>
      </div>
    </div>
  );
}

function PlantSection({ plantData }: { plantData: PlantSensors }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const onlineCount = plantData.sensors.filter(s => s.commStatus === 'online').length;
  const warningCount = plantData.sensors.filter(s => s.status === 'warning' || s.status === 'critical').length;

  return (
    <div className={cn(
      // Industrial: sharp corners, clean borders
      'border overflow-hidden bg-white',
      plantData.status === 'online' && 'border-slate-300',
      plantData.status === 'warning' && 'border-slate-300 border-l-[3px] border-l-amber-500',
      plantData.status === 'offline' && 'border-slate-300 border-l-[3px] border-l-red-600'
    )}>
      {/* Plant Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-600" />
          )}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">{plantData.plant}</span>
              {/* Status badge - compact industrial style */}
              <span className={cn(
                'inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 border',
                plantData.status === 'online' && 'border-emerald-300 text-emerald-700 bg-emerald-50',
                plantData.status === 'warning' && 'border-amber-300 text-amber-700 bg-amber-50',
                plantData.status === 'offline' && 'border-red-300 text-red-700 bg-red-50'
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  plantData.status === 'online' && 'bg-emerald-600',
                  plantData.status === 'warning' && 'bg-amber-500',
                  plantData.status === 'offline' && 'bg-red-600'
                )} />
                {plantData.status.toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-slate-500">{plantData.location}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-slate-600 font-medium">{onlineCount}/{plantData.sensors.length}</span>
          </span>
          {warningCount > 0 && (
            <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
              <AlertCircle className="h-3.5 w-3.5" />
              {warningCount} alert{warningCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </button>

      {/* Sensors Grid */}
      {isExpanded && (
        <div className="p-3 bg-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2">
          {plantData.sensors.map((sensor) => (
            <SensorCard key={sensor.id} sensor={sensor} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DenseSensorGrid() {
  const totalSensors = plantSensorData.reduce((acc, p) => acc + p.sensors.length, 0);
  const onlineSensors = plantSensorData.reduce(
    (acc, p) => acc + p.sensors.filter(s => s.commStatus === 'online').length,
    0
  );
  const staleSensors = plantSensorData.reduce(
    (acc, p) => acc + p.sensors.filter(s => s.commStatus === 'stale').length,
    0
  );

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Live Sensor Readings
          </h2>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-semibold">{onlineSensors}/{totalSensors}</span>
            <span className="text-slate-400">online</span>
          </span>
          {staleSensors > 0 && (
            <span className="flex items-center gap-1.5 text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="font-semibold">{staleSensors}</span>
              <span>stale</span>
            </span>
          )}
          <span className="text-slate-400">
            Updated: <span className="font-mono">Just now</span>
          </span>
        </div>
      </div>

      {/* Plant Sections */}
      <div className="space-y-3">
        {plantSensorData.map((plantData) => (
          <PlantSection key={plantData.plant} plantData={plantData} />
        ))}
      </div>
    </div>
  );
}
