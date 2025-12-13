'use client';

import { cn } from '@/lib/utils';
import { DollarSign, TrendingDown, AlertTriangle, Wrench, ArrowRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CostImpactItem {
  id: string;
  equipment: string;
  failureCost: number; // Cost if equipment fails
  maintenanceCost: number; // Cost of preventive maintenance
  savingsPercentage: number; // Percentage saved by doing maintenance
  daysToFailure: number;
  status: 'healthy' | 'watch' | 'warning' | 'critical';
}

interface CostImpactAnalysisProps {
  className?: string;
}

// Mock data
const costData: CostImpactItem[] = [
  {
    id: '1',
    equipment: 'RO Membrane',
    failureCost: 250000,
    maintenanceCost: 45000,
    savingsPercentage: 82,
    daysToFailure: 45,
    status: 'watch',
  },
  {
    id: '2',
    equipment: 'Feed Pump',
    failureCost: 180000,
    maintenanceCost: 25000,
    savingsPercentage: 86,
    daysToFailure: 120,
    status: 'healthy',
  },
  {
    id: '3',
    equipment: 'pH Sensors',
    failureCost: 75000,
    maintenanceCost: 15000,
    savingsPercentage: 80,
    daysToFailure: 15,
    status: 'warning',
  },
  {
    id: '4',
    equipment: 'Clarifier Motor',
    failureCost: 320000,
    maintenanceCost: 55000,
    savingsPercentage: 83,
    daysToFailure: 7,
    status: 'critical',
  },
];

const formatCurrency = (amount: number) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${(amount / 1000).toFixed(0)}K`;
};

const formatFullCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function CostImpactAnalysis({ className }: CostImpactAnalysisProps) {
  const totalFailureCost = costData.reduce((sum, item) => sum + item.failureCost, 0);
  const totalMaintenanceCost = costData.reduce((sum, item) => sum + item.maintenanceCost, 0);
  const totalSavings = totalFailureCost - totalMaintenanceCost;

  const chartData = costData.map(item => ({
    name: item.equipment.split(' ')[0],
    failure: item.failureCost / 1000,
    maintenance: item.maintenanceCost / 1000,
    status: item.status,
  }));

  const statusColors: Record<string, string> = {
    healthy: '#10b981',
    watch: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444',
  };

  return (
    <div className={cn('border-2 border-slate-300 bg-white overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-slate-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
          Cost Impact Analysis
        </span>
        <span className="text-[10px] text-slate-400 ml-auto">Failure vs Maintenance Cost</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <span className="text-[9px] font-bold uppercase text-red-600">Failure Risk</span>
            </div>
            <div className="text-xl font-bold font-mono text-red-700">
              {formatCurrency(totalFailureCost)}
            </div>
            <div className="text-[9px] text-red-600/80">Potential loss</div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Wrench className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-[9px] font-bold uppercase text-blue-600">Maintenance</span>
            </div>
            <div className="text-xl font-bold font-mono text-blue-700">
              {formatCurrency(totalMaintenanceCost)}
            </div>
            <div className="text-[9px] text-blue-600/80">Investment needed</div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[9px] font-bold uppercase text-emerald-600">Savings</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700">
              {formatCurrency(totalSavings)}
            </div>
            <div className="text-[9px] text-emerald-600/80">
              {((totalSavings / totalFailureCost) * 100).toFixed(0)}% cost avoided
            </div>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(value) => `${value}K`}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #cbd5e1',
                  borderRadius: '0',
                  fontSize: '11px',
                }}
                formatter={(value: number, name: string) => [
                  formatFullCurrency(value * 1000),
                  name === 'failure' ? 'Failure Cost' : 'Maintenance Cost'
                ]}
              />
              <Bar dataKey="failure" name="failure" fill="#ef4444" radius={[0, 2, 2, 0]} />
              <Bar dataKey="maintenance" name="maintenance" fill="#3b82f6" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-500" />
            <span className="text-slate-600">Failure Cost</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500" />
            <span className="text-slate-600">Maintenance Cost</span>
          </div>
        </div>

        {/* Equipment Breakdown */}
        <div className="border-t border-slate-200 pt-3 space-y-2">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Equipment Breakdown
          </div>
          {costData
            .sort((a, b) => a.daysToFailure - b.daysToFailure)
            .map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-sm',
                  item.status === 'critical' && 'bg-red-50 border-l-2 border-red-500',
                  item.status === 'warning' && 'bg-amber-50 border-l-2 border-amber-500',
                  item.status === 'watch' && 'bg-blue-50 border-l-2 border-blue-500',
                  item.status === 'healthy' && 'bg-slate-50 border-l-2 border-emerald-500'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-slate-700 truncate">
                    {item.equipment}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {item.daysToFailure} days to predicted failure
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-red-600 font-mono">{formatCurrency(item.failureCost)}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="text-blue-600 font-mono">{formatCurrency(item.maintenanceCost)}</span>
                  <span className="text-emerald-600 font-bold">
                    -{item.savingsPercentage}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
