'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  Wrench,
  TrendingUp,
  DollarSign,
  Shield,
  ArrowRight,
  Zap,
  Droplets,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { OperationalInsight } from '@/data/mock-operations';

interface InsightCardProps {
  insight: OperationalInsight;
  onApply?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const typeConfig = {
  optimization: {
    icon: TrendingUp,
    label: 'Optimization',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 dark:bg-blue-900',
  },
  maintenance: {
    icon: Wrench,
    label: 'Maintenance',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 dark:bg-purple-900',
  },
  efficiency: {
    icon: Zap,
    label: 'Efficiency',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-900',
  },
  cost: {
    icon: DollarSign,
    label: 'Cost Reduction',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900',
  },
  compliance: {
    icon: Shield,
    label: 'Compliance',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-100 dark:bg-rose-900',
  },
};

const priorityConfig = {
  high: { label: 'High Priority', color: 'bg-rose-500 text-white' },
  medium: { label: 'Medium', color: 'bg-amber-500 text-white' },
  low: { label: 'Low', color: 'bg-slate-400 text-white' },
};

export function InsightCard({ insight, onApply, onDismiss }: InsightCardProps) {
  const config = typeConfig[insight.type];
  const priority = priorityConfig[insight.priority];
  const Icon = config.icon;

  const hasImpact = insight.impact.costSavings || insight.impact.energySavings || insight.impact.waterSavings;

  // Calculate time ago
  const getTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Card className={cn('overflow-hidden border-l-4', config.borderColor)}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded', priority.color)}>
                  {priority.label}
                </span>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded', config.badgeBg, config.iconColor)}>
                  {config.label}
                </span>
              </div>
              <h3 className="text-[14px] font-semibold">{insight.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {getTimeAgo(insight.createdAt)}
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] text-muted-foreground mb-4 leading-relaxed">
          {insight.description}
        </p>

        {/* Current vs Recommended */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Parameter Change</span>
            {insight.equipment && (
              <span className="text-[11px] text-muted-foreground">{insight.equipment}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground mb-0.5">Current</p>
              <p className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">
                {insight.currentValue} <span className="text-[12px] font-normal text-muted-foreground">{insight.unit}</span>
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground mb-0.5">Recommended</p>
              <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {insight.recommendedValue} <span className="text-[12px] font-normal text-muted-foreground">{insight.unit}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Impact */}
        {hasImpact && (
          <div className="flex items-center gap-4 mb-4">
            {insight.impact.costSavings && insight.impact.costSavings > 0 && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                  ${insight.impact.costSavings.toLocaleString()}/mo
                </span>
              </div>
            )}
            {insight.impact.energySavings && insight.impact.energySavings > 0 && (
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                  {insight.impact.energySavings.toLocaleString()} kWh/mo
                </span>
              </div>
            )}
            {insight.impact.waterSavings && insight.impact.waterSavings > 0 && (
              <div className="flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-[12px] font-semibold text-blue-600 dark:text-blue-400">
                  {insight.impact.waterSavings} m³/mo
                </span>
              </div>
            )}
          </div>
        )}

        {/* Location */}
        <div className="text-[11px] text-muted-foreground mb-4">
          Location: <span className="font-medium text-foreground">{insight.plantName}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex-1" onClick={() => onApply?.(insight.id)}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Apply Recommendation
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDismiss?.(insight.id)}>
            Dismiss
          </Button>
        </div>
      </div>
    </Card>
  );
}
