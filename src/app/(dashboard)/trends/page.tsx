'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Download, TrendingUp, TrendingDown, Minus, Target, Clock, CheckCircle } from 'lucide-react';
import { TrendsSkeleton } from '@/components/shared/loading-skeleton';

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
      <div className="min-h-screen">
        <Header
          title="Trends & Analysis"
          subtitle="Historical data analysis and trending"
        />
        <TrendsSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Trends & Analysis"
        subtitle="Historical data analysis and trending"
      />

      <div className="p-8 space-y-6">
        {/* Filters Row */}
        <div className="flex flex-wrap gap-4">
          <Select value={selectedPlant} onValueChange={setSelectedPlant}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select plant" />
            </SelectTrigger>
            <SelectContent>
              {mockPlants.map((plant) => (
                <SelectItem key={plant.id} value={plant.id}>
                  {plant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSensor} onValueChange={setSelectedSensor}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select sensor" />
            </SelectTrigger>
            <SelectContent>
              {sensors.map((sensor) => (
                <SelectItem key={sensor.id} value={sensor.id}>
                  {sensor.name} ({sensor.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as TimeRange)}
          >
            <TabsList>
              <TabsTrigger value="24H">24H</TabsTrigger>
              <TabsTrigger value="7D">7D</TabsTrigger>
              <TabsTrigger value="30D">30D</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Main Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/50 px-6 py-4">
            <CardTitle className="text-base font-semibold">
              {currentSensor?.name || 'Select a sensor'} Trend
            </CardTitle>
            {currentSensor && (
              <div className="text-sm text-muted-foreground">
                Threshold: {currentSensor.minThreshold} - {currentSensor.maxThreshold}{' '}
                {currentSensor.unit}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[400px]">
              {currentSensor ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      tickMargin={8}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      tickMargin={8}
                      domain={[
                        currentSensor.minThreshold - (currentSensor.maxThreshold - currentSensor.minThreshold) * 0.1,
                        currentSensor.maxThreshold + (currentSensor.maxThreshold - currentSensor.minThreshold) * 0.1,
                      ]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [
                        `${value.toFixed(2)} ${currentSensor.unit}`,
                        currentSensor.type,
                      ]}
                    />
                    <ReferenceLine
                      y={currentSensor.maxThreshold}
                      stroke="var(--danger)"
                      strokeDasharray="5 5"
                      label={{
                        value: `Max: ${currentSensor.maxThreshold}`,
                        position: 'right',
                        fill: 'var(--danger)',
                        fontSize: 11,
                      }}
                    />
                    <ReferenceLine
                      y={currentSensor.minThreshold}
                      stroke="var(--warning)"
                      strokeDasharray="5 5"
                      label={{
                        value: `Min: ${currentSensor.minThreshold}`,
                        position: 'right',
                        fill: 'var(--warning)',
                        fontSize: 11,
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
                      stroke="var(--accent-blue)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: 'var(--accent-blue)' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Select a sensor to view trend data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        {stats && currentSensor && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[var(--accent-blue)]">
                  <Target className="h-5 w-5" />
                </div>
                <span className="text-sm text-muted-foreground">Average</span>
              </div>
              <p className="text-2xl font-bold">
                {stats.avg} <span className="text-sm font-normal text-muted-foreground">{currentSensor.unit}</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm">
                {stats.trend === 'up' && <TrendingUp className="h-4 w-4 text-[var(--success)]" />}
                {stats.trend === 'down' && <TrendingDown className="h-4 w-4 text-[var(--danger)]" />}
                {stats.trend === 'neutral' && <Minus className="h-4 w-4 text-muted-foreground" />}
                <span
                  className={
                    stats.trend === 'up'
                      ? 'text-[var(--success)]'
                      : stats.trend === 'down'
                      ? 'text-[var(--danger)]'
                      : 'text-muted-foreground'
                  }
                >
                  {stats.percentChange}% vs previous period
                </span>
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success)]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-sm text-muted-foreground">Maximum</span>
              </div>
              <p className="text-2xl font-bold text-[var(--success)]">
                {stats.max} <span className="text-sm font-normal text-muted-foreground">{currentSensor.unit}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Peak value in period</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--warning-bg)] text-[var(--warning)]">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <span className="text-sm text-muted-foreground">Minimum</span>
              </div>
              <p className="text-2xl font-bold text-[var(--warning)]">
                {stats.min} <span className="text-sm font-normal text-muted-foreground">{currentSensor.unit}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Lowest value in period</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[var(--accent-blue)]">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <span className="text-sm text-muted-foreground">In Range</span>
              </div>
              <p className="text-2xl font-bold">
                {stats.inRangePercent}%
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Within threshold limits</p>
            </Card>
          </div>
        )}

        {/* Period Comparison */}
        <Card>
          <CardHeader className="border-b bg-muted/50 px-6 py-4">
            <CardTitle className="text-base font-semibold">Period Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Today vs Yesterday</p>
                <p className="text-xl font-bold text-[var(--success)]">+2.3%</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">This Week vs Last Week</p>
                <p className="text-xl font-bold text-[var(--danger)]">-1.8%</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">This Month vs Last Month</p>
                <p className="text-xl font-bold text-[var(--success)]">+5.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
