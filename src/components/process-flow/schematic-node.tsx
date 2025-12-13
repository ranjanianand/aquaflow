'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export type EquipmentType = 'inlet' | 'screen' | 'tank' | 'pump' | 'filter' | 'chemical' | 'sensor' | 'outlet' | 'valve';
export type EquipmentStatus = 'running' | 'idle' | 'warning' | 'offline' | 'alarm';
export type ValveState = 'open' | 'closed' | 'partial';

export interface EquipmentMetric {
  label: string;
  value: string;
  unit: string;
  trend?: number[];
  status?: 'normal' | 'warning' | 'critical';
}

export interface SchematicNodeData {
  label: string;
  type: EquipmentType;
  status: EquipmentStatus;
  metrics?: EquipmentMetric[];
  description?: string;
  valveState?: ValveState;
  hasActiveAlarm?: boolean;
  alarmMessage?: string;
  lastUpdated?: string;
  primaryValue?: string; // Single key value to show (e.g., "4.2 bar")
  [key: string]: unknown;
}

// ISA/ISO-style P&ID symbols as SVG
const PumpSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="24" cy="24" r="16" />
    <path d="M24 8 L40 24 L24 40" strokeLinejoin="round" />
  </svg>
);

const TankSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="8" width="32" height="32" rx="2" />
    <path d="M8 16 L40 16" strokeDasharray="4 2" />
  </svg>
);

const ValveSymbol: React.FC<{ className?: string; state?: ValveState }> = ({ className, state = 'open' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    {/* Bowtie shape for valve */}
    <path d="M8 8 L24 24 L8 40 Z" fill={state === 'closed' ? 'currentColor' : 'none'} fillOpacity={0.3} />
    <path d="M40 8 L24 24 L40 40 Z" fill={state === 'closed' ? 'currentColor' : 'none'} fillOpacity={0.3} />
    <path d="M8 8 L24 24 L8 40 M40 8 L24 24 L40 40" />
    {/* Stem */}
    <path d="M24 4 L24 12" strokeWidth="3" />
    {state === 'partial' && <circle cx="24" cy="24" r="4" fill="currentColor" fillOpacity={0.5} />}
  </svg>
);

const FilterSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="8" width="32" height="32" rx="2" />
    <path d="M14 14 L34 34 M14 20 L28 34 M20 14 L34 28 M14 26 L22 34 M26 14 L34 22" strokeWidth="1.5" />
  </svg>
);

const ScreenSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="8" width="32" height="32" rx="2" />
    <path d="M16 8 L16 40 M24 8 L24 40 M32 8 L32 40" strokeWidth="1.5" />
  </svg>
);

const ChemicalSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    {/* Dosing tank */}
    <path d="M16 8 L16 32 Q16 40 24 40 Q32 40 32 32 L32 8" />
    <path d="M16 8 L32 8" />
    {/* Injection arrow */}
    <path d="M24 40 L24 48" strokeWidth="2.5" />
    <path d="M20 44 L24 48 L28 44" strokeWidth="2" fill="none" />
  </svg>
);

const SensorSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="24" cy="24" r="14" />
    <path d="M24 10 L24 14 M24 34 L24 38 M10 24 L14 24 M34 24 L38 24" />
    <circle cx="24" cy="24" r="4" fill="currentColor" fillOpacity={0.3} />
  </svg>
);

const InletSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 24 L20 24" strokeWidth="3" />
    <path d="M20 12 L20 36 Q20 40 24 40 L40 40 L40 8 L24 8 Q20 8 20 12" />
    <path d="M12 18 L20 24 L12 30" strokeWidth="2.5" fill="none" />
  </svg>
);

const OutletSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M28 24 L44 24" strokeWidth="3" />
    <path d="M8 8 L24 8 Q28 8 28 12 L28 36 Q28 40 24 40 L8 40 L8 8" />
    <path d="M36 18 L44 24 L36 30" strokeWidth="2.5" fill="none" />
  </svg>
);

const EquipmentSymbol: React.FC<{ type: EquipmentType; className?: string; valveState?: ValveState }> = ({
  type,
  className,
  valveState
}) => {
  switch (type) {
    case 'inlet':
      return <InletSymbol className={className} />;
    case 'outlet':
      return <OutletSymbol className={className} />;
    case 'pump':
      return <PumpSymbol className={className} />;
    case 'tank':
      return <TankSymbol className={className} />;
    case 'filter':
      return <FilterSymbol className={className} />;
    case 'screen':
      return <ScreenSymbol className={className} />;
    case 'valve':
      return <ValveSymbol className={className} state={valveState} />;
    case 'chemical':
      return <ChemicalSymbol className={className} />;
    case 'sensor':
      return <SensorSymbol className={className} />;
    default:
      return <TankSymbol className={className} />;
  }
};

const statusColors: Record<EquipmentStatus, { stroke: string; fill: string; bg: string }> = {
  running: {
    stroke: 'stroke-emerald-600 dark:stroke-emerald-400',
    fill: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  idle: {
    stroke: 'stroke-gray-500 dark:stroke-gray-400',
    fill: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900/30',
  },
  warning: {
    stroke: 'stroke-amber-600 dark:stroke-amber-400',
    fill: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  offline: {
    stroke: 'stroke-rose-600 dark:stroke-rose-400',
    fill: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
  },
  alarm: {
    stroke: 'stroke-rose-600 dark:stroke-rose-400',
    fill: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
  },
};

function SchematicNodeComponent({ data, selected }: { data: SchematicNodeData; selected?: boolean }) {
  const colors = statusColors[data.status];
  const isAlarm = data.status === 'alarm' || data.hasActiveAlarm;
  const isValve = data.type === 'valve';

  // Get primary metric value to display
  const primaryMetric = data.metrics?.[0];
  const displayValue = data.primaryValue || (primaryMetric ? `${primaryMetric.value} ${primaryMetric.unit}` : null);

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-1 p-2 transition-all duration-150',
        'hover:scale-105 cursor-pointer',
        selected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background',
        isAlarm && 'animate-pulse'
      )}
    >
      {/* Connection handles - positioned INSIDE the node so arrows touch the icon */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 8,
          height: 8,
          background: 'transparent',
          border: 'none',
          left: 12, // Inside the icon box
          opacity: 0,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 8,
          height: 8,
          background: 'transparent',
          border: 'none',
          right: 12, // Inside the icon box
          opacity: 0,
        }}
      />
      {/* Additional handles for vertical connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          width: 8,
          height: 8,
          background: 'transparent',
          border: 'none',
          top: 12, // Inside the icon box
          opacity: 0,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          width: 8,
          height: 8,
          background: 'transparent',
          border: 'none',
          bottom: 24, // Above the label, inside icon area
          opacity: 0,
        }}
      />

      {/* Alarm indicator */}
      {isAlarm && (
        <div className="absolute -top-1 -right-1 z-10">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-rose-600">
              <AlertTriangle className="h-2.5 w-2.5 text-white" />
            </span>
          </span>
        </div>
      )}


      {/* Equipment Symbol - Industrial P&ID style with sharp edges (matching Insights page) */}
      <div
        className={cn(
          'w-12 h-12 flex items-center justify-center border-2 border-slate-300 bg-white transition-all duration-150',
          isAlarm
            ? 'border-rose-500 animate-alarm-flash shadow-[0_0_20px_4px_rgba(220,38,38,0.2)]'
            : 'hover:border-slate-400',
          colors.fill
        )}
      >
        <EquipmentSymbol
          type={data.type}
          className={cn('w-7 h-7', colors.stroke, colors.fill)}
          valveState={data.valveState}
        />
      </div>

      {/* Label - Vercel-style typography */}
      <div className="text-center max-w-[80px]">
        <p className="text-xs font-medium text-foreground truncate leading-tight">
          {data.label}
        </p>

        {/* Valve state badge - Sharp edges matching Insights page */}
        {isValve && data.valveState && (
          <span className={cn(
            'inline-flex items-center justify-center text-[9px] font-bold px-1.5 py-0.5 uppercase mt-1',
            data.valveState === 'open' && 'bg-emerald-100 text-emerald-700',
            data.valveState === 'closed' && 'bg-rose-100 text-rose-700',
            data.valveState === 'partial' && 'bg-amber-100 text-amber-700'
          )}>
            {data.valveState}
          </span>
        )}

        {/* Primary value - Tabular nums for data */}
        {displayValue && !isValve && (
          <p className={cn(
            'text-[10px] font-medium mt-0.5 tabular-nums font-mono-data',
            primaryMetric?.status === 'warning' && 'text-warning',
            primaryMetric?.status === 'critical' && 'text-danger',
            !primaryMetric?.status && 'text-muted-foreground'
          )}>
            {displayValue}
          </p>
        )}
      </div>
    </div>
  );
}

export const SchematicNode = memo(SchematicNodeComponent);
