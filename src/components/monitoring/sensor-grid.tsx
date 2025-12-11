'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SensorCard } from './sensor-card';
import { LiveIndicator } from '@/components/shared/live-indicator';
import { Sensor, Plant } from '@/types';
import { Download, RefreshCw, Activity, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SensorGridProps {
  plant: Plant | null;
  sensors: Sensor[];
  onRefresh?: () => void;
}

export function SensorGrid({ plant, sensors, onRefresh }: SensorGridProps) {
  if (!plant) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <Activity className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">Select a plant to view sensors</p>
      </Card>
    );
  }

  // Calculate stats
  const normalCount = sensors.filter(s => s.status === 'normal').length;
  const warningCount = sensors.filter(s => s.status === 'warning').length;
  const criticalCount = sensors.filter(s => s.status === 'critical').length;
  const healthPercentage = sensors.length > 0
    ? Math.round((normalCount / sensors.length) * 100)
    : 0;

  // Group sensors by type category
  const qualitySensors = sensors.filter(s => ['pH', 'turbidity', 'chlorine', 'DO', 'ORP', 'conductivity'].includes(s.type));
  const processSensors = sensors.filter(s => ['flow', 'pressure', 'temperature', 'level'].includes(s.type));

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between bg-muted/50 px-6 py-4">
          <div className="flex items-center gap-4">
            <h3 className="text-base font-semibold">{plant.name}</h3>
            <LiveIndicator />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      <div>
          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total Sensors</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{sensors.length}</p>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Normal</span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-emerald-600">{normalCount}</p>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Warning</span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-amber-600">{warningCount}</p>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Critical</span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-rose-600">{criticalCount}</p>
            </div>
          </div>

          {/* Health Bar */}
          <div className="mb-6 bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Plant Health Score</span>
              <span className="text-sm font-semibold tabular-nums">{healthPercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  healthPercentage >= 80 ? 'bg-emerald-400' :
                  healthPercentage >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                )}
                style={{ width: `${healthPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                  <span className="text-[10px] text-muted-foreground">{normalCount} Normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                  <span className="text-[10px] text-muted-foreground">{warningCount} Warning</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />
                  <span className="text-[10px] text-muted-foreground">{criticalCount} Critical</span>
                </div>
              </div>
            </div>
          </div>

          {/* Water Quality Sensors */}
          {qualitySensors.length > 0 && (
            <div className="mb-6">
              <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Water Quality Parameters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {qualitySensors.map((sensor) => (
                  <SensorCard key={sensor.id} sensor={sensor} />
                ))}
              </div>
            </div>
          )}

          {/* Process Sensors */}
          {processSensors.length > 0 && (
            <div>
              <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Process Parameters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {processSensors.map((sensor) => (
                  <SensorCard key={sensor.id} sensor={sensor} />
                ))}
              </div>
            </div>
          )}

          {sensors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">No sensors available for this plant</p>
            </div>
          )}
      </div>
    </div>
  );
}
