'use client';

import { cn } from '@/lib/utils';
import { useKpis, useLiveKpis } from '@/lib/api/hooks';
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

// A fixed array stood here: 6/6 plants, 142 sensors, 3 alerts, 2,847 m3/h.
// None of it moved, and it sat above a sensor grid reading the same plant.
//
// "—" is shown where a parameter has no reporting sensor. Zero would state
// that the plant measured nothing, which is a different claim from having
// nothing to measure it with.
const dash = '—';

export function IndustrialKPIBar() {
  const { data: kpis } = useKpis();
  const { data: live } = useLiveKpis();

  const param = (
    key: string, label: string, unit: string | undefined, icon: React.ElementType,
  ): KPIItem => {
    const p = live?.[key];
    return {
      label,
      value: p ? p.value.toLocaleString() : dash,
      unit: p ? unit : undefined,
      status: p?.status ?? 'normal',
      icon,
    };
  };

  const kpiData: KPIItem[] = [
    {
      label: 'PLANTS',
      value: kpis ? `${kpis.plantsOnline}/${kpis.plantsTotal}` : dash,
      // Amber when some plants are silent, red when none are reporting.
      status: !kpis ? 'normal'
        : kpis.plantsOnline === kpis.plantsTotal ? 'normal'
        : kpis.plantsOnline === 0 ? 'critical' : 'warning',
      icon: Building2,
    },
    { label: 'SENSORS', value: kpis?.sensorsTotal ?? dash, status: 'normal', icon: Cpu },
    {
      label: 'ALERTS',
      value: kpis ? kpis.alertsCritical + kpis.alertsWarning : dash,
      status: !kpis ? 'normal'
        : kpis.alertsCritical ? 'critical'
        : kpis.alertsWarning ? 'warning' : 'normal',
      icon: AlertTriangle,
    },
    param('flow', 'FLOW RATE', 'm³/h', Droplets),
    param('pH', 'AVG pH', undefined, Activity),
    param('temperature', 'TEMP', '°C', Thermometer),
    param('pressure', 'PRESSURE', 'bar', Gauge),
  ];

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
