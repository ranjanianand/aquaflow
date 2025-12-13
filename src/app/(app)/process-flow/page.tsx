'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge, StatusDot } from '@/components/shared/status-badge';
import { FlowCanvas } from '@/components/process-flow/flow-canvas';
import { EquipmentNodeData, EquipmentType } from '@/components/process-flow/equipment-node';
import {
  Download,
  Droplets,
  Gauge,
  Cylinder,
  Wind,
  Layers,
  Circle,
  Filter,
  Activity,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockPlants } from '@/data/mock-plants';
import { Node } from '@xyflow/react';
import Link from 'next/link';

// Valve icon SVG component
const ValveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v4M12 17v4" />
    <rect x="6" y="7" width="12" height="10" rx="1" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EquipmentIcon: React.FC<{ type: EquipmentType; className?: string }> = ({ type, className }) => {
  switch (type) {
    case 'inlet':
      return <Droplets className={className} />;
    case 'screen':
      return <Filter className={className} />;
    case 'tank':
      return <Cylinder className={className} />;
    case 'pump':
      return <Wind className={className} />;
    case 'filter':
      return <Layers className={className} />;
    case 'chemical':
      return <Circle className={className} />;
    case 'sensor':
      return <Gauge className={className} />;
    case 'outlet':
      return <ArrowRight className={className} />;
    case 'valve':
      return <ValveIcon className={className} />;
    default:
      return <Circle className={className} />;
  }
};

export default function ProcessFlowPage() {
  const [selectedPlant, setSelectedPlant] = useState('plant-1');
  const [selectedEquipment, setSelectedEquipment] = useState<Node<EquipmentNodeData> | null>(null);

  const handleNodeSelect = (node: Node<EquipmentNodeData> | null) => {
    setSelectedEquipment(node);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Process Flow Diagram"
        subtitle="Interactive P&ID visualization with drag, drop, and connect"
      />

      <div className="p-4">
        {/* Process Flow Canvas - Full Height */}
        <Card className="overflow-hidden">
          {/* Compact Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <div className="flex items-center gap-2 text-[12px]">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-medium">Live</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Water Treatment Process</span>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                <SelectTrigger className="w-[180px] h-8 text-[12px]">
                  <SelectValue placeholder="Select plant" />
                </SelectTrigger>
                <SelectContent>
                  {mockPlants.map((plant) => (
                    <SelectItem key={plant.id} value={plant.id}>
                      <div className="flex items-center gap-2">
                        <StatusDot
                          status={plant.status === 'online' ? 'normal' : plant.status === 'warning' ? 'warning' : 'critical'}
                        />
                        {plant.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="h-8 text-[12px]">
                <Download className="h-3.5 w-3.5 mr-1" />
                Export
              </Button>
            </div>
          </div>

          {/* Canvas - Maximized Height */}
          <div style={{ height: 'calc(100vh - 160px)', minHeight: '600px' }}>
            <FlowCanvas onNodeSelect={handleNodeSelect} />
          </div>
        </Card>
      </div>

      {/* Equipment Detail Panel */}
      <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
        <DialogContent className="max-w-md">
          {selectedEquipment && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg',
                    selectedEquipment.data.status === 'running' ? 'bg-emerald-500 text-white' :
                    selectedEquipment.data.status === 'warning' ? 'bg-amber-500 text-white' :
                    selectedEquipment.data.status === 'offline' ? 'bg-rose-500 text-white' : 'bg-gray-400 text-white'
                  )}>
                    <EquipmentIcon type={selectedEquipment.data.type} className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      {selectedEquipment.data.label}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge
                        variant={
                          selectedEquipment.data.status === 'running' ? 'success' :
                          selectedEquipment.data.status === 'warning' ? 'warning' :
                          selectedEquipment.data.status === 'offline' ? 'danger' : 'default'
                        }
                        size="sm"
                      >
                        {selectedEquipment.data.status}
                      </StatusBadge>
                      <Badge variant="outline" className="text-xs">
                        {selectedEquipment.data.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Active Alarm Warning */}
                {selectedEquipment.data.hasActiveAlarm && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                    <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">Active Alarm</p>
                      <p className="text-xs text-rose-600 dark:text-rose-400">
                        {selectedEquipment.data.alarmMessage || 'Equipment requires attention'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Valve State */}
                {selectedEquipment.data.type === 'valve' && selectedEquipment.data.valveState && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div>
                      <p className="text-xs text-muted-foreground">Valve State</p>
                      <p className={cn(
                        'text-sm font-semibold uppercase',
                        selectedEquipment.data.valveState === 'open' && 'text-emerald-600',
                        selectedEquipment.data.valveState === 'closed' && 'text-rose-600',
                        selectedEquipment.data.valveState === 'partial' && 'text-amber-600'
                      )}>
                        {selectedEquipment.data.valveState}
                      </p>
                    </div>
                    <div className={cn(
                      'h-3 w-3 rounded-full',
                      selectedEquipment.data.valveState === 'open' && 'bg-emerald-500',
                      selectedEquipment.data.valveState === 'closed' && 'bg-rose-500',
                      selectedEquipment.data.valveState === 'partial' && 'bg-amber-500'
                    )} />
                  </div>
                )}

                {/* Description */}
                {selectedEquipment.data.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedEquipment.data.description}
                  </p>
                )}

                {/* Metrics */}
                {selectedEquipment.data.metrics && selectedEquipment.data.metrics.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Current Readings</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedEquipment.data.metrics.map((metric, index) => (
                        <Link
                          key={index}
                          href={`/trends?equipment=${selectedEquipment.id}&metric=${metric.label.toLowerCase()}`}
                          className="rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors cursor-pointer group"
                        >
                          <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                            {metric.label}
                          </p>
                          <p className={cn(
                            'text-lg font-semibold',
                            metric.status === 'warning' && 'text-amber-600',
                            metric.status === 'critical' && 'text-rose-600'
                          )}>
                            {metric.value}
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              {metric.unit}
                            </span>
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 group-hover:text-primary/70 mt-0.5">
                            Click to view trend →
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                {selectedEquipment.data.lastUpdated && (
                  <div className="text-[11px] text-muted-foreground text-center">
                    Last updated: {selectedEquipment.data.lastUpdated}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Quick Actions</p>
                  <div className="flex gap-2">
                    <Link href={`/trends?equipment=${selectedEquipment.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View History
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="flex-1">
                      Maintenance Log
                    </Button>
                  </div>
                  {selectedEquipment.data.hasActiveAlarm && (
                    <Link href="/alerts" className="block">
                      <Button variant="destructive" size="sm" className="w-full">
                        Acknowledge Alarm
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
