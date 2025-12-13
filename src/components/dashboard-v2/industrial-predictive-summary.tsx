'use client';

import { cn } from '@/lib/utils';
import { Cpu, Clock, AlertTriangle, Wrench, ChevronRight } from 'lucide-react';

interface EquipmentHealth {
  id: string;
  name: string;
  plantName: string;
  type: 'pump' | 'membrane' | 'filter' | 'uv' | 'dosing' | 'blower' | 'motor';
  status: 'critical' | 'warning' | 'attention' | 'good';
  healthScore: number;
  daysRemaining: number;
}

const equipmentData: EquipmentHealth[] = [
  {
    id: '1',
    name: 'Primary Pump P-101',
    plantName: 'Plant A',
    type: 'pump',
    status: 'critical',
    healthScore: 23,
    daysRemaining: 2,
  },
  {
    id: '2',
    name: 'RO Membrane M-201',
    plantName: 'Plant B',
    type: 'membrane',
    status: 'warning',
    healthScore: 45,
    daysRemaining: 5,
  },
  {
    id: '3',
    name: 'UV Unit UV-301',
    plantName: 'Plant C',
    type: 'uv',
    status: 'warning',
    healthScore: 52,
    daysRemaining: 8,
  },
  {
    id: '4',
    name: 'Dosing Pump D-102',
    plantName: 'Plant A',
    type: 'dosing',
    status: 'attention',
    healthScore: 68,
    daysRemaining: 14,
  },
];

function EquipmentRow({ equipment }: { equipment: EquipmentHealth }) {
  const urgencyLabel = equipment.daysRemaining <= 3 ? 'URGENT' : equipment.daysRemaining <= 7 ? 'SOON' : 'SCHED';

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 border-b border-slate-200 last:border-b-0',
      'hover:bg-slate-50 transition-colors cursor-pointer',
      equipment.status === 'critical' && 'border-l-[3px] border-l-red-500',
      equipment.status === 'warning' && 'border-l-[3px] border-l-amber-500',
      equipment.status === 'attention' && 'border-l-[3px] border-l-blue-500'
    )}>
      {/* Icon */}
      <Wrench className={cn(
        'h-4 w-4 flex-shrink-0',
        equipment.status === 'critical' && 'text-red-600',
        equipment.status === 'warning' && 'text-amber-600',
        equipment.status === 'attention' && 'text-blue-600'
      )} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700 truncate">{equipment.name}</span>
          <span className={cn(
            'text-[9px] font-bold px-1.5 py-0.5 flex-shrink-0',
            equipment.status === 'critical' && 'bg-red-100 text-red-700',
            equipment.status === 'warning' && 'bg-amber-100 text-amber-700',
            equipment.status === 'attention' && 'bg-blue-100 text-blue-700'
          )}>
            {urgencyLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-slate-500">{equipment.plantName}</span>
          <span className="text-[10px] text-slate-400">|</span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {equipment.daysRemaining}d
          </span>
          <span className="text-[10px] text-slate-400">|</span>
          <span className={cn(
            'text-[10px] font-mono font-bold',
            equipment.healthScore < 30 && 'text-red-600',
            equipment.healthScore >= 30 && equipment.healthScore < 60 && 'text-amber-600',
            equipment.healthScore >= 60 && 'text-blue-600'
          )}>
            {equipment.healthScore}%
          </span>
        </div>
      </div>

      {/* Health Bar - compact */}
      <div className="w-16 flex-shrink-0">
        <div className="h-1.5 bg-slate-200 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all',
              equipment.status === 'critical' && 'bg-red-500',
              equipment.status === 'warning' && 'bg-amber-500',
              equipment.status === 'attention' && 'bg-blue-500'
            )}
            style={{ width: `${equipment.healthScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function IndustrialPredictiveSummary() {
  const criticalCount = equipmentData.filter(e => e.status === 'critical').length;
  const warningCount = equipmentData.filter(e => e.status === 'warning').length;

  return (
    <div className="border-2 border-slate-300 overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="h-4 w-4 text-slate-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Predictive Maintenance
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {criticalCount > 0 && (
            <span className="text-red-600 font-bold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-amber-600 font-bold">{warningCount} WARN</span>
          )}
          <span className="text-slate-500">{equipmentData.length} total</span>
        </div>
      </div>

      {/* Equipment List */}
      <div className="max-h-[200px] overflow-y-auto">
        {equipmentData.map((equipment) => (
          <EquipmentRow key={equipment.id} equipment={equipment} />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-4 py-2 border-t-2 border-slate-300 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          Next: {equipmentData[0]?.name} in {equipmentData[0]?.daysRemaining}d
        </span>
        <button className="text-[10px] text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wide flex items-center gap-1">
          View All
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
