'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  time: string;
  value: number;
}

// Seeded random for deterministic chart data
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate deterministic chart data
const generateChartData = (hours: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const baseValue = 350;

  for (let i = hours; i >= 0; i--) {
    const hour = (24 - (i % 24)) % 24;
    const dayFactor = hour >= 6 && hour <= 22 ? 1 : 0.7;
    const randomVariation = (seededRandom(i * 137) - 0.5) * 50;

    data.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      value: Math.round((baseValue * dayFactor + randomVariation) * 100) / 100,
    });
  }

  return data;
};

const timeRanges = {
  'Today': 24,
  '7 Days': 168,
  '14 Days': 336,
  '30 Days': 720,
};

type TimeRangeKey = keyof typeof timeRanges;

export function FlowChart() {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('Today');
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    setData(generateChartData(timeRanges[timeRange]));
  }, [timeRange]);

  // Calculate stats
  const values = data.map((d) => d.value);
  const avgValue = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const maxValue = values.length > 0 ? Math.round(Math.max(...values)) : 0;
  const minValue = values.length > 0 ? Math.round(Math.min(...values)) : 0;

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-[13px] font-semibold">Flow Rate Overview</h3>
        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
          {(Object.keys(timeRanges) as TimeRangeKey[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'px-3 py-1.5 text-[12px] font-medium rounded transition-colors',
                timeRange === range
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                domain={['dataMin - 20', 'dataMax + 20']}
                width={40}
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
                itemStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                formatter={(value: number) => [`${value} m³/h`, 'Flow Rate']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#flowGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Summary - styled like Pattern Health from s1.pdf */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-md border border-border p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Average</p>
            <p className="text-lg font-semibold tabular-nums">{avgValue}</p>
            <p className="text-[10px] text-muted-foreground">m³/h</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Peak</p>
            <p className="text-lg font-semibold tabular-nums">{maxValue}</p>
            <p className="text-[10px] text-muted-foreground">m³/h</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Minimum</p>
            <p className="text-lg font-semibold tabular-nums">{minValue}</p>
            <p className="text-[10px] text-muted-foreground">m³/h</p>
          </div>
        </div>
      </div>
    </div>
  );
}
