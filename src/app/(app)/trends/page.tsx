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
  Legend,
} from 'recharts';
import { mockPlants } from '@/data/mock-plants';
import { getSensorsByPlant, mockSensors } from '@/data/mock-sensors';
import { Sensor } from '@/types';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CheckCircle,
  BarChart3,
  ChevronDown,
  GitCompare,
  X,
  Plus,
} from 'lucide-react';
import { TrendsSkeleton } from '@/components/shared/loading-skeleton';
import { cn } from '@/lib/utils';

type TimeRange = '7D' | '30D' | '90D';
type ViewMode = 'single' | 'compare';

// Colors for comparison chart lines
const COMPARISON_COLORS = [
  '#0066ff', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ef4444', // Red
];

// Generate trend data with more points for longer periods
const generateTrendData = (sensor: Sensor, days: number, seed: number = 0) => {
  const data = [];
  const now = Date.now();
  const pointsPerDay = days <= 7 ? 24 : days <= 30 ? 4 : 1; // hourly for 7D, 6-hourly for 30D, daily for 90D
  const totalPoints = days * pointsPerDay;
  const interval = (days * 24 * 3600000) / totalPoints;

  for (let i = totalPoints; i >= 0; i--) {
    const timestamp = new Date(now - i * interval);
    const baseValue = sensor.currentValue;
    // Use seeded random for consistent data
    const seedValue = seed + i + sensor.id.charCodeAt(0);
    const random = Math.sin(seedValue) * 10000;
    const variation = ((random - Math.floor(random)) - 0.5) * (sensor.maxThreshold - sensor.minThreshold) * 0.4;

    data.push({
      time: days <= 7
        ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      date: timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      timestamp: timestamp.getTime(),
      value: parseFloat((baseValue + variation).toFixed(2)),
    });
  }

  return data;
};

// Generate comparison data for multiple sensors
const generateComparisonData = (sensors: Sensor[], days: number) => {
  if (sensors.length === 0) return [];

  const now = Date.now();
  const pointsPerDay = days <= 7 ? 24 : days <= 30 ? 4 : 1;
  const totalPoints = days * pointsPerDay;
  const interval = (days * 24 * 3600000) / totalPoints;

  const data = [];

  for (let i = totalPoints; i >= 0; i--) {
    const timestamp = new Date(now - i * interval);
    const point: Record<string, number | string> = {
      time: days <= 7
        ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      timestamp: timestamp.getTime(),
    };

    sensors.forEach((sensor, idx) => {
      const seedValue = idx * 1000 + i + sensor.id.charCodeAt(0);
      const random = Math.sin(seedValue) * 10000;
      const variation = ((random - Math.floor(random)) - 0.5) * (sensor.maxThreshold - sensor.minThreshold) * 0.4;
      point[sensor.id] = parseFloat((sensor.currentValue + variation).toFixed(2));
    });

    data.push(point);
  }

  return data;
};

export default function TrendsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [selectedPlant, setSelectedPlant] = useState(mockPlants[0]?.id || '');
  const [selectedSensor, setSelectedSensor] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');
  const [sensors, setSensors] = useState<Sensor[]>([]);

  // Compare mode state
  const [comparisonSensors, setComparisonSensors] = useState<Sensor[]>([]);
  const [showSensorPicker, setShowSensorPicker] = useState(false);

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
      if (plantSensors.length > 0 && !selectedSensor) {
        setSelectedSensor(plantSensors[0].id);
      }
    }
  }, [selectedPlant, selectedSensor]);

  const currentSensor = sensors.find((s) => s.id === selectedSensor);

  const timeRangeDays: Record<TimeRange, number> = {
    '7D': 7,
    '30D': 30,
    '90D': 90,
  };

  // Single sensor chart data
  const chartData = useMemo(() => {
    if (!currentSensor) return [];
    return generateTrendData(currentSensor, timeRangeDays[timeRange]);
  }, [currentSensor, timeRange]);

  // Comparison chart data
  const comparisonData = useMemo(() => {
    if (comparisonSensors.length === 0) return [];
    return generateComparisonData(comparisonSensors, timeRangeDays[timeRange]);
  }, [comparisonSensors, timeRange]);

  // Calculate statistics for single sensor
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const values = chartData.map((d) => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    const inRange = currentSensor
      ? values.filter((v) => v >= currentSensor.minThreshold && v <= currentSensor.maxThreshold).length
      : values.length;
    const inRangePercent = (inRange / values.length) * 100;

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

  // Add sensor to comparison
  const addToComparison = (sensor: Sensor) => {
    if (comparisonSensors.length < 5 && !comparisonSensors.find(s => s.id === sensor.id)) {
      setComparisonSensors([...comparisonSensors, sensor]);
    }
    setShowSensorPicker(false);
  };

  // Remove sensor from comparison
  const removeFromComparison = (sensorId: string) => {
    setComparisonSensors(comparisonSensors.filter(s => s.id !== sensorId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BarChart3 className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Trends & Compare</span>
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
          <span className="text-sm font-bold text-white uppercase tracking-wider">Trends & Compare</span>
          <span className="text-[10px] text-slate-400">Historical data analysis and sensor comparison</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">RANGE:</span>
          <span className="text-[10px] font-mono text-emerald-400">{timeRange}</span>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Mode Toggle & Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex border-2 border-slate-300 bg-white">
            <button
              onClick={() => setViewMode('single')}
              className={cn(
                'px-4 py-1.5 text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors',
                viewMode === 'single'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Single Sensor
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={cn(
                'px-4 py-1.5 text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors',
                viewMode === 'compare'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <GitCompare className="h-3.5 w-3.5" />
              Compare Sensors
            </button>
          </div>

          <div className="h-6 w-px bg-slate-300" />

          {/* Time Range Buttons */}
          <div className="flex gap-1">
            {(['7D', '30D', '90D'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                  timeRange === range
                    ? 'bg-slate-700 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border-2 border-slate-300'
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {viewMode === 'single' && (
            <>
              <div className="h-6 w-px bg-slate-300" />

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
                  className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500 max-w-[250px]"
                >
                  {sensors.map((sensor) => (
                    <option key={sensor.id} value={sensor.id}>
                      {sensor.name} ({sensor.type})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </>
          )}

          <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        {/* Compare Mode: Sensor Selection */}
        {viewMode === 'compare' && (
          <div className="border-2 border-slate-300 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Selected Sensors ({comparisonSensors.length}/5)
              </span>
              {comparisonSensors.length < 5 && (
                <button
                  onClick={() => setShowSensorPicker(!showSensorPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Sensor
                </button>
              )}
            </div>

            {/* Selected sensors chips */}
            <div className="flex flex-wrap gap-2">
              {comparisonSensors.map((sensor, idx) => (
                <div
                  key={sensor.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COMPARISON_COLORS[idx] }}
                  />
                  <span className="text-[11px] font-medium">{sensor.name}</span>
                  <span className="text-[10px] text-slate-500">({sensor.type})</span>
                  <button
                    onClick={() => removeFromComparison(sensor.id)}
                    className="ml-1 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {comparisonSensors.length === 0 && (
                <span className="text-[11px] text-slate-400 italic">
                  Click "Add Sensor" to select sensors for comparison
                </span>
              )}
            </div>

            {/* Sensor Picker Dropdown */}
            {showSensorPicker && (
              <div className="mt-3 border-2 border-slate-300 bg-white max-h-[300px] overflow-y-auto">
                <div className="sticky top-0 bg-slate-100 px-3 py-2 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-600">Select a sensor to compare</span>
                </div>
                {mockPlants.map((plant) => {
                  const plantSensors = getSensorsByPlant(plant.id);
                  return (
                    <div key={plant.id}>
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-500">{plant.name}</span>
                      </div>
                      {plantSensors.slice(0, 10).map((sensor) => {
                        const isSelected = comparisonSensors.find(s => s.id === sensor.id);
                        return (
                          <button
                            key={sensor.id}
                            onClick={() => !isSelected && addToComparison(sensor)}
                            disabled={!!isSelected}
                            className={cn(
                              'w-full px-3 py-2 text-left flex items-center justify-between border-b border-slate-100',
                              isSelected
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'hover:bg-blue-50'
                            )}
                          >
                            <div>
                              <span className="text-[11px] font-medium">{sensor.name}</span>
                              <span className="text-[10px] text-slate-500 ml-2">
                                {sensor.currentValue} {sensor.unit}
                              </span>
                            </div>
                            <span className={cn(
                              'text-[9px] font-bold uppercase px-1.5 py-0.5',
                              sensor.status === 'normal' && 'bg-emerald-100 text-emerald-700',
                              sensor.status === 'warning' && 'bg-amber-100 text-amber-700',
                              sensor.status === 'critical' && 'bg-red-100 text-red-700'
                            )}>
                              {sensor.type}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stats Grid - Only for Single Sensor Mode (ABOVE CHART) */}
        {viewMode === 'single' && stats && currentSensor && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Average */}
            <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Average</span>
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-blue-600">{stats.avg}</span>
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
                <span className="text-2xl font-bold font-mono text-emerald-600">{stats.max}</span>
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
                <span className="text-2xl font-bold font-mono text-amber-600">{stats.min}</span>
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
                <span className="text-2xl font-bold font-mono text-emerald-600">{stats.inRangePercent}%</span>
              </div>
              <span className="text-[10px] text-slate-500">WITHIN THRESHOLD LIMITS</span>
            </div>
          </div>
        )}

        {/* Main Chart Panel */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {viewMode === 'single' ? (
                <BarChart3 className="h-4 w-4 text-slate-500" />
              ) : (
                <GitCompare className="h-4 w-4 text-slate-500" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {viewMode === 'single'
                  ? `${currentSensor?.name || 'Select a sensor'} Trend`
                  : `Sensor Comparison (${timeRange})`}
              </span>
            </div>
            {viewMode === 'single' && currentSensor && (
              <span className="text-[10px] font-mono text-slate-500">
                THRESHOLD: {currentSensor.minThreshold} - {currentSensor.maxThreshold} {currentSensor.unit}
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="h-[400px]">
              {viewMode === 'single' ? (
                // Single Sensor Chart
                currentSensor ? (
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
                )
              ) : (
                // Comparison Chart
                comparisonSensors.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
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
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '2px solid #cbd5e1',
                          borderRadius: '0',
                          fontSize: '11px',
                        }}
                        formatter={(value: number, name: string) => {
                          const sensor = comparisonSensors.find(s => s.id === name);
                          return [`${value.toFixed(2)} ${sensor?.unit || ''}`, sensor?.name || name];
                        }}
                      />
                      <Legend
                        formatter={(value) => {
                          const sensor = comparisonSensors.find(s => s.id === value);
                          return sensor?.name || value;
                        }}
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                      {comparisonSensors.map((sensor, idx) => (
                        <Line
                          key={sensor.id}
                          type="monotone"
                          dataKey={sensor.id}
                          stroke={COMPARISON_COLORS[idx]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6, fill: COMPARISON_COLORS[idx] }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col h-full items-center justify-center text-slate-400">
                    <GitCompare className="h-12 w-12 mb-3 text-slate-300" />
                    <p className="text-sm font-medium">No sensors selected for comparison</p>
                    <p className="text-xs mt-1">Click "Add Sensor" above to select up to 5 sensors</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Period Comparison - Only for Single Sensor Mode */}
        {viewMode === 'single' && currentSensor && (
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
        )}

        {/* Comparison Stats - Only for Compare Mode */}
        {viewMode === 'compare' && comparisonSensors.length > 0 && (
          <div className="border-2 border-slate-300 bg-white overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Comparison Statistics ({timeRange})
              </span>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-2 px-3 font-bold uppercase text-slate-500">Sensor</th>
                      <th className="text-right py-2 px-3 font-bold uppercase text-slate-500">Current</th>
                      <th className="text-right py-2 px-3 font-bold uppercase text-slate-500">Avg</th>
                      <th className="text-right py-2 px-3 font-bold uppercase text-slate-500">Min</th>
                      <th className="text-right py-2 px-3 font-bold uppercase text-slate-500">Max</th>
                      <th className="text-right py-2 px-3 font-bold uppercase text-slate-500">Range</th>
                      <th className="text-center py-2 px-3 font-bold uppercase text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonSensors.map((sensor, idx) => {
                      const sensorData = comparisonData.map(d => d[sensor.id] as number);
                      const avg = sensorData.reduce((a, b) => a + b, 0) / sensorData.length;
                      const min = Math.min(...sensorData);
                      const max = Math.max(...sensorData);

                      return (
                        <tr key={sensor.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COMPARISON_COLORS[idx] }}
                              />
                              <span className="font-medium">{sensor.name}</span>
                            </div>
                          </td>
                          <td className="text-right py-2.5 px-3 font-mono font-bold">
                            {sensor.currentValue} {sensor.unit}
                          </td>
                          <td className="text-right py-2.5 px-3 font-mono">
                            {avg.toFixed(2)} {sensor.unit}
                          </td>
                          <td className="text-right py-2.5 px-3 font-mono text-amber-600">
                            {min.toFixed(2)}
                          </td>
                          <td className="text-right py-2.5 px-3 font-mono text-emerald-600">
                            {max.toFixed(2)}
                          </td>
                          <td className="text-right py-2.5 px-3 font-mono text-slate-500">
                            {sensor.minThreshold} - {sensor.maxThreshold}
                          </td>
                          <td className="text-center py-2.5 px-3">
                            <span className={cn(
                              'px-2 py-0.5 text-[9px] font-bold uppercase',
                              sensor.status === 'normal' && 'bg-emerald-100 text-emerald-700',
                              sensor.status === 'warning' && 'bg-amber-100 text-amber-700',
                              sensor.status === 'critical' && 'bg-red-100 text-red-700'
                            )}>
                              {sensor.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
