'use client';

import { useState } from 'react';
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
  Clock,
  ThumbsUp,
  ThumbsDown,
  XCircle,
  RotateCcw,
  ExternalLink,
  Activity,
  BarChart3,
} from 'lucide-react';
import { OperationalInsight } from '@/data/mock-operations';
import { InsightDetailModal } from './insight-detail-modal';

type InsightStatus = 'pending' | 'acted' | 'dismissed';
type FeedbackType = 'helpful' | 'not_helpful' | null;
type ModalView = 'monitoring' | 'trends';

interface InsightCardProps {
  insight: OperationalInsight;
  onApply?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onFeedback?: (id: string, feedback: FeedbackType) => void;
  initialStatus?: InsightStatus;
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

export function InsightCard({ insight, onApply, onDismiss, onFeedback, initialStatus = 'pending' }: InsightCardProps) {
  const [status, setStatus] = useState<InsightStatus>(initialStatus);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<ModalView>('monitoring');

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

  const handleApply = () => {
    setStatus('acted');
    onApply?.(insight.id);
  };

  const handleDismiss = () => {
    setStatus('dismissed');
    onDismiss?.(insight.id);
  };

  const handleRestore = () => {
    setStatus('pending');
    setFeedback(null);
  };

  const handleFeedback = (type: FeedbackType) => {
    setFeedback(type);
    onFeedback?.(insight.id, type);
  };

  const openModalWithView = (view: ModalView) => {
    setModalView(view);
    setModalOpen(true);
  };

  // Status-based styling
  const isActed = status === 'acted';
  const isDismissed = status === 'dismissed';
  const isResolved = isActed || isDismissed;

  return (
    <div className={cn(
      'overflow-hidden border-2 border-slate-300 border-l-[3px] bg-white transition-all',
      config.borderColor.replace('border-', 'border-l-'),
      isActed && 'border-l-emerald-500 bg-emerald-50/30',
      isDismissed && 'border-l-slate-400 bg-slate-50/50 opacity-75'
    )}>
      <div className="p-5">
        {/* Status Banner - Show when acted or dismissed */}
        {isResolved && (
          <div className={cn(
            'flex items-center justify-between -mx-5 -mt-5 mb-4 px-5 py-2',
            isActed && 'bg-emerald-100 dark:bg-emerald-900/30',
            isDismissed && 'bg-slate-100 dark:bg-slate-800/50'
          )}>
            <div className="flex items-center gap-2">
              {isActed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Applied
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-slate-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Dismissed
                  </span>
                </>
              )}
            </div>
            <button
              onClick={handleRestore}
              className="h-6 px-2 flex items-center gap-1 text-[10px] font-medium text-slate-600 hover:bg-white/50 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className={cn('p-2', config.bgColor, isDismissed && 'opacity-60')}>
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {!isResolved && (
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded', priority.color)}>
                    {priority.label}
                  </span>
                )}
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded', config.badgeBg, config.iconColor, isDismissed && 'opacity-60')}>
                  {config.label}
                </span>
              </div>
              <h3 className={cn('text-[14px] font-semibold', isDismissed && 'text-muted-foreground')}>{insight.title}</h3>
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
        <div className="bg-slate-50 border border-slate-200 p-3 mb-4">
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

        {/* Actions - Different based on status */}
        {!isResolved ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Apply Recommendation
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Dismiss
            </button>
          </div>
        ) : (
          /* Feedback Section - Show after action taken */
          <div className="border-t border-slate-200 pt-4 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Was this insight helpful?</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleFeedback('helpful')}
                  className={cn(
                    'h-7 px-2 flex items-center justify-center transition-colors',
                    feedback === 'helpful'
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 bg-white hover:bg-slate-50'
                  )}
                >
                  <ThumbsUp className={cn('h-3.5 w-3.5', feedback !== 'helpful' && 'text-slate-500')} />
                </button>
                <button
                  onClick={() => handleFeedback('not_helpful')}
                  className={cn(
                    'h-7 px-2 flex items-center justify-center transition-colors',
                    feedback === 'not_helpful'
                      ? 'bg-slate-600 text-white'
                      : 'border border-slate-200 bg-white hover:bg-slate-50'
                  )}
                >
                  <ThumbsDown className={cn('h-3.5 w-3.5', feedback !== 'not_helpful' && 'text-slate-500')} />
                </button>
              </div>
            </div>
            {feedback && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {feedback === 'helpful'
                  ? 'Thanks! We\'ll use this to improve recommendations.'
                  : 'Thanks for the feedback. We\'ll refine our suggestions.'}
              </p>
            )}

            {/* Quick Links */}
            {isActed && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => openModalWithView('monitoring')}
                  className="flex-1 h-7 flex items-center justify-center gap-1 text-[10px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Activity className="h-3 w-3" />
                  View in Monitoring
                </button>
                <button
                  onClick={() => openModalWithView('trends')}
                  className="flex-1 h-7 flex items-center justify-center gap-1 text-[10px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <BarChart3 className="h-3 w-3" />
                  View in Trends
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <InsightDetailModal
        insight={insight}
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultView={modalView}
      />
    </div>
  );
}
