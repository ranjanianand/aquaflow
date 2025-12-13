'use client';

import { cn } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  User,
  Settings,
  Power,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type EventType = 'alarm' | 'ack' | 'resolve' | 'config' | 'maintenance' | 'system' | 'user';
type EventSeverity = 'critical' | 'warning' | 'info' | 'success';

interface Event {
  id: string;
  type: EventType;
  severity: EventSeverity;
  message: string;
  location?: string;
  user?: string;
  timestamp: Date;
}

const recentEvents: Event[] = [
  {
    id: '1',
    type: 'alarm',
    severity: 'critical',
    message: 'pH Level exceeded threshold (8.9 pH)',
    location: 'Plant C - Tank 3',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: '2',
    type: 'ack',
    severity: 'info',
    message: 'Temperature alert acknowledged',
    location: 'Plant B - Reactor 2',
    user: 'John Operator',
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
  },
  {
    id: '3',
    type: 'alarm',
    severity: 'warning',
    message: 'Temperature rising (28.5°C)',
    location: 'Plant B - Reactor 2',
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
  },
  {
    id: '4',
    type: 'resolve',
    severity: 'success',
    message: 'Flow rate returned to normal',
    location: 'Plant A - Pump Station',
    timestamp: new Date(Date.now() - 1000 * 60 * 18),
  },
  {
    id: '5',
    type: 'maintenance',
    severity: 'info',
    message: 'Scheduled maintenance reminder',
    location: 'Plant D - Filter Unit',
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
  },
  {
    id: '6',
    type: 'config',
    severity: 'info',
    message: 'Threshold updated: pH max 8.5 → 8.6',
    location: 'Plant C',
    user: 'Admin User',
    timestamp: new Date(Date.now() - 1000 * 60 * 35),
  },
  {
    id: '7',
    type: 'system',
    severity: 'success',
    message: 'Gateway reconnected',
    location: 'Plant E',
    timestamp: new Date(Date.now() - 1000 * 60 * 42),
  },
  {
    id: '8',
    type: 'user',
    severity: 'info',
    message: 'Shift handover completed',
    user: 'Team Alpha → Team Beta',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
  },
];

function getEventIcon(type: EventType, severity: EventSeverity) {
  switch (type) {
    case 'alarm':
      return severity === 'critical' ? AlertCircle : AlertTriangle;
    case 'ack':
      return CheckCircle;
    case 'resolve':
      return CheckCircle;
    case 'config':
      return Settings;
    case 'maintenance':
      return Wrench;
    case 'system':
      return Power;
    case 'user':
      return User;
    default:
      return Info;
  }
}

function EventRow({ event }: { event: Event }) {
  const Icon = getEventIcon(event.type, event.severity);

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 border-b border-slate-200 last:border-b-0',
      'hover:bg-slate-50 transition-colors',
      event.severity === 'critical' && 'border-l-[3px] border-l-red-500',
      event.severity === 'warning' && 'border-l-[3px] border-l-amber-500',
      event.severity === 'success' && 'border-l-[3px] border-l-emerald-500',
      event.severity === 'info' && 'border-l-[3px] border-l-slate-400'
    )}>
      {/* Icon */}
      <Icon className={cn(
        'h-4 w-4 flex-shrink-0 mt-0.5',
        event.severity === 'critical' && 'text-red-600',
        event.severity === 'warning' && 'text-amber-600',
        event.severity === 'success' && 'text-emerald-600',
        event.severity === 'info' && 'text-slate-500'
      )} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium leading-tight',
          event.severity === 'critical' && 'text-red-700',
          event.severity === 'warning' && 'text-amber-700',
          event.severity !== 'critical' && event.severity !== 'warning' && 'text-slate-700'
        )}>
          {event.message}
        </p>

        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          {event.location && (
            <span className="truncate">{event.location}</span>
          )}
          {event.user && (
            <>
              {event.location && <span className="text-slate-300">•</span>}
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {event.user}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
        <Clock className="h-3 w-3" />
        <span className="font-mono">{formatDistanceToNow(event.timestamp, { addSuffix: false })}</span>
      </div>
    </div>
  );
}

export function RecentEventsPanel() {
  const criticalCount = recentEvents.filter(e => e.severity === 'critical').length;
  const last1Hour = recentEvents.filter(e =>
    (Date.now() - e.timestamp.getTime()) < 1000 * 60 * 60
  ).length;

  return (
    <div className="border-2 border-slate-300 overflow-hidden bg-white h-full flex flex-col">
      {/* Header */}
      <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Recent Events
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({last1Hour} in 1h)
          </span>
        </div>
        <button className="p-1 hover:bg-slate-200 transition-colors" title="Refresh">
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto">
        {recentEvents.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-4 py-2 border-t-2 border-slate-300 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] text-slate-500">
          Last 8 events
        </span>
        <button className="text-[10px] text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wide">
          View Log →
        </button>
      </div>
    </div>
  );
}
