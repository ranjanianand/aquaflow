'use client';

import { DataFreshness } from '@/components/shared/data-freshness';
import { usePlants, useSensors } from '@/lib/api/hooks';
import type { LiveSensor } from '@/lib/api/client';

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

// One representative sensor per parameter, taken from the database. A fixed
// array stood here and a timer nudged each value every three seconds with
// seeded noise — a "Real-Time Sensors" panel whose numbers came from
// Math.sin, on the same screen as the true reading count.
//
// Where several sensors share a parameter, the worst status wins: an overview
// tile that averages a critical filter reading with four normal ones hides
// exactly the thing it exists to surface.
const RANK = { critical: 2, warning: 1, normal: 0 } as const;

function pickRepresentative(sensors: LiveSensor[]): SensorData[] {
  const byParam = new Map<string, LiveSensor>();
  for (const s of sensors) {
    const held = byParam.get(s.type);
    if (!held || RANK[s.status] > RANK[held.status]) byParam.set(s.type, s);
  }
  return [...byParam.values()]
    .sort((a, b) => RANK[b.status] - RANK[a.status] || a.type.localeCompare(b.type))
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      name: s.name.split(' - ')[0],
      value: s.currentValue,
      unit: s.unit,
      // Axis from the alarm band, widened so a breach is visible rather than
      // pinned to the end of the bar.
      min: Math.min(s.critMin ?? s.minThreshold, s.currentValue),
      max: Math.max(s.critMax ?? s.maxThreshold, s.currentValue),
      trend: 'stable' as const,
      status: s.status,
    }));
}

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
  const { data: plants } = usePlants();
  // The first plant that is actually reporting; falls back to the first.
  const plant = plants?.find((p) => p.status !== 'offline') ?? plants?.[0] ?? null;
  const { data: liveSensors, loading } = useSensors(plant?.id ?? null, 0);
  const sensors = pickRepresentative(liveSensors ?? []);
  const newest = liveSensors?.reduce<Date | null>(
    (m, s) => (!m || s.lastUpdated > m ? s.lastUpdated : m), null) ?? null;

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold">Real-Time Sensors</h3>
        <div className="flex items-center gap-2">
          <DataFreshness newest={newest} loading={loading} />
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
