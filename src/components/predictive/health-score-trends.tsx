'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Activity, ChevronDown } from 'lucide-react';
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

interface HealthScoreTrendsProps {
  className?: string;
}

// Generate historical health score data for equipment
const generateHealthData = (equipmentId: string, baseScore: number, trend: 'up' | 'down' | 'stable') => {
  const data = [];
  const now = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    let score = baseScore;

    // Add trend
    if (trend === 'down') {
      score = baseScore + (i * 0.5) + (Math.random() * 5 - 2.5);
    } else if (trend === 'up') {
      score = baseScore - (i * 0.3) + (Math.random() * 4 - 2);
    } else {
      score = baseScore + (Math.random() * 6 - 3);
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: Math.round(score),
      threshold: 70, // Warning threshold
      critical: 40, // Critical threshold
    });
  }

  return data;
};

const equipmentList = [
  { id: 'ro-membrane', name: 'RO Membrane Unit A', currentScore: 72, trend: 'down' as const, change: -8 },
  { id: 'feed-pump', name: 'Main Feed Pump P1', currentScore: 91, trend: 'stable' as const, change: 2 },
  { id: 'ph-sensors', name: 'pH Sensor Bank', currentScore: 45, trend: 'down' as const, change: -15 },
  { id: 'clarifier', name: 'Clarifier Drive Motor', currentScore: 28, trend: 'down' as const, change: -22 },
];

export function HealthScoreTrends({ className }: HealthScoreTrendsProps) {
  const [selectedEquipment, setSelectedEquipment] = useState(equipmentList[0].id);

  const currentEquipment = equipmentList.find(e => e.id === selectedEquipment)!;
  const healthData = generateHealthData(
    selectedEquipment,
    currentEquipment.currentScore,
    currentEquipment.trend
  );

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />;
      case 'down': return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
      default: return <Minus className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('border-2 border-slate-300 bg-white overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Health Score Trends
          </span>
        </div>

        {/* Equipment Selector */}
        <div className="relative">
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="h-7 px-2 pr-7 text-[10px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
          >
            {equipmentList.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Score Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[9px] text-slate-500 uppercase mb-0.5">Current Score</div>
              <div className={cn('text-3xl font-bold font-mono', getScoreColor(currentEquipment.currentScore))}>
                {currentEquipment.currentScore}%
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <div className="text-[9px] text-slate-500 uppercase mb-0.5">30-Day Change</div>
              <div className="flex items-center gap-1">
                {getTrendIcon(currentEquipment.trend)}
                <span className={cn(
                  'text-lg font-bold font-mono',
                  currentEquipment.change > 0 ? 'text-emerald-600' :
                  currentEquipment.change < 0 ? 'text-red-600' : 'text-slate-600'
                )}>
                  {currentEquipment.change > 0 ? '+' : ''}{currentEquipment.change}%
                </span>
              </div>
            </div>
          </div>

          {/* Health Bar */}
          <div className="w-32">
            <div className="h-2 bg-slate-200 overflow-hidden rounded-full">
              <div
                className={cn('h-full transition-all rounded-full', getScoreBgColor(currentEquipment.currentScore))}
                style={{ width: `${currentEquipment.currentScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
              <span>0</span>
              <span>40</span>
              <span>70</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={healthData}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0066ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 9 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 9 }}
                ticks={[0, 40, 70, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #cbd5e1',
                  borderRadius: '0',
                  fontSize: '11px',
                }}
                formatter={(value: number) => [`${value}%`, 'Health Score']}
              />

              {/* Threshold zones */}
              <ReferenceLine
                y={70}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{ value: 'Warning', position: 'right', fill: '#f59e0b', fontSize: 9 }}
              />
              <ReferenceLine
                y={40}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: 'Critical', position: 'right', fill: '#ef4444', fontSize: 9 }}
              />

              <Area
                type="monotone"
                dataKey="score"
                stroke="transparent"
                fill="url(#healthGradient)"
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0066ff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#0066ff' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Equipment Quick Compare */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-200">
          {equipmentList.map((eq) => (
            <button
              key={eq.id}
              onClick={() => setSelectedEquipment(eq.id)}
              className={cn(
                'p-2 text-left transition-colors rounded-sm',
                selectedEquipment === eq.id
                  ? 'bg-slate-100 ring-1 ring-slate-300'
                  : 'hover:bg-slate-50'
              )}
            >
              <div className="text-[9px] text-slate-500 truncate">{eq.name.split(' ').slice(0, 2).join(' ')}</div>
              <div className="flex items-center gap-1">
                <span className={cn('text-sm font-bold font-mono', getScoreColor(eq.currentScore))}>
                  {eq.currentScore}%
                </span>
                {getTrendIcon(eq.trend)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
