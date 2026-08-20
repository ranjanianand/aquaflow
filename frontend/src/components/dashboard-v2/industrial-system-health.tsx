'use client';

import { cn } from '@/lib/utils';
import {
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Clock,
  Activity
} from 'lucide-react';

interface SystemMetric {
  id: string;
  name: string;
  icon: React.ElementType;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  details?: string;
}

const systemMetrics: SystemMetric[] = [
  {
    id: '1',
    name: 'API Gateway',
    icon: Server,
    value: 99.9,
    unit: '% uptime',
    status: 'healthy',
    details: 'Response: 45ms'
  },
  {
    id: '2',
    name: 'Database',
    icon: Database,
    value: 99.8,
    unit: '% uptime',
    status: 'healthy',
    details: 'Queries: 1.2k/s'
  },
  {
    id: '3',
    name: 'IoT Gateway',
    icon: Wifi,
    value: 142,
    unit: 'connections',
    status: 'healthy',
    details: 'Latency: 12ms'
  },
  {
    id: '4',
    name: 'Storage',
    icon: HardDrive,
    value: 67,
    unit: '% used',
    status: 'warning',
    details: '1.2TB / 1.8TB'
  },
  {
    id: '5',
    name: 'CPU Load',
    icon: Cpu,
    value: 42,
    unit: '%',
    status: 'healthy',
    details: '8 cores'
  },
  {
    id: '6',
    name: 'Memory',
    icon: MemoryStick,
    value: 58,
    unit: '%',
    status: 'healthy',
    details: '18.6GB / 32GB'
  },
];

function MetricItem({ metric }: { metric: SystemMetric }) {
  const Icon = metric.icon;

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 border-b border-slate-200 last:border-b-0',
      'hover:bg-slate-50 transition-colors',
      metric.status === 'critical' && 'border-l-[3px] border-l-red-500',
      metric.status === 'warning' && 'border-l-[3px] border-l-amber-500',
      metric.status === 'healthy' && 'border-l-[3px] border-l-emerald-500'
    )}>
      <Icon className={cn(
        'h-4 w-4 flex-shrink-0',
        metric.status === 'healthy' && 'text-slate-500',
        metric.status === 'warning' && 'text-amber-600',
        metric.status === 'critical' && 'text-red-600'
      )} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{metric.name}</span>
          <span className={cn(
            'text-sm font-mono font-bold',
            metric.status === 'healthy' && 'text-emerald-600',
            metric.status === 'warning' && 'text-amber-600',
            metric.status === 'critical' && 'text-red-600'
          )}>
            {metric.value}{metric.unit}
          </span>
        </div>
        {metric.details && (
          <span className="text-[10px] text-slate-400 block">{metric.details}</span>
        )}
      </div>
    </div>
  );
}

export function IndustrialSystemHealth() {
  const healthyCount = systemMetrics.filter(m => m.status === 'healthy').length;
  const totalCount = systemMetrics.length;

  return (
    <div className="border-2 border-slate-300 overflow-hidden h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">System Health</span>
        <span className={cn(
          'text-[10px] font-mono font-bold',
          healthyCount === totalCount ? 'text-emerald-600' : 'text-amber-600'
        )}>
          {healthyCount}/{totalCount} OK
        </span>
      </div>

      {/* Metrics */}
      <div className="flex-1 overflow-y-auto">
        {systemMetrics.map((metric) => (
          <MetricItem key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-4 py-2 border-t-2 border-slate-300 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Clock className="h-3 w-3" />
          <span className="font-mono">30s ago</span>
        </div>
        <button className="text-[10px] text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wide">
          Details →
        </button>
      </div>
    </div>
  );
}
