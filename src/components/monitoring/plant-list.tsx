'use client';

import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plant } from '@/types';
import { cn } from '@/lib/utils';
import { Building2, MapPin, Activity } from 'lucide-react';

interface PlantListProps {
  plants: Plant[];
  selectedPlantId: string | null;
  onSelectPlant: (plantId: string) => void;
}

// Mild status colors
const statusColors = {
  online: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  warning: {
    dot: 'bg-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  offline: {
    dot: 'bg-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
  },
};

const statusLabel: Record<Plant['status'], string> = {
  online: 'Online',
  warning: 'Warning',
  offline: 'Offline',
};

export function PlantList({ plants, selectedPlantId, onSelectPlant }: PlantListProps) {
  // Count by status
  const onlineCount = plants.filter(p => p.status === 'online').length;
  const warningCount = plants.filter(p => p.status === 'warning').length;
  const offlineCount = plants.filter(p => p.status === 'offline').length;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-muted/50 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Plants ({plants.length})</h2>
        </div>
        {/* Mini status summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-muted-foreground">{onlineCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-[10px] text-muted-foreground">{warningCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="text-[10px] text-muted-foreground">{offlineCount}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y">
          {plants.map((plant) => {
            const colors = statusColors[plant.status];
            const isSelected = selectedPlantId === plant.id;

            return (
              <button
                key={plant.id}
                onClick={() => onSelectPlant(plant.id)}
                className={cn(
                  'flex w-full items-start gap-3 px-5 py-4 text-left transition-all hover:bg-muted/50',
                  isSelected && 'bg-muted/80 border-l-[3px] border-l-blue-500'
                )}
              >
                {/* Status indicator */}
                <div className="mt-1">
                  <span className={cn(
                    'flex h-2.5 w-2.5 rounded-full',
                    colors.dot,
                    plant.status === 'offline' && 'animate-pulse'
                  )} />
                </div>

                {/* Plant info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold truncate">{plant.name}</h4>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[9px] font-medium',
                      colors.bg,
                      colors.text
                    )}>
                      {statusLabel[plant.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{plant.location}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    <span>{plant.sensorCount} sensors</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
