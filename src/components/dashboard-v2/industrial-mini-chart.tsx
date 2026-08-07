'use client';

import { useAllSensors, useCompliance, useLiveKpis } from '@/lib/api/hooks';
import { useTrend } from '@/lib/api/use-trends';
import type { LiveSensor } from '@/lib/api/client';

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
  /** No data source exists for this metric. Renders an explicit notice rather
   *  than a zero — and rather than removing the card, because the metric
   *  becomes valid the moment the tag exists. */
  unavailable?: string;
}

export function IndustrialMiniChart({
  title,
  value,
  unit,
  unavailable,
  change,
  changeLabel,
  data,
  status = 'normal',
  setpoint,
  minThreshold,
  maxThreshold
}: MiniChartProps) {
  if (unavailable) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</h3>
        </div>
        <p className="text-2xl font-bold font-mono text-slate-300">—</p>
        <p className="text-[11px] text-slate-500 mt-1">{unavailable}</p>
      </div>
    );
  }

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
  // Was seven fixed points around 2,847 m3/h with a "+3.2% vs yesterday" that
  // never moved. Now the outlet meter's own 24-hour series.
  const { data: live } = useLiveKpis();
  const { data: sensors } = useAllSensors();

  const flowSensors: LiveSensor[] = (sensors ?? []).filter((s) => s.type === 'flow');
  const outlet = flowSensors.find(
    (s) => /outlet|distribution|dispatch/i.test(s.location ?? '')) ?? flowSensors[0];

  const { rows } = useTrend(outlet?.id ?? null, 1);
  const series = rows.map((r) => ({ time: r.time, value: r.value }));
  const flow = live?.flow;

  if (!flow || series.length === 0) {
    return (
      <IndustrialMiniChart
        title="Total Flow Rate" value={0} unit="m³/h" change={0}
        changeLabel="" data={[]}
        unavailable="no flow meter reporting"
      />
    );
  }

  // First half against second half of the window — a real change, not a label.
  const half = Math.floor(series.length / 2);
  const mean = (xs: typeof series) => xs.reduce((a, d) => a + d.value, 0) / (xs.length || 1);
  const before = mean(series.slice(0, half));
  const change = before ? ((mean(series.slice(half)) - before) / before) * 100 : 0;

  return (
    <IndustrialMiniChart
      title="Total Flow Rate"
      value={Math.round(series[series.length - 1].value)}
      unit="m³/h"
      change={Number(change.toFixed(1))}
      changeLabel="vs earlier today"
      data={series}
      status={flow.status === 'warning' ? 'warning' : 'normal'}
    />
  );
}

export function EnergyConsumptionChart() {
  // No energy meters exist. There is no kWh tag in the register map and no
  // table to hold one, so 485 kWh was invented outright.
  //
  // The card stays: if MWTS's feed carries energy meters, this becomes a real
  // metric and only the query changes.
  return (
    <IndustrialMiniChart
      title="Energy Consumption" value={0} unit="kWh" change={0}
      changeLabel="" data={[]}
      unavailable="no energy meter in the register map"
    />
  );
}

export function WaterQualityChart() {
  // Was a fixed 96.8%. A Water Quality Index needs a definition nobody has
  // agreed — which parameters, what weighting, whose standard — so this
  // reports the plainer, computable thing: the share of readings inside their
  // alarm band, over turbidity, pH, chlorine and conductivity.
  const { data } = useCompliance(24);
  if (!data || data.compliancePct === null) {
    return (
      <IndustrialMiniChart
        title="Readings In Range" value={0} unit="%" change={0}
        changeLabel="" data={[]}
        unavailable="no readings in the last 24 hours"
      />
    );
  }
  return (
    <IndustrialMiniChart
      title="Readings In Range"
      value={data.compliancePct}
      unit="%"
      change={0}
      changeLabel={`${data.inRange} of ${data.readings} readings, 24h`}
      data={[]}
      status={data.compliancePct >= 95 ? 'normal'
            : data.compliancePct >= 90 ? 'warning' : 'critical'}
    />
  );
}

export function ProcessEfficiencyChart() {
  // "Process efficiency" has no agreed definition here and no inputs to
  // compute one — it would need energy per m3, or recovery ratio, or chemical
  // dose per unit treated. None of those tags exist. The 96.8% shown before
  // was a number with nothing behind it.
  return (
    <IndustrialMiniChart
      title="Process Efficiency" value={0} unit="%" change={0}
      changeLabel="" data={[]}
      unavailable="needs energy or dosing tags to compute"
    />
  );
}

// Renamed export for backwards compatibility
export const SystemEfficiencyChart = ProcessEfficiencyChart;
