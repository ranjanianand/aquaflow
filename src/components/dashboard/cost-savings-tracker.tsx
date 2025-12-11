'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DollarSign, Zap, Beaker, Wrench, TrendingUp, ArrowRight } from 'lucide-react';
import { mockCostMetrics, getTotalPotentialSavings } from '@/data/mock-operations';
import Link from 'next/link';

interface SavingsBarProps {
  label: string;
  value: number;
  total: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function SavingsBar({ label, value, total, icon: Icon, color }: SavingsBarProps) {
  const percentage = Math.round((value / total) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={cn('h-3 w-3', color)} />
          <span className="text-[11px] text-muted-foreground">{label}</span>
        </div>
        <span className="text-[11px] font-semibold tabular-nums">${value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color.replace('text-', 'bg-'))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function CostSavingsTracker() {
  const { totalSavings, savingsBreakdown, trend, percentChange } = mockCostMetrics;
  const potentialSavings = getTotalPotentialSavings();

  const savingsItems = [
    { label: 'Energy', value: savingsBreakdown.energy, icon: Zap, color: 'text-amber-500' },
    { label: 'Chemicals', value: savingsBreakdown.chemicals, icon: Beaker, color: 'text-blue-500' },
    { label: 'Maintenance', value: savingsBreakdown.maintenance, icon: Wrench, color: 'text-emerald-500' },
  ];

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-[13px] font-semibold">Cost Savings</h3>
          </div>
          <Link href="/insights" className="text-[11px] text-primary hover:underline flex items-center gap-0.5">
            View Details
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Main Savings Value */}
        <div className="flex items-end gap-3 mb-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">This Month</p>
            <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              ${totalSavings.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-1 pb-1">
            <TrendingUp className={cn(
              'h-4 w-4',
              trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-muted-foreground'
            )} />
            <span className={cn(
              'text-[12px] font-medium',
              trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-muted-foreground'
            )}>
              {trend === 'up' ? '+' : ''}{percentChange}%
            </span>
          </div>
        </div>

        {/* Savings Breakdown */}
        <div className="space-y-2.5 flex-1">
          {savingsItems.map((item) => (
            <SavingsBar
              key={item.label}
              label={item.label}
              value={item.value}
              total={totalSavings}
              icon={item.icon}
              color={item.color}
            />
          ))}
        </div>

        {/* Potential Additional Savings */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-3 border border-blue-100 dark:border-blue-900 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wide font-medium">
                Potential Additional Savings
              </p>
              <p className="text-lg font-bold tabular-nums text-blue-700 dark:text-blue-300">
                +${potentialSavings.toLocaleString()}/mo
              </p>
            </div>
            <Link
              href="/insights"
              className="text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors"
            >
              View Insights
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
