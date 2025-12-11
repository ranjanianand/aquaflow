'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  DollarSign,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
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
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Active Insights</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tabular-nums">{totalInsights}</p>
              {highPriority > 0 && (
                <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  {highPriority} high priority
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Potential Savings */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Potential Savings</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                ${potentialSavings.toLocaleString()}
              </p>
              <span className="text-[11px] text-muted-foreground">/month</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Energy Savings */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Energy Potential</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {energySavings.toLocaleString()}
              </p>
              <span className="text-[11px] text-muted-foreground">kWh/mo</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Realized Savings */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Realized This Month</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tabular-nums text-purple-600 dark:text-purple-400">
                ${totalSavings.toLocaleString()}
              </p>
              <span className="text-[11px] font-medium text-emerald-600">
                +{percentChange}%
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
