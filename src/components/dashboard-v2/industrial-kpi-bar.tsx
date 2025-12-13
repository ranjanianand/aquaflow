'use client';

import { cn } from '@/lib/utils';
import {
  Building2,
  Cpu,
  AlertTriangle,
  Droplets,
  Activity,
  Thermometer,
  Gauge
} from 'lucide-react';

interface KPIItem {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
  icon: React.ElementType;
}

const kpiData: KPIItem[] = [
  { label: 'PLANTS', value: '6/6', status: 'normal', icon: Building2 },
  { label: 'SENSORS', value: 142, status: 'normal', icon: Cpu },
  { label: 'ALERTS', value: 3, status: 'warning', icon: AlertTriangle },
  { label: 'FLOW RATE', value: '2,847', unit: 'm³/h', status: 'normal', icon: Droplets },
  { label: 'AVG pH', value: '7.2', status: 'normal', icon: Activity },
  { label: 'TEMP', value: '24.5', unit: '°C', status: 'normal', icon: Thermometer },
  { label: 'PRESSURE', value: '4.2', unit: 'bar', status: 'normal', icon: Gauge },
];

export function IndustrialKPIBar() {
  return (
    <div className="bg-white border-b-2 border-slate-200">
      <div className="flex items-stretch divide-x divide-slate-200 overflow-x-auto">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={cn(
                'flex-1 min-w-[120px] px-4 py-3 flex items-center gap-3',
                'hover:bg-slate-50 transition-colors cursor-pointer'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  kpi.status === 'critical' && 'text-red-600',
                  kpi.status === 'warning' && 'text-amber-600',
                  kpi.status === 'normal' && 'text-slate-500'
                )}
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">
                  {kpi.label}
                </p>
                <p className={cn(
                  'text-lg font-bold tabular-nums leading-none',
                  kpi.status === 'critical' && 'text-red-600',
                  kpi.status === 'warning' && 'text-amber-600',
                  kpi.status === 'normal' && 'text-slate-900'
                )}>
                  {kpi.value}
                  {kpi.unit && (
                    <span className="text-xs font-medium text-slate-400 ml-1">
                      {kpi.unit}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
