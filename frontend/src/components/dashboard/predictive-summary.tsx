'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Cpu, AlertTriangle, Clock, ArrowRight, Wrench } from 'lucide-react';
import { getEquipmentNeedingAttention, EquipmentHealth } from '@/data/mock-operations';
import Link from 'next/link';

interface EquipmentItemProps {
  equipment: EquipmentHealth;
  compact?: boolean;
}

function EquipmentItem({ equipment }: EquipmentItemProps) {
  const getStatusStyles = (status: EquipmentHealth['status']) => {
    switch (status) {
      case 'critical':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/30',
          border: 'border-rose-200 dark:border-rose-800',
          badge: 'bg-rose-500 text-white',
          text: 'text-rose-700 dark:text-rose-300',
          progress: 'bg-rose-500',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          badge: 'bg-amber-500 text-white',
          text: 'text-amber-700 dark:text-amber-300',
          progress: 'bg-amber-500',
        };
      case 'attention':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          badge: 'bg-blue-500 text-white',
          text: 'text-blue-700 dark:text-blue-300',
          progress: 'bg-blue-500',
        };
      default:
        return {
          bg: 'bg-muted/50',
          border: 'border-border',
          badge: 'bg-muted text-muted-foreground',
          text: 'text-muted-foreground',
          progress: 'bg-muted-foreground',
        };
    }
  };

  const styles = getStatusStyles(equipment.status);
  const urgencyLabel = equipment.daysRemaining <= 3 ? 'Urgent' : equipment.daysRemaining <= 7 ? 'Soon' : 'Scheduled';

  // Equipment type labels
  const getTypeLabel = (type: EquipmentHealth['type']) => {
    const labels: Record<EquipmentHealth['type'], string> = {
      pump: 'Pump',
      membrane: 'Membrane',
      filter: 'Filter',
      uv: 'UV Unit',
      dosing: 'Dosing',
      blower: 'Blower',
      motor: 'Motor',
    };
    return labels[type];
  };

  return (
    <div className={cn('rounded-lg border p-3', styles.bg, styles.border)}>
      {/* Header: Name and Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{equipment.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{equipment.plantName}</p>
        </div>
        <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase flex-shrink-0', styles.badge)}>
          {urgencyLabel}
        </span>
      </div>

      {/* Time and Type Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className={cn('text-xs font-medium', styles.text)}>
            {equipment.daysRemaining} days remaining
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">{getTypeLabel(equipment.type)}</span>
      </div>

      {/* Health Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Health</span>
          <span className="text-[10px] font-semibold tabular-nums">{equipment.healthScore}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', styles.progress)}
            style={{ width: `${equipment.healthScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function PredictiveSummary() {
  const equipmentNeedingAttention = getEquipmentNeedingAttention().slice(0, 4);
  const criticalCount = equipmentNeedingAttention.filter(e => e.status === 'critical').length;
  const warningCount = equipmentNeedingAttention.filter(e => e.status === 'warning').length;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Cpu className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-semibold">Predictive Maintenance</h3>
          </div>
          <div className="flex items-center gap-3">
            {/* Summary Stats inline */}
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {criticalCount}
                  </span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {warningCount}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {equipmentNeedingAttention.length}
                </span>
              </div>
            </div>
            <Link href="/predictive" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Equipment Grid - Horizontal layout */}
        {equipmentNeedingAttention.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {equipmentNeedingAttention.map((equipment) => (
              <EquipmentItem key={equipment.id} equipment={equipment} compact />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">All Systems Healthy</p>
              <p className="text-[10px] text-muted-foreground">No equipment needs attention</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
