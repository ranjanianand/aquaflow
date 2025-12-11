'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import {
  GitCompareArrows,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Droplets,
  DollarSign,
} from 'lucide-react';
import { useState } from 'react';
import { mockPlants } from '@/data/mock-plants';

interface PlantMetrics {
  plantId: string;
  plantName: string;
  efficiency: number;
  uptime: number;
  energyConsumption: number;
  waterRecovery: number;
  qualityScore: number;
  maintenanceCost: number;
  alertsCount: number;
  complianceRate: number;
}

// Mock comparison metrics for plants
const plantMetrics: PlantMetrics[] = [
  {
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    efficiency: 94,
    uptime: 99.2,
    energyConsumption: 2.4,
    waterRecovery: 87,
    qualityScore: 96,
    maintenanceCost: 12500,
    alertsCount: 3,
    complianceRate: 98,
  },
  {
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    efficiency: 91,
    uptime: 98.5,
    energyConsumption: 2.8,
    waterRecovery: 82,
    qualityScore: 92,
    maintenanceCost: 15200,
    alertsCount: 7,
    complianceRate: 95,
  },
  {
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    efficiency: 88,
    uptime: 97.1,
    energyConsumption: 3.1,
    waterRecovery: 78,
    qualityScore: 89,
    maintenanceCost: 18900,
    alertsCount: 12,
    complianceRate: 91,
  },
  {
    plantId: 'plant-4',
    plantName: 'Bangalore WTP-04',
    efficiency: 96,
    uptime: 99.5,
    energyConsumption: 2.2,
    waterRecovery: 89,
    qualityScore: 97,
    maintenanceCost: 11200,
    alertsCount: 2,
    complianceRate: 99,
  },
  {
    plantId: 'plant-5',
    plantName: 'Hyderabad WTP-05',
    efficiency: 92,
    uptime: 98.8,
    energyConsumption: 2.6,
    waterRecovery: 84,
    qualityScore: 94,
    maintenanceCost: 13800,
    alertsCount: 5,
    complianceRate: 96,
  },
  {
    plantId: 'plant-6',
    plantName: 'Pune ETP-01',
    efficiency: 89,
    uptime: 97.8,
    energyConsumption: 2.9,
    waterRecovery: 80,
    qualityScore: 91,
    maintenanceCost: 16500,
    alertsCount: 8,
    complianceRate: 93,
  },
];

export function AssetComparison() {
  const [selectedPlant1, setSelectedPlant1] = useState('plant-1');
  const [selectedPlant2, setSelectedPlant2] = useState('plant-4');

  const plant1 = plantMetrics.find((p) => p.plantId === selectedPlant1);
  const plant2 = plantMetrics.find((p) => p.plantId === selectedPlant2);

  if (!plant1 || !plant2) return null;

  // Radar chart data
  const radarData = [
    { metric: 'Efficiency', plant1: plant1.efficiency, plant2: plant2.efficiency, fullMark: 100 },
    { metric: 'Uptime', plant1: plant1.uptime, plant2: plant2.uptime, fullMark: 100 },
    { metric: 'Recovery', plant1: plant1.waterRecovery, plant2: plant2.waterRecovery, fullMark: 100 },
    { metric: 'Quality', plant1: plant1.qualityScore, plant2: plant2.qualityScore, fullMark: 100 },
    { metric: 'Compliance', plant1: plant1.complianceRate, plant2: plant2.complianceRate, fullMark: 100 },
  ];

  // Bar chart data for comparison
  const barData = [
    {
      metric: 'Energy (kWh/m³)',
      [plant1.plantName]: plant1.energyConsumption,
      [plant2.plantName]: plant2.energyConsumption,
    },
    {
      metric: 'Maintenance ($K)',
      [plant1.plantName]: plant1.maintenanceCost / 1000,
      [plant2.plantName]: plant2.maintenanceCost / 1000,
    },
    {
      metric: 'Alerts',
      [plant1.plantName]: plant1.alertsCount,
      [plant2.plantName]: plant2.alertsCount,
    },
  ];

  const getComparisonIndicator = (val1: number, val2: number, lowerIsBetter = false) => {
    const diff = lowerIsBetter ? val2 - val1 : val1 - val2;
    if (Math.abs(diff) < 1) return { icon: Minus, color: 'text-muted-foreground', label: 'Similar' };
    if (diff > 0) return { icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', label: 'Better' };
    return { icon: TrendingDown, color: 'text-rose-600 dark:text-rose-400', label: 'Lower' };
  };

  const metrics = [
    { label: 'Efficiency', key: 'efficiency', unit: '%', icon: Zap, lowerIsBetter: false },
    { label: 'Uptime', key: 'uptime', unit: '%', icon: CheckCircle2, lowerIsBetter: false },
    { label: 'Water Recovery', key: 'waterRecovery', unit: '%', icon: Droplets, lowerIsBetter: false },
    { label: 'Quality Score', key: 'qualityScore', unit: '%', icon: CheckCircle2, lowerIsBetter: false },
    { label: 'Energy Consumption', key: 'energyConsumption', unit: 'kWh/m³', icon: Zap, lowerIsBetter: true },
    { label: 'Maintenance Cost', key: 'maintenanceCost', unit: '$/mo', icon: DollarSign, lowerIsBetter: true },
    { label: 'Active Alerts', key: 'alertsCount', unit: '', icon: AlertTriangle, lowerIsBetter: true },
    { label: 'Compliance Rate', key: 'complianceRate', unit: '%', icon: CheckCircle2, lowerIsBetter: false },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-5 py-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[14px] font-semibold">Asset Comparison</h3>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPlant1} onValueChange={setSelectedPlant1}>
              <SelectTrigger className="w-[180px] h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plantMetrics.map((plant) => (
                  <SelectItem key={plant.plantId} value={plant.plantId} disabled={plant.plantId === selectedPlant2}>
                    {plant.plantName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[12px] text-muted-foreground">vs</span>
            <Select value={selectedPlant2} onValueChange={setSelectedPlant2}>
              <SelectTrigger className="w-[180px] h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plantMetrics.map((plant) => (
                  <SelectItem key={plant.plantId} value={plant.plantId} disabled={plant.plantId === selectedPlant1}>
                    {plant.plantName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Metrics Comparison Table */}
          <div>
            <h4 className="text-[13px] font-semibold mb-3">Performance Metrics</h4>
            <div className="space-y-2">
              {metrics.map((metric) => {
                const val1 = plant1[metric.key as keyof PlantMetrics] as number;
                const val2 = plant2[metric.key as keyof PlantMetrics] as number;
                const comparison = getComparisonIndicator(val1, val2, metric.lowerIsBetter);
                const ComparisonIcon = comparison.icon;
                const MetricIcon = metric.icon;

                return (
                  <div key={metric.key} className="grid grid-cols-4 items-center gap-2 py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <MetricIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{metric.label}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[13px] font-semibold tabular-nums">
                        {metric.key === 'maintenanceCost' ? `$${val1.toLocaleString()}` : val1}
                        {metric.unit && metric.key !== 'maintenanceCost' && (
                          <span className="text-[10px] text-muted-foreground ml-0.5">{metric.unit}</span>
                        )}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[13px] font-semibold tabular-nums">
                        {metric.key === 'maintenanceCost' ? `$${val2.toLocaleString()}` : val2}
                        {metric.unit && metric.key !== 'maintenanceCost' && (
                          <span className="text-[10px] text-muted-foreground ml-0.5">{metric.unit}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <ComparisonIcon className={cn('h-3.5 w-3.5', comparison.color)} />
                      <span className={cn('text-[10px] font-medium', comparison.color)}>
                        {comparison.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Headers */}
            <div className="grid grid-cols-4 items-center gap-2 mt-4 pt-2 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase">Metric</div>
              <div className="text-center text-[10px] text-blue-600 font-semibold truncate">{plant1.plantName}</div>
              <div className="text-center text-[10px] text-emerald-600 font-semibold truncate">{plant2.plantName}</div>
              <div className="text-right text-[10px] text-muted-foreground">Comparison</div>
            </div>
          </div>

          {/* Radar Chart */}
          <div>
            <h4 className="text-[13px] font-semibold mb-3">Performance Profile</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
                  />
                  <Radar
                    name={plant1.plantName}
                    dataKey="plant1"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name={plant2.plantName}
                    dataKey="plant2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    iconSize={8}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bar Chart Comparison */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-[13px] font-semibold mb-3">Cost & Resource Comparison</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="metric"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} iconSize={8} />
                <Bar dataKey={plant1.plantName} fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                <Bar dataKey={plant2.plantName} fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-[12px] font-semibold">Comparison Summary</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {plant2.efficiency > plant1.efficiency
              ? `${plant2.plantName} shows ${(plant2.efficiency - plant1.efficiency).toFixed(1)}% higher efficiency`
              : `${plant1.plantName} shows ${(plant1.efficiency - plant2.efficiency).toFixed(1)}% higher efficiency`}
            {' '}with{' '}
            {plant1.energyConsumption < plant2.energyConsumption
              ? `${((plant2.energyConsumption - plant1.energyConsumption) / plant2.energyConsumption * 100).toFixed(0)}% lower energy consumption at ${plant1.plantName}`
              : `${((plant1.energyConsumption - plant2.energyConsumption) / plant1.energyConsumption * 100).toFixed(0)}% lower energy consumption at ${plant2.plantName}`}.
          </p>
        </div>
      </div>
    </Card>
  );
}
