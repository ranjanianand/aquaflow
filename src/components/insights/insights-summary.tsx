'use client';

import {
  Lightbulb,
  DollarSign,
  Zap,
  TrendingUp,
} from 'lucide-react';
import {
  mockInsights,
  getTotalPotentialSavings,
  mockCostMetrics
} from '@/data/mock-operations';

export function InsightsSummary() {
  const totalInsights = mockInsights.length;
  const highPriority = mockInsights.filter(i => i.priority === 'high').length;
  const potentialSavings = getTotalPotentialSavings();
  const { totalSavings, percentChange } = mockCostMetrics;

  // Calculate total energy savings potential
  const energySavings = mockInsights.reduce(
    (acc, i) => acc + (i.impact.energySavings || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Insights */}
      <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Insights</span>
          <Lightbulb className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold font-mono text-blue-600">{totalInsights}</span>
          {highPriority > 0 && (
            <span className="text-[10px] font-medium text-rose-600">
              {highPriority} HIGH
            </span>
          )}
        </div>
      </div>

      {/* Potential Savings */}
      <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Potential Savings</span>
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold font-mono text-emerald-600">
            ${potentialSavings.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">/MO</span>
        </div>
      </div>

      {/* Energy Savings */}
      <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-amber-500">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Energy Potential</span>
          <Zap className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold font-mono text-amber-600">
            {energySavings.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">KWH/MO</span>
        </div>
      </div>

      {/* Realized Savings */}
      <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-purple-500">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Realized This Month</span>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold font-mono text-purple-600">
            ${totalSavings.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-emerald-600">
            +{percentChange}%
          </span>
        </div>
      </div>
    </div>
  );
}
