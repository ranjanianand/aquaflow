'use client';

import { cn } from '@/lib/utils';
import {
  Workflow,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Info,
  Gauge
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
          label: 'OPTIMAL',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
          borderColor: 'border-l-emerald-500',
          barColor: 'bg-emerald-500',
        };
      case 'good':
        return {
          icon: CheckCircle2,
          label: 'GOOD',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-l-blue-500',
          barColor: 'bg-blue-500',
        };
      case 'attention':
        return {
          icon: AlertTriangle,
          label: 'ATTENTION',
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          borderColor: 'border-l-amber-500',
          barColor: 'bg-amber-500',
        };
      case 'critical':
        return {
          icon: AlertCircle,
          label: 'CRITICAL',
          color: 'text-rose-600',
          bgColor: 'bg-rose-100',
          borderColor: 'border-l-rose-500',
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
    <div className={cn('border-2 border-slate-300 bg-white border-l-[3px]', config.borderColor)}>
      {/* Header */}
      <div className="bg-slate-50 px-3 py-2 border-b-2 border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('h-3.5 w-3.5', config.color)} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{getProcessLabel(process.processType)}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-[10px] max-w-[200px]">{getProcessDescription(process.processType)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className={cn('text-[9px] font-bold uppercase px-2 py-0.5', config.bgColor, config.color)}>
          {config.label}
        </span>
      </div>

      <div className="p-3">
        {/* Efficiency Score */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-slate-800">{process.efficiency}</span>
              <span className="text-sm font-bold text-slate-500">%</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Efficiency</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-slate-500">{process.target}</span>
              <span className="text-sm font-bold text-slate-400">%</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Target</span>
          </div>
          <div className="flex-1 text-right">
            <span className={cn(
              'text-sm font-bold font-mono',
              difference >= 0 ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {difference >= 0 ? '+' : ''}{difference}%
            </span>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">vs Target</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-slate-200 overflow-hidden mb-3">
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-600 z-10"
            style={{ left: `${process.target}%` }}
          />
          <div
            className={cn('h-full transition-all duration-500', config.barColor)}
            style={{ width: `${process.efficiency}%` }}
          />
        </div>

        {/* Parameters */}
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">Key Parameters</p>
          {process.parameters.map((param) => {
            const paramDiff = param.current - param.optimal;
            const isGood = Math.abs(paramDiff) <= param.optimal * 0.1; // Within 10%

            return (
              <div key={param.name} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">{param.name}</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className={cn(
                    'font-bold',
                    isGood ? 'text-slate-800' : 'text-amber-600'
                  )}>
                    {param.current}
                  </span>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-500">
                    {param.optimal} {param.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ProcessOptimization() {
  return (
    <div className="border-2 border-slate-300 bg-white overflow-hidden">
      <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-slate-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Process Optimization</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[9px] text-slate-500">Multi-process efficiency analysis</span>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {mockProcessEfficiency.map((process) => (
            <ProcessCard key={process.processType} process={process} />
          ))}
        </div>
      </div>
    </div>
  );
}
