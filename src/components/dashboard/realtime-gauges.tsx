'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

// Seeded random for deterministic values
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Optimal ranges for water treatment (for status calculation)
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

function SensorCard({ sensor }: { sensor: SensorData }) {
  const percentage = ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100;

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-2xl font-semibold tabular-nums">{sensor.value.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">{sensor.unit}</span>
        <div className="ml-auto flex items-center gap-1">
          {sensor.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />}
          {sensor.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />}
          {sensor.trend === 'stable' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500/50 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>

      {/* Range */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">{sensor.min}</span>
        <span className="text-[10px] text-muted-foreground">{sensor.max}</span>
      </div>
    </div>
  );
}

export function RealtimeGauges() {
  const [sensors, setSensors] = useState<SensorData[]>(initialSensors);
  const [tick, setTick] = useState(0);

  // Simulate real-time updates
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

        // Keep within bounds
        newValue = Math.max(sensor.min + range * 0.05, Math.min(sensor.max - range * 0.05, newValue));

        // Determine trend
        const diff = newValue - sensor.value;
        const trend: 'up' | 'down' | 'stable' = Math.abs(diff) < 0.01 ? 'stable' : diff > 0 ? 'up' : 'down';

        // Determine status based on realistic thresholds
        const thresholds = sensorThresholds[sensor.id];
        let status: 'normal' | 'warning' | 'critical' = 'normal';

        if (thresholds) {
          // Critical if outside critical thresholds
          if (newValue <= thresholds.criticalLow || newValue >= thresholds.criticalHigh) {
            status = 'critical';
          }
          // Warning if outside warning thresholds
          else if (newValue <= thresholds.warningLow || newValue >= thresholds.warningHigh) {
            status = 'warning';
          }
        }

        return { ...sensor, value: Math.round(newValue * 100) / 100, trend, status };
      })
    );
  }, [tick]);

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold">Real-Time Sensors</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/50 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Sensor Cards Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {sensors.map((sensor) => (
            <SensorCard key={sensor.id} sensor={sensor} />
          ))}
        </div>
      </div>
    </div>
  );
}
