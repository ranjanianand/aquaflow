'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Plant } from '@/types';
import { getSensorsByPlant } from '@/data/mock-sensors';
import { StatusBadge } from '@/components/shared/status-badge';
import { MoreVertical } from 'lucide-react';

interface PlantCardProps {
  plant: Plant;
}

export function PlantCard({ plant }: PlantCardProps) {
  const sensors = getSensorsByPlant(plant.id);

  // Get representative metrics
  const phSensor = sensors.find((s) => s.type === 'pH');
  const flowSensor = sensors.find((s) => s.type === 'flow');
  const turbSensor = sensors.find((s) => s.type === 'turbidity');
  const tempSensor = sensors.find((s) => s.type === 'temperature');

  const statusVariant = plant.status === 'online' ? 'success' : plant.status === 'warning' ? 'warning' : 'danger';
  const statusLabel = plant.status === 'online' ? 'Online' : plant.status === 'warning' ? 'Warning' : 'Offline';

  return (
    <Link href={`/monitoring?plant=${plant.id}`}>
      <div className="rounded-lg border border-border bg-card transition-all duration-150 hover:border-border/80 hover:shadow-sm">
        {/* Header with status dot, name, badge, and menu */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                'h-2 w-2 rounded-full flex-shrink-0',
                plant.status === 'online' && 'bg-[var(--success)]',
                plant.status === 'warning' && 'bg-[var(--warning)]',
                plant.status === 'offline' && 'bg-[var(--danger)]'
              )}
            />
            <h4 className="text-[13px] font-medium truncate">{plant.name}</h4>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant={statusVariant} size="sm">
              {statusLabel}
            </StatusBadge>
            <button className="p-1 rounded hover:bg-muted/50 text-muted-foreground">
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Metrics row - styled like s2.pdf data grid */}
        <div className="grid grid-cols-4 divide-x divide-border">
          <MetricCell label="pH" value={phSensor?.currentValue.toFixed(1) || '-'} />
          <MetricCell label="Flow" value={flowSensor?.currentValue.toFixed(0) || '-'} unit="m³/h" />
          <MetricCell label="Turb" value={turbSensor?.currentValue.toFixed(1) || '-'} unit="NTU" />
          <MetricCell label="Temp" value={tempSensor?.currentValue.toFixed(0) || '-'} unit="°C" />
        </div>
      </div>
    </Link>
  );
}

interface MetricCellProps {
  label: string;
  value: string;
  unit?: string;
}

function MetricCell({ label, value, unit }: MetricCellProps) {
  return (
    <div className="px-3 py-2.5 text-center">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-[13px] font-semibold tabular-nums">
        {value}
        {unit && <span className="text-[9px] font-normal text-muted-foreground ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}
