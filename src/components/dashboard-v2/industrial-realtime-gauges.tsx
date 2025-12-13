'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface SensorData {
  id: string;
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
}

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const sensorThresholds: Record<string, { warningLow: number; warningHigh: number; criticalLow: number; criticalHigh: number }> = {
  ph: { warningLow: 6.5, warningHigh: 8.0, criticalLow: 6.0, criticalHigh: 8.5 },
  temp: { warningLow: 15, warningHigh: 35, criticalLow: 10, criticalHigh: 40 },
  pressure: { warningLow: 1.5, warningHigh: 3.5, criticalLow: 1.0, criticalHigh: 4.0 },
  turbidity: { warningLow: 0, warningHigh: 4, criticalLow: 0, criticalHigh: 5 },
  chlorine: { warningLow: 0.5, warningHigh: 2.0, criticalLow: 0.2, criticalHigh: 3.0 },
  do: { warningLow: 6, warningHigh: 12, criticalLow: 4, criticalHigh: 14 },
};

const initialSensors: SensorData[] = [
  { id: 'ph', name: 'pH Level', value: 8.3, unit: '', min: 0, max: 14, trend: 'up', status: 'warning' },
  { id: 'temp', name: 'Temperature', value: 38, unit: '°C', min: 0, max: 50, trend: 'up', status: 'warning' },
  { id: 'pressure', name: 'Pressure', value: 4.2, unit: 'bar', min: 0, max: 5, trend: 'stable', status: 'critical' },
  { id: 'turbidity', name: 'Turbidity', value: 0.8, unit: 'NTU', min: 0, max: 10, trend: 'down', status: 'normal' },
  { id: 'chlorine', name: 'Chlorine', value: 1.2, unit: 'mg/L', min: 0, max: 5, trend: 'stable', status: 'normal' },
  { id: 'do', name: 'Dissolved O₂', value: 3.5, unit: 'mg/L', min: 0, max: 15, trend: 'down', status: 'critical' },
];

function GaugeCard({ sensor }: { sensor: SensorData }) {
  const percentage = ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100;
  const TrendIcon = sensor.trend === 'up' ? TrendingUp : sensor.trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={cn(
      'bg-white border border-slate-300 p-3',
      sensor.status === 'critical' && 'border-l-[3px] border-l-red-500',
      sensor.status === 'warning' && 'border-l-[3px] border-l-amber-500',
      sensor.status === 'normal' && 'border-l-[3px] border-l-emerald-500'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
          {sensor.name}
        </span>
        {sensor.status !== 'normal' && (
          <span className={cn(
            'h-2 w-2 rounded-full animate-pulse',
            sensor.status === 'warning' && 'bg-amber-500',
            sensor.status === 'critical' && 'bg-red-500'
          )} />
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className={cn(
          'text-2xl font-bold tabular-nums leading-none',
          sensor.status === 'critical' && 'text-red-700',
          sensor.status === 'warning' && 'text-amber-700',
          sensor.status === 'normal' && 'text-slate-900'
        )}>
          {sensor.value.toFixed(1)}
        </span>
        <span className="text-xs text-slate-500">{sensor.unit}</span>
        <TrendIcon className={cn(
          'ml-auto h-3.5 w-3.5',
          sensor.trend === 'up' && 'text-emerald-600',
          sensor.trend === 'down' && 'text-blue-600',
          sensor.trend === 'stable' && 'text-slate-400'
        )} />
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-200 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            sensor.status === 'critical' && 'bg-red-500',
            sensor.status === 'warning' && 'bg-amber-500',
            sensor.status === 'normal' && 'bg-emerald-500'
          )}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>

      {/* Range */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-slate-500 tabular-nums">{sensor.min}</span>
        <span className="text-[10px] text-slate-500 tabular-nums">{sensor.max}</span>
      </div>
    </div>
  );
}

export function IndustrialRealtimeGauges() {
  const [sensors, setSensors] = useState<SensorData[]>(initialSensors);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tick === 0) return;

    setSensors((prev) =>
      prev.map((sensor, idx) => {
        const seed = tick * 100 + idx;
        const variation = (seededRandom(seed) - 0.5) * 0.2;
        const range = sensor.max - sensor.min;
        let newValue = sensor.value + variation * range * 0.1;
        newValue = Math.max(sensor.min + range * 0.05, Math.min(sensor.max - range * 0.05, newValue));

        const diff = newValue - sensor.value;
        const trend: 'up' | 'down' | 'stable' = Math.abs(diff) < 0.01 ? 'stable' : diff > 0 ? 'up' : 'down';

        const thresholds = sensorThresholds[sensor.id];
        let status: 'normal' | 'warning' | 'critical' = 'normal';

        if (thresholds) {
          if (newValue <= thresholds.criticalLow || newValue >= thresholds.criticalHigh) {
            status = 'critical';
          } else if (newValue <= thresholds.warningLow || newValue >= thresholds.warningHigh) {
            status = 'warning';
          }
        }

        return { ...sensor, value: Math.round(newValue * 100) / 100, trend, status };
      })
    );
  }, [tick]);

  const criticalCount = sensors.filter(s => s.status === 'critical').length;
  const warningCount = sensors.filter(s => s.status === 'warning').length;

  return (
    <div className="border-2 border-slate-300 overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Realtime Sensors
          </span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {criticalCount > 0 && (
            <span className="text-red-600 font-bold">{criticalCount} CRIT</span>
          )}
          {warningCount > 0 && (
            <span className="text-amber-600 font-bold">{warningCount} WARN</span>
          )}
        </div>
      </div>

      {/* Sensor Cards Grid */}
      <div className="p-3 bg-slate-100">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {sensors.map((sensor) => (
            <GaugeCard key={sensor.id} sensor={sensor} />
          ))}
        </div>
      </div>
    </div>
  );
}
