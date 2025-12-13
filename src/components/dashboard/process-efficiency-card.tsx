'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Workflow, ArrowRight, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { mockProcessEfficiency, ProcessEfficiency } from '@/data/mock-operations';
import Link from 'next/link';

interface ProcessBarProps {
  process: ProcessEfficiency;
}

function ProcessBar({ process }: ProcessBarProps) {
  const getStatusIcon = (status: ProcessEfficiency['status']) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'good':
        return <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />;
      case 'attention':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case 'critical':
        return <AlertCircle className="h-3.5 w-3.5 text-rose-500" />;
    }
  };

  const getBarColor = (status: ProcessEfficiency['status']) => {
    switch (status) {
      case 'optimal':
        return 'bg-emerald-500';
      case 'good':
        return 'bg-blue-500';
      case 'attention':
        return 'bg-amber-500';
      case 'critical':
        return 'bg-rose-500';
    }
  };

  const getProcessLabel = (type: ProcessEfficiency['processType']) => {
    const labels: Record<ProcessEfficiency['processType'], string> = {
      clarification: 'Clarification',
      filtration: 'Filtration',
      disinfection: 'Disinfection',
      sludge: 'Sludge Handling',
    };
    return labels[type];
  };

  const difference = process.efficiency - process.target;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {getStatusIcon(process.status)}
          <span className="text-xs font-medium">{getProcessLabel(process.processType)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-[10px] font-medium',
            difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          )}>
            {difference >= 0 ? '+' : ''}{difference}%
          </span>
          <span className="text-xs font-semibold tabular-nums">{process.efficiency}%</span>
        </div>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        {/* Target marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/30 z-10"
          style={{ left: `${process.target}%` }}
        />
        {/* Progress bar */}
        <div
          className={cn('h-full rounded-full transition-all duration-500', getBarColor(process.status))}
          style={{ width: `${process.efficiency}%` }}
        />
      </div>
    </div>
  );
}

export function ProcessEfficiencyCard() {
  const overallEfficiency = Math.round(
    mockProcessEfficiency.reduce((acc, p) => acc + p.efficiency, 0) / mockProcessEfficiency.length
  );

  const optimalCount = mockProcessEfficiency.filter(p => p.status === 'optimal' || p.status === 'good').length;
  const attentionCount = mockProcessEfficiency.filter(p => p.status === 'attention' || p.status === 'critical').length;

  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Workflow className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-semibold">Process Efficiency</h3>
          </div>
          <Link href="/insights" className="text-xs text-primary hover:underline flex items-center gap-0.5">
            Details
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-4 mb-4">
          <div>
            <p className="text-2xl font-bold tabular-nums">{overallEfficiency}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Overall</p>
          </div>
          <div className="flex-1 flex items-center justify-end gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{optimalCount}</p>
              <p className="text-[10px] text-muted-foreground">Optimal</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{attentionCount}</p>
              <p className="text-[10px] text-muted-foreground">Attention</p>
            </div>
          </div>
        </div>

        {/* Process Bars */}
        <div className="space-y-3">
          {mockProcessEfficiency.map((process) => (
            <ProcessBar key={process.processType} process={process} />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-3 bg-foreground/30" />
            <span className="text-[10px] text-muted-foreground">Target</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
