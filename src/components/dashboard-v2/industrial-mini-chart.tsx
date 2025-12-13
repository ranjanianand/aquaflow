'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Maximize2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  Area,
  AreaChart
} from 'recharts';

interface ChartData {
  time: string;
  value: number;
}

interface MiniChartProps {
  title: string;
  value: number;
  unit: string;
  change: number;
  changeLabel: string;
  data: ChartData[];
  status?: 'normal' | 'warning' | 'critical';
  setpoint?: number;
  minThreshold?: number;
  maxThreshold?: number;
}

export function IndustrialMiniChart({
  title,
  value,
  unit,
  change,
  changeLabel,
  data,
  status = 'normal',
  setpoint,
  minThreshold,
  maxThreshold
}: MiniChartProps) {
  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const isPositive = change > 0;

  // Determine chart color based on status
  const chartColor = status === 'critical' ? '#ef4444' :
                     status === 'warning' ? '#f59e0b' : '#10b981';

  const chartFillColor = status === 'critical' ? '#fecaca' :
                         status === 'warning' ? '#fef3c7' : '#d1fae5';

  return (
    <div className="border-2 border-slate-300 bg-white overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b-2 border-slate-300 bg-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
          {title}
        </span>
        <button className="p-1 hover:bg-slate-200 transition-colors" title="Expand chart">
          <Maximize2 className="h-3 w-3 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Value Row */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className={cn(
              'text-2xl font-bold tabular-nums',
              status === 'critical' && 'text-red-600',
              status === 'warning' && 'text-amber-600',
              status === 'normal' && 'text-slate-900'
            )}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            <span className="text-sm text-slate-400 ml-1.5">{unit}</span>
          </div>
          <div className={cn(
            'flex items-center gap-1 text-sm font-semibold',
            isPositive ? 'text-emerald-600' : 'text-red-600'
          )}>
            <TrendIcon className="h-4 w-4" />
            <span className="tabular-nums">
              {isPositive ? '+' : ''}{change}%
            </span>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="flex-1 min-h-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.05}/>
                </linearGradient>
              </defs>

              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                interval="preserveStartEnd"
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                domain={['dataMin - 5%', 'dataMax + 5%']}
                width={35}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '11px',
                  padding: '6px 10px'
                }}
                labelStyle={{ color: '#94a3b8', marginBottom: '2px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(val: number) => [`${val} ${unit}`, '']}
              />

              {/* Setpoint reference line */}
              {setpoint && (
                <ReferenceLine
                  y={setpoint}
                  stroke="#475569"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}

              {/* Max threshold line */}
              {maxThreshold && (
                <ReferenceLine
                  y={maxThreshold}
                  stroke="#ef4444"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                />
              )}

              {/* Min threshold line */}
              {minThreshold && (
                <ReferenceLine
                  y={minThreshold}
                  stroke="#ef4444"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                />
              )}

              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#gradient-${title.replace(/\s/g, '')})`}
                dot={false}
                activeDot={{ r: 4, fill: chartColor, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>{changeLabel}</span>
          <span className="font-mono">Last 24h</span>
        </div>
      </div>
    </div>
  );
}

// Pre-configured chart cards for the dashboard
export function FlowRateChart() {
  const data = [
    { time: '00:00', value: 2650 },
    { time: '04:00', value: 2480 },
    { time: '08:00', value: 2720 },
    { time: '12:00', value: 2890 },
    { time: '16:00', value: 2950 },
    { time: '20:00', value: 2847 },
    { time: 'Now', value: 2847 },
  ];

  return (
    <IndustrialMiniChart
      title="Total Flow Rate"
      value={2847}
      unit="m³/h"
      change={3.2}
      changeLabel="vs yesterday"
      data={data}
      status="normal"
      setpoint={2800}
    />
  );
}

export function EnergyConsumptionChart() {
  const data = [
    { time: '00:00', value: 420 },
    { time: '04:00', value: 380 },
    { time: '08:00', value: 510 },
    { time: '12:00', value: 580 },
    { time: '16:00', value: 545 },
    { time: '20:00', value: 485 },
    { time: 'Now', value: 485 },
  ];

  return (
    <IndustrialMiniChart
      title="Energy Consumption"
      value={485}
      unit="kWh"
      change={-5.1}
      changeLabel="vs yesterday"
      data={data}
      status="normal"
      maxThreshold={600}
    />
  );
}

export function WaterQualityChart() {
  const data = [
    { time: '00:00', value: 97.2 },
    { time: '04:00', value: 97.5 },
    { time: '08:00', value: 96.8 },
    { time: '12:00', value: 97.1 },
    { time: '16:00', value: 96.5 },
    { time: '20:00', value: 96.8 },
    { time: 'Now', value: 96.8 },
  ];

  return (
    <IndustrialMiniChart
      title="Water Quality Index"
      value={96.8}
      unit="%"
      change={-0.4}
      changeLabel="vs yesterday"
      data={data}
      status="warning"
      setpoint={97}
      minThreshold={95}
    />
  );
}

export function ProcessEfficiencyChart() {
  const data = [
    { time: '00:00', value: 94.5 },
    { time: '04:00', value: 95.2 },
    { time: '08:00', value: 95.8 },
    { time: '12:00', value: 96.2 },
    { time: '16:00', value: 96.5 },
    { time: '20:00', value: 96.8 },
    { time: 'Now', value: 96.8 },
  ];

  return (
    <IndustrialMiniChart
      title="Process Efficiency"
      value={96.8}
      unit="%"
      change={2.4}
      changeLabel="vs last week"
      data={data}
      status="normal"
      setpoint={95}
    />
  );
}

// Renamed export for backwards compatibility
export const SystemEfficiencyChart = ProcessEfficiencyChart;
