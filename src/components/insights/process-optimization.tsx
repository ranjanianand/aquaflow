'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Workflow,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { mockProcessEfficiency, ProcessEfficiency } from '@/data/mock-operations';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProcessCardProps {
  process: ProcessEfficiency;
}

function ProcessCard({ process }: ProcessCardProps) {
  const getStatusConfig = (status: ProcessEfficiency['status']) => {
    switch (status) {
      case 'optimal':
        return {
          icon: CheckCircle2,
          label: 'Optimal',
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          barColor: 'bg-emerald-500',
        };
      case 'good':
        return {
          icon: CheckCircle2,
          label: 'Good',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
          barColor: 'bg-blue-500',
        };
      case 'attention':
        return {
          icon: AlertTriangle,
          label: 'Needs Attention',
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950/30',
          borderColor: 'border-amber-200 dark:border-amber-800',
          barColor: 'bg-amber-500',
        };
      case 'critical':
        return {
          icon: AlertCircle,
          label: 'Critical',
          color: 'text-rose-600 dark:text-rose-400',
          bgColor: 'bg-rose-50 dark:bg-rose-950/30',
          borderColor: 'border-rose-200 dark:border-rose-800',
          barColor: 'bg-rose-500',
        };
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

  const getProcessDescription = (type: ProcessEfficiency['processType']) => {
    const descriptions: Record<ProcessEfficiency['processType'], string> = {
      clarification: 'Coagulation, flocculation, and sedimentation processes',
      filtration: 'Rapid sand, membrane (MF/UF/NF/RO) filtration',
      disinfection: 'Chlorination, UV, and ozone treatment',
      sludge: 'Thickening, dewatering, and disposal',
    };
    return descriptions[type];
  };

  const config = getStatusConfig(process.status);
  const StatusIcon = config.icon;
  const difference = process.efficiency - process.target;

  return (
    <Card className={cn('overflow-hidden border-l-4', config.borderColor)}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('h-4 w-4', config.color)} />
            <h4 className="text-[13px] font-semibold">{getProcessLabel(process.processType)}</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">{getProcessDescription(process.processType)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded', config.bgColor, config.color)}>
            {config.label}
          </span>
        </div>

        {/* Efficiency Score */}
        <div className="flex items-center gap-4 mb-3">
          <div>
            <p className="text-2xl font-bold tabular-nums">{process.efficiency}%</p>
            <p className="text-[10px] text-muted-foreground">Efficiency</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-semibold tabular-nums text-muted-foreground">{process.target}%</p>
            <p className="text-[10px] text-muted-foreground">Target</p>
          </div>
          <div className="flex-1 text-right">
            <p className={cn(
              'text-sm font-semibold tabular-nums',
              difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            )}>
              {difference >= 0 ? '+' : ''}{difference}%
            </p>
            <p className="text-[10px] text-muted-foreground">vs Target</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
            style={{ left: `${process.target}%` }}
          />
          <div
            className={cn('h-full rounded-full transition-all duration-500', config.barColor)}
            style={{ width: `${process.efficiency}%` }}
          />
        </div>

        {/* Parameters */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Key Parameters</p>
          {process.parameters.map((param) => {
            const paramDiff = param.current - param.optimal;
            const isGood = Math.abs(paramDiff) <= param.optimal * 0.1; // Within 10%

            return (
              <div key={param.name} className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">{param.name}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-medium tabular-nums',
                    isGood ? 'text-foreground' : 'text-amber-600 dark:text-amber-400'
                  )}>
                    {param.current} {param.unit}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground tabular-nums">
                    {param.optimal} {param.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export function ProcessOptimization() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-[14px] font-semibold">Process Optimization</h3>
        </div>
        <p className="text-[12px] text-muted-foreground mt-1">
          Multi-process efficiency analysis based on domain expertise
        </p>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockProcessEfficiency.map((process) => (
            <ProcessCard key={process.processType} process={process} />
          ))}
        </div>
      </div>
    </Card>
  );
}
