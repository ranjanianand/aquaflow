'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Activity, Zap } from 'lucide-react';

interface RiskItem {
  id: string;
  name: string;
  likelihood: 1 | 2 | 3 | 4 | 5; // 1=Rare, 5=Almost Certain
  impact: 1 | 2 | 3 | 4 | 5; // 1=Negligible, 5=Catastrophic
  status: 'healthy' | 'watch' | 'warning' | 'critical';
}

interface RiskMatrixProps {
  items?: RiskItem[];
  className?: string;
}

// Default items based on predictions
const defaultItems: RiskItem[] = [
  { id: '1', name: 'RO Membrane', likelihood: 3, impact: 3, status: 'watch' },
  { id: '2', name: 'Feed Pump', likelihood: 1, impact: 2, status: 'healthy' },
  { id: '3', name: 'pH Sensors', likelihood: 4, impact: 3, status: 'warning' },
  { id: '4', name: 'Clarifier Motor', likelihood: 5, impact: 4, status: 'critical' },
  { id: '5', name: 'Dosing Pump', likelihood: 2, impact: 2, status: 'healthy' },
  { id: '6', name: 'Filter Media', likelihood: 3, impact: 2, status: 'watch' },
];

// Risk level calculation: likelihood * impact
const getRiskLevel = (likelihood: number, impact: number): 'low' | 'medium' | 'high' | 'critical' => {
  const score = likelihood * impact;
  if (score <= 4) return 'low';
  if (score <= 9) return 'medium';
  if (score <= 16) return 'high';
  return 'critical';
};

const cellColors: Record<string, string> = {
  low: 'bg-emerald-100 dark:bg-emerald-900/30',
  medium: 'bg-amber-100 dark:bg-amber-900/30',
  high: 'bg-orange-200 dark:bg-orange-900/40',
  critical: 'bg-red-200 dark:bg-red-900/40',
};

const statusIcons: Record<string, React.ReactNode> = {
  healthy: <CheckCircle className="h-3 w-3 text-emerald-600" />,
  watch: <Activity className="h-3 w-3 text-blue-600" />,
  warning: <AlertTriangle className="h-3 w-3 text-amber-600" />,
  critical: <Zap className="h-3 w-3 text-red-600" />,
};

export function RiskMatrix({ items = defaultItems, className }: RiskMatrixProps) {
  const likelihoodLabels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Certain'];
  const impactLabels = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

  // Group items by cell position
  const getItemsInCell = (likelihood: number, impact: number) => {
    return items.filter(item => item.likelihood === likelihood && item.impact === impact);
  };

  return (
    <div className={cn('border-2 border-slate-300 bg-white overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-slate-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
          Risk Assessment Matrix
        </span>
        <span className="text-[10px] text-slate-400 ml-auto">Likelihood × Impact</span>
      </div>

      <div className="p-4">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-[10px]">
          <span className="font-bold text-slate-500 uppercase">Risk Level:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-100 border border-emerald-300" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-100 border border-amber-300" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-200 border border-orange-300" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-200 border border-red-300" />
            <span>Critical</span>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="flex">
          {/* Y-axis label */}
          <div className="flex flex-col justify-center pr-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 transform -rotate-90 whitespace-nowrap origin-center">
              Impact →
            </span>
          </div>

          <div className="flex-1">
            {/* Matrix cells - Impact rows (5 to 1, top to bottom) */}
            <div className="grid grid-cols-6 gap-0.5">
              {/* Column headers (Likelihood) */}
              <div className="h-8" /> {/* Empty corner */}
              {likelihoodLabels.map((label, i) => (
                <div key={i} className="h-8 flex items-center justify-center">
                  <span className="text-[8px] font-bold uppercase text-slate-500">{label}</span>
                </div>
              ))}

              {/* Matrix rows */}
              {[5, 4, 3, 2, 1].map((impactLevel) => (
                <>
                  {/* Row header */}
                  <div key={`impact-${impactLevel}`} className="h-16 flex items-center justify-end pr-2">
                    <span className="text-[8px] font-bold uppercase text-slate-500 text-right">
                      {impactLabels[impactLevel - 1]}
                    </span>
                  </div>

                  {/* Cells */}
                  {[1, 2, 3, 4, 5].map((likelihoodLevel) => {
                    const riskLevel = getRiskLevel(likelihoodLevel, impactLevel);
                    const cellItems = getItemsInCell(likelihoodLevel, impactLevel);

                    return (
                      <div
                        key={`cell-${likelihoodLevel}-${impactLevel}`}
                        className={cn(
                          'h-16 border border-slate-200 p-1 relative',
                          cellColors[riskLevel],
                          cellItems.length > 0 && 'ring-1 ring-slate-400'
                        )}
                      >
                        {cellItems.length > 0 && (
                          <div className="flex flex-col gap-0.5 h-full overflow-hidden">
                            {cellItems.slice(0, 2).map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-1 bg-white/80 rounded px-1 py-0.5"
                                title={item.name}
                              >
                                {statusIcons[item.status]}
                                <span className="text-[8px] font-medium truncate">
                                  {item.name}
                                </span>
                              </div>
                            ))}
                            {cellItems.length > 2 && (
                              <span className="text-[8px] text-slate-500 pl-1">
                                +{cellItems.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>

            {/* X-axis label */}
            <div className="text-center mt-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Likelihood →
              </span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <div className="text-lg font-bold font-mono text-emerald-600">
              {items.filter(i => getRiskLevel(i.likelihood, i.impact) === 'low').length}
            </div>
            <div className="text-[9px] text-slate-500 uppercase">Low Risk</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold font-mono text-amber-600">
              {items.filter(i => getRiskLevel(i.likelihood, i.impact) === 'medium').length}
            </div>
            <div className="text-[9px] text-slate-500 uppercase">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold font-mono text-orange-600">
              {items.filter(i => getRiskLevel(i.likelihood, i.impact) === 'high').length}
            </div>
            <div className="text-[9px] text-slate-500 uppercase">High</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold font-mono text-red-600">
              {items.filter(i => getRiskLevel(i.likelihood, i.impact) === 'critical').length}
            </div>
            <div className="text-[9px] text-slate-500 uppercase">Critical</div>
          </div>
        </div>
      </div>
    </div>
  );
}
