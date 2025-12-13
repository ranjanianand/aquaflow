'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { mockPlants } from '@/data/mock-plants';
import { getSensorsByPlant } from '@/data/mock-sensors';
import { Sensor, SensorType } from '@/types';
import { Download, TrendingUp, TrendingDown, Minus, Target, Clock, CheckCircle, BarChart3, ChevronDown } from 'lucide-react';
import { TrendsSkeleton } from '@/components/shared/loading-skeleton';
import { cn } from '@/lib/utils';

type TimeRange = '24H' | '7D' | '30D' | 'custom';

// Generate trend data
const generateTrendData = (sensor: Sensor, hours: number) => {
  const data = [];
  const now = Date.now();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600000);
    const baseValue = sensor.currentValue;
    const variation = (Math.random() - 0.5) * (sensor.maxThreshold - sensor.minThreshold) * 0.3;

    data.push({
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: parseFloat((baseValue + variation).toFixed(2)),
      timestamp: timestamp.getTime(),
    });
  }

  return data;
};

export default function TrendsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState(mockPlants[0]?.id || '');
  const [selectedSensor, setSelectedSensor] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('24H');
  const [sensors, setSensors] = useState<Sensor[]>([]);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Load sensors when plant changes
  useEffect(() => {
    if (selectedPlant) {
      const plantSensors = getSensorsByPlant(selectedPlant);
      setSensors(plantSensors);
      if (plantSensors.length > 0) {
        setSelectedSensor(plantSensors[0].id);
      }
    }
  }, [selectedPlant]);

  const currentSensor = sensors.find((s) => s.id === selectedSensor);

  const timeRangeHours: Record<TimeRange, number> = {
    '24H': 24,
    '7D': 168,
    '30D': 720,
    custom: 24,
  };

  const chartData = useMemo(() => {
    if (!currentSensor) return [];
    return generateTrendData(currentSensor, timeRangeHours[timeRange]);
  }, [currentSensor, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const values = chartData.map((d) => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // In-range calculation
    const inRange = currentSensor
      ? values.filter((v) => v >= currentSensor.minThreshold && v <= currentSensor.maxThreshold).length
      : values.length;
    const inRangePercent = (inRange / values.length) * 100;

    // Compare to previous period
    const halfIndex = Math.floor(chartData.length / 2);
    const currentAvg = values.slice(halfIndex).reduce((a, b) => a + b, 0) / (values.length - halfIndex);
    const previousAvg = values.slice(0, halfIndex).reduce((a, b) => a + b, 0) / halfIndex;
    const percentChange = ((currentAvg - previousAvg) / previousAvg) * 100;

    return {
      avg: avg.toFixed(2),
      max: max.toFixed(2),
      min: min.toFixed(2),
      inRangePercent: inRangePercent.toFixed(1),
      percentChange: percentChange.toFixed(1),
      trend: percentChange > 1 ? 'up' : percentChange < -1 ? 'down' : 'neutral',
    };
  }, [chartData, currentSensor]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BarChart3 className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Trends & Analysis</span>
            <span className="text-[10px] text-slate-400">Historical data analysis and trending</span>
          </div>
        </header>
        <TrendsSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header Bar */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BarChart3 className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Trends & Analysis</span>
          <span className="text-[10px] text-slate-400">Historical data analysis and trending</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">RANGE:</span>
          <span className="text-[10px] font-mono text-emerald-400">{timeRange}</span>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Plant Selector */}
          <div className="relative">
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
            >
              {mockPlants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sensor Selector */}
          <div className="relative">
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
              className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
            >
              {sensors.map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.name} ({sensor.type})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Time Range Buttons */}
          <div className="flex gap-1">
            {(['24H', '7D', '30D', 'custom'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                  timeRange === range
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-slate-300'
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        {/* Main Chart Panel */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {currentSensor?.name || 'Select a sensor'} Trend
              </span>
            </div>
            {currentSensor && (
              <span className="text-[10px] font-mono text-slate-500">
                THRESHOLD: {currentSensor.minThreshold} - {currentSensor.maxThreshold} {currentSensor.unit}
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="h-[400px]">
              {currentSensor ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066ff" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickMargin={8}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickMargin={8}
                      domain={[
                        currentSensor.minThreshold - (currentSensor.maxThreshold - currentSensor.minThreshold) * 0.1,
                        currentSensor.maxThreshold + (currentSensor.maxThreshold - currentSensor.minThreshold) * 0.1,
                      ]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '2px solid #cbd5e1',
                        borderRadius: '0',
                        fontSize: '11px',
                      }}
                      formatter={(value: number) => [
                        `${value.toFixed(2)} ${currentSensor.unit}`,
                        currentSensor.type,
                      ]}
                    />
                    <ReferenceLine
                      y={currentSensor.maxThreshold}
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      label={{
                        value: `Max: ${currentSensor.maxThreshold}`,
                        position: 'right',
                        fill: '#ef4444',
                        fontSize: 10,
                      }}
                    />
                    <ReferenceLine
                      y={currentSensor.minThreshold}
                      stroke="#f59e0b"
                      strokeDasharray="5 5"
                      label={{
                        value: `Min: ${currentSensor.minThreshold}`,
                        position: 'right',
                        fill: '#f59e0b',
                        fontSize: 10,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      fill="url(#colorValue)"
                      stroke="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0066ff"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: '#0066ff' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                  Select a sensor to view trend data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && currentSensor && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Average */}
            <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Average</span>
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-blue-600">{stats.avg}</span>
                <span className="text-[10px] text-slate-500">{currentSensor.unit}</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px]">
                {stats.trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                {stats.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                {stats.trend === 'neutral' && <Minus className="h-3 w-3 text-slate-400" />}
                <span className={cn(
                  'font-bold',
                  stats.trend === 'up' && 'text-emerald-600',
                  stats.trend === 'down' && 'text-red-600',
                  stats.trend === 'neutral' && 'text-slate-500'
                )}>
                  {stats.percentChange}% VS PREV
                </span>
              </div>
            </div>

            {/* Maximum */}
            <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Maximum</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-emerald-600">{stats.max}</span>
                <span className="text-[10px] text-slate-500">{currentSensor.unit}</span>
              </div>
              <span className="text-[10px] text-slate-500">PEAK VALUE IN PERIOD</span>
            </div>

            {/* Minimum */}
            <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-amber-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Minimum</span>
                <TrendingDown className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-amber-600">{stats.min}</span>
                <span className="text-[10px] text-slate-500">{currentSensor.unit}</span>
              </div>
              <span className="text-[10px] text-slate-500">LOWEST VALUE IN PERIOD</span>
            </div>

            {/* In Range */}
            <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Range</span>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-emerald-600">{stats.inRangePercent}%</span>
              </div>
              <span className="text-[10px] text-slate-500">WITHIN THRESHOLD LIMITS</span>
            </div>
          </div>
        )}

        {/* Period Comparison */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Period Comparison</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Today vs Yesterday</p>
                <p className="text-2xl font-bold font-mono text-emerald-600">+2.3%</p>
              </div>
              <div className="text-center p-4 bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">This Week vs Last Week</p>
                <p className="text-2xl font-bold font-mono text-red-600">-1.8%</p>
              </div>
              <div className="text-center p-4 bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">This Month vs Last Month</p>
                <p className="text-2xl font-bold font-mono text-emerald-600">+5.2%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
