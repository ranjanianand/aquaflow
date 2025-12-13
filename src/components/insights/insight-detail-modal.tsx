'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Activity,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Gauge,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { OperationalInsight } from '@/data/mock-operations';

type ModalView = 'monitoring' | 'trends';

interface InsightDetailModalProps {
  insight: OperationalInsight;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: ModalView;
}

// Generate mock trend data showing before/after the insight was applied
const generateTrendData = (insight: OperationalInsight) => {
  const data = [];
  const now = new Date();
  const currentVal = parseFloat(String(insight.currentValue)) || 14;
  const recommendedVal = parseFloat(String(insight.recommendedValue)) || 12.5;

  // Generate 14 days of data
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    let value: number;

    // Simulate: first 7 days at current value, then transition to recommended
    if (i > 7) {
      value = currentVal + (Math.random() * 1 - 0.5);
    } else if (i > 5) {
      // Transition period
      const progress = (7 - i) / 2;
      value = currentVal - (currentVal - recommendedVal) * progress + (Math.random() * 0.5 - 0.25);
    } else {
      // After optimization
      value = recommendedVal + (Math.random() * 0.5 - 0.25);
    }

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(value * 10) / 10,
      target: recommendedVal,
      previous: currentVal,
    });
  }

  return data;
};

// Mock live sensor readings
const generateLiveReadings = (insight: OperationalInsight) => {
  const currentVal = parseFloat(String(insight.currentValue)) || 14;
  const recommendedVal = parseFloat(String(insight.recommendedValue)) || 12.5;

  return [
    {
      label: 'Current Reading',
      value: (recommendedVal + (Math.random() * 0.3 - 0.15)).toFixed(2),
      unit: insight.unit,
      status: 'normal' as const,
      trend: 'stable' as const,
    },
    {
      label: 'Target Value',
      value: recommendedVal.toFixed(2),
      unit: insight.unit,
      status: 'target' as const,
      trend: 'stable' as const,
    },
    {
      label: 'Previous Avg',
      value: currentVal.toFixed(2),
      unit: insight.unit,
      status: 'warning' as const,
      trend: 'down' as const,
    },
  ];
};

export function InsightDetailModal({
  insight,
  open,
  onOpenChange,
  defaultView = 'monitoring'
}: InsightDetailModalProps) {
  const [activeView, setActiveView] = useState<ModalView>(defaultView);

  // Sync activeView with defaultView when modal opens
  useEffect(() => {
    if (open) {
      setActiveView(defaultView);
    }
  }, [open, defaultView]);

  const trendData = generateTrendData(insight);
  const liveReadings = generateLiveReadings(insight);
  const recommendedVal = parseFloat(String(insight.recommendedValue)) || 12.5;
  const currentVal = parseFloat(String(insight.currentValue)) || 14;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Header */}
        <div className="bg-slate-100 px-5 py-3 border-b-2 border-slate-300">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-700">
                Applied
              </span>
              <span className="text-[9px] text-slate-500">{insight.equipment}</span>
            </div>
            <DialogTitle className="text-[14px] font-semibold text-slate-800">
              {insight.title}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveView('monitoring')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase transition-colors',
              activeView === 'monitoring'
                ? 'bg-white text-slate-800 border-b-2 border-slate-700'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            )}
          >
            <Activity className="h-3.5 w-3.5" />
            Live Monitoring
          </button>
          <button
            onClick={() => setActiveView('trends')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase transition-colors',
              activeView === 'trends'
                ? 'bg-white text-slate-800 border-b-2 border-slate-700'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Trend Analysis
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeView === 'monitoring' ? (
            <div className="space-y-4">
              {/* Live Status Indicator */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-600 font-medium">Live Data</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">Updated 2s ago</span>
              </div>

              {/* Live Readings Grid */}
              <div className="grid grid-cols-3 gap-3">
                {liveReadings.map((reading, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 border-2',
                      reading.status === 'normal' && 'border-emerald-200 bg-emerald-50/50',
                      reading.status === 'target' && 'border-blue-200 bg-blue-50/50',
                      reading.status === 'warning' && 'border-slate-200 bg-slate-50'
                    )}
                  >
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {reading.label}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={cn(
                        'text-2xl font-bold font-mono',
                        reading.status === 'normal' && 'text-emerald-600',
                        reading.status === 'target' && 'text-blue-600',
                        reading.status === 'warning' && 'text-slate-600'
                      )}>
                        {reading.value}
                      </span>
                      <span className="text-[11px] text-slate-500">{reading.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini Sparkline - Last 1 hour */}
              <div className="border-2 border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Last 1 Hour
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Within Target
                  </span>
                </div>
                <div className="h-[80px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData.slice(-6)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                      <ReferenceLine y={recommendedVal} stroke="#3b82f6" strokeDasharray="5 5" />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Equipment Info */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                    Equipment
                  </div>
                  <div className="text-[12px] font-medium text-slate-700">
                    {insight.equipment || 'Primary Equipment'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                    Location
                  </div>
                  <div className="text-[12px] font-medium text-slate-700">
                    {insight.plantName}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                    Status
                  </div>
                  <div className="flex items-center gap-1 text-[12px] font-medium text-emerald-600">
                    <Gauge className="h-3 w-3" />
                    Optimized
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Trend Chart */}
              <div className="border-2 border-slate-200 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    14-Day Trend
                  </span>
                  <div className="flex items-center gap-4 text-[10px]">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 bg-blue-500"></div>
                      <span className="text-slate-500">Target ({recommendedVal} {insight.unit})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 bg-slate-400"></div>
                      <span className="text-slate-500">Previous ({currentVal} {insight.unit})</span>
                    </div>
                  </div>
                </div>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        domain={['dataMin - 1', 'dataMax + 1']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '2px solid #cbd5e1',
                          borderRadius: '0',
                          fontSize: '11px',
                        }}
                        formatter={(value: number) => [`${value} ${insight.unit}`, 'Value']}
                      />
                      <ReferenceLine
                        y={recommendedVal}
                        stroke="#3b82f6"
                        strokeDasharray="5 5"
                        label={{ value: 'Target', position: 'right', fill: '#3b82f6', fontSize: 9 }}
                      />
                      <ReferenceLine
                        y={currentVal}
                        stroke="#94a3b8"
                        strokeDasharray="5 5"
                        label={{ value: 'Previous', position: 'right', fill: '#94a3b8', fontSize: 9 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="transparent"
                        fill="url(#trendGradient)"
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#10b981' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Before/After Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border-2 border-slate-300 bg-slate-50">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Before Optimization
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-xl font-bold font-mono text-slate-600">
                      {currentVal} <span className="text-[11px] font-normal">{insight.unit}</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">7-day average</div>
                </div>
                <div className="p-3 border-2 border-emerald-300 bg-emerald-50">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                    After Optimization
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-xl font-bold font-mono text-emerald-600">
                      {recommendedVal} <span className="text-[11px] font-normal">{insight.unit}</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-1">Current average</div>
                </div>
              </div>

              {/* Improvement Stats */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 border-2 border-emerald-200">
                <div className="text-[11px]">
                  <span className="text-slate-600">Parameter improved by </span>
                  <span className="font-bold text-emerald-700">
                    {((currentVal - recommendedVal) / currentVal * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <Clock className="h-3 w-3" />
                  Applied 7 days ago
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Links */}
        <div className="flex items-center gap-2 px-5 py-3 border-t-2 border-slate-200 bg-slate-50">
          <Link
            href={`/monitoring?plant=${insight.plantId}&sensor=${insight.sensorId || 'all'}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Monitoring
          </Link>
          <Link
            href={`/trends?plant=${insight.plantId}&parameter=${encodeURIComponent(insight.title)}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Trends
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
