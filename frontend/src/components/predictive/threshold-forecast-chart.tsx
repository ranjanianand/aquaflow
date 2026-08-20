'use client';

import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface ForecastDataPoint {
  date: string;
  actual: number | null;
  forecast: number | null;
  threshold: number;
}

// Generate forecast data for equipment health
const generateForecastData = (): ForecastDataPoint[] => {
  const data: ForecastDataPoint[] = [];
  const now = new Date();
  const threshold = 150; // kPa for pressure drop example

  // Historical data (past 30 days)
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const baseValue = 90 + (30 - i) * 1.5 + Math.random() * 10;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: Math.min(baseValue, threshold + 20),
      forecast: null,
      threshold,
    });
  }

  // Forecast data (next 21 days)
  const lastActual = data[data.length - 1].actual || 120;
  for (let i = 1; i <= 21; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const forecastValue = lastActual + i * 2.5 + Math.random() * 5;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: null,
      forecast: Math.min(forecastValue, 200),
      threshold,
    });
  }

  return data;
};

const forecastData = generateForecastData();

// Equipment criteria with days remaining
const equipmentCriteria = [
  { name: 'Product TDS', daysRemaining: 21, status: 'healthy' },
  { name: 'High-Pressure Pump Speed', daysRemaining: 21, status: 'healthy' },
  { name: 'Total Pressure Drop', daysRemaining: 18, status: 'attention' },
  { name: 'Salt Passage Increase', daysRemaining: 21, status: 'healthy' },
  { name: 'Product Flow Decline', daysRemaining: 21, status: 'healthy' },
  { name: 'Specific Cost', daysRemaining: 14, status: 'warning' },
  { name: 'Specific Energy', daysRemaining: 21, status: 'healthy' },
];

export function ThresholdForecastChart() {
  const [selectedCriteria, setSelectedCriteria] = useState('Total Pressure Drop');

  const selectedItem = equipmentCriteria.find(c => c.name === selectedCriteria);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-600 dark:text-emerald-400';
      case 'attention': return 'text-blue-600 dark:text-blue-400';
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      case 'critical': return 'text-rose-600 dark:text-rose-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500';
      case 'attention': return 'bg-blue-500';
      case 'warning': return 'bg-amber-500';
      case 'critical': return 'bg-rose-500';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-5 py-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[14px] font-semibold">Equipment Life Forecast</h3>
          </div>
          <Select value={selectedCriteria} onValueChange={setSelectedCriteria}>
            <SelectTrigger className="w-[200px] h-8 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {equipmentCriteria.map((criteria) => (
                <SelectItem key={criteria.name} value={criteria.name}>
                  {criteria.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-5">
        {/* Criteria Summary */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-2">
            {equipmentCriteria.map((criteria) => (
              <div
                key={criteria.name}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors',
                  selectedCriteria === criteria.name
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted'
                )}
                onClick={() => setSelectedCriteria(criteria.name)}
              >
                <div className={cn('h-2 w-2 rounded-full', getStatusBg(criteria.status))} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground truncate">{criteria.name}</p>
                  <p className={cn('text-[11px] font-semibold tabular-nums', getStatusColor(criteria.status))}>
                    {criteria.daysRemaining} days
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

              {/* Safe zone (green) */}
              <ReferenceArea y1={0} y2={120} fill="#10b981" fillOpacity={0.05} />
              {/* Warning zone (yellow) */}
              <ReferenceArea y1={120} y2={150} fill="#f59e0b" fillOpacity={0.1} />
              {/* Critical zone (red) */}
              <ReferenceArea y1={150} y2={200} fill="#ef4444" fillOpacity={0.1} />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                domain={[0, 200]}
                label={{ value: 'kPa', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'var(--muted-foreground)' }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  `${value?.toFixed(1)} kPa`,
                  name === 'actual' ? 'Actual' : 'Forecast'
                ]}
              />

              {/* Threshold line */}
              <ReferenceLine
                y={150}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{
                  value: 'Threshold (150)',
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 10
                }}
              />

              {/* Cleaning event marker */}
              <ReferenceLine
                x="Dec 15"
                stroke="#0ea5e9"
                strokeDasharray="3 3"
                label={{
                  value: 'Cleaning',
                  position: 'top',
                  fill: '#0ea5e9',
                  fontSize: 9
                }}
              />

              {/* Actual data */}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#actualGradient)"
                connectNulls={false}
              />

              {/* Forecast data */}
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#0ea5e9"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#forecastGradient)"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-emerald-500 rounded" />
            <span className="text-[11px] text-muted-foreground">Actual Data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-blue-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #0ea5e9, #0ea5e9 4px, transparent 4px, transparent 8px)' }} />
            <span className="text-[11px] text-muted-foreground">Forecast</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-rose-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #ef4444, #ef4444 4px, transparent 4px, transparent 8px)' }} />
            <span className="text-[11px] text-muted-foreground">Threshold</span>
          </div>
        </div>

        {/* Zone Legend */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
            <span className="text-[10px] text-muted-foreground">Safe Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-amber-500/20 border border-amber-500/30" />
            <span className="text-[10px] text-muted-foreground">Warning Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-rose-500/20 border border-rose-500/30" />
            <span className="text-[10px] text-muted-foreground">Critical Zone</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
