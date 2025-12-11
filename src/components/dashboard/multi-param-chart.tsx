'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface MultiParamDataPoint {
  time: string;
  pH: number;
  temperature: number;
  pressure: number;
  flowRate: number;
}

// Seeded random for deterministic data
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate deterministic multi-parameter data
const generateMultiParamData = (hours: number): MultiParamDataPoint[] => {
  const data: MultiParamDataPoint[] = [];

  for (let i = hours; i >= 0; i--) {
    const hour = (24 - (i % 24)) % 24;
    const seed = i * 137;

    data.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      pH: Math.round((7.0 + (seededRandom(seed) - 0.5) * 1.2) * 100) / 100,
      temperature: Math.round((25 + (seededRandom(seed + 1) - 0.5) * 8) * 10) / 10,
      pressure: Math.round((2.5 + (seededRandom(seed + 2) - 0.5) * 0.8) * 100) / 100,
      flowRate: Math.round((350 + (seededRandom(seed + 3) - 0.5) * 100) * 10) / 10,
    });
  }

  return data;
};

// Soft muted color palette - cohesive enterprise look
const parameters = [
  { key: 'pH', name: 'pH Level', color: '#3b82f6', unit: '' },           // Soft blue
  { key: 'temperature', name: 'Temperature', color: '#10b981', unit: '°C' }, // Soft green
  { key: 'pressure', name: 'Pressure', color: '#8b5cf6', unit: 'bar' },      // Soft purple
  { key: 'flowRate', name: 'Flow Rate', color: '#f59e0b', unit: 'm³/h' },    // Soft amber
];

export function MultiParamChart() {
  const [data, setData] = useState<MultiParamDataPoint[]>([]);
  const [activeParams, setActiveParams] = useState<string[]>(['pH', 'temperature']);

  useEffect(() => {
    setData(generateMultiParamData(24));
  }, []);

  const toggleParam = (key: string) => {
    setActiveParams((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-[13px] font-semibold">Multi-Parameter Trends</h3>
        <div className="flex items-center gap-2">
          {parameters.map((param) => (
            <button
              key={param.key}
              onClick={() => toggleParam(param.key)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all',
                activeParams.includes(param.key)
                  ? 'border-foreground/20 bg-foreground text-background'
                  : 'border-border bg-transparent text-muted-foreground hover:bg-muted'
              )}
            >
              {param.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickMargin={8}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 12 }}
                itemStyle={{ fontSize: 11 }}
              />
              {parameters.map(
                (param) =>
                  activeParams.includes(param.key) && (
                    <Line
                      key={param.key}
                      type="monotone"
                      dataKey={param.key}
                      stroke={param.color}
                      strokeWidth={2}
                      dot={false}
                      name={`${param.name} ${param.unit}`}
                    />
                  )
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Stats */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {parameters.map((param) => {
            const values = data.map((d) => d[param.key as keyof MultiParamDataPoint] as number);
            const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '0';
            return (
              <div
                key={param.key}
                className={cn(
                  'rounded-md border p-2.5 transition-opacity',
                  activeParams.includes(param.key) ? 'border-border' : 'border-border/50 opacity-50'
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: param.color }}
                  />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {param.name}
                  </p>
                </div>
                <p className="text-base font-semibold tabular-nums">
                  {avg}
                  <span className="text-[10px] text-muted-foreground ml-0.5">{param.unit}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
