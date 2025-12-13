'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  location: string;
  value: string;
  time: Date;
  status: 'active' | 'acknowledged';
}

const alerts: Alert[] = [
  {
    id: '1',
    severity: 'critical',
    type: 'High pH Level',
    location: 'Plant C - Tank 3',
    value: '8.9 pH',
    time: new Date(Date.now() - 1000 * 60 * 5),
    status: 'active',
  },
  {
    id: '2',
    severity: 'warning',
    type: 'Temperature Rising',
    location: 'Plant B - Reactor 2',
    value: '28.5°C',
    time: new Date(Date.now() - 1000 * 60 * 12),
    status: 'active',
  },
  {
    id: '3',
    severity: 'warning',
    type: 'Flow Rate Low',
    location: 'Plant A - Pump Station',
    value: '185 m³/h',
    time: new Date(Date.now() - 1000 * 60 * 25),
    status: 'acknowledged',
  },
  {
    id: '4',
    severity: 'info',
    type: 'Maintenance Due',
    location: 'Plant D - Filter Unit',
    value: '2 days',
    time: new Date(Date.now() - 1000 * 60 * 60),
    status: 'active',
  },
];

function AlertRow({ alert }: { alert: Alert }) {
  const SeverityIcon = alert.severity === 'critical' ? AlertCircle :
                       alert.severity === 'warning' ? AlertTriangle : Info;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-slate-200 last:border-b-0',
        'hover:bg-slate-50 transition-colors cursor-pointer',
        alert.status === 'active' && alert.severity === 'critical' && 'border-l-[3px] border-l-red-500',
        alert.status === 'active' && alert.severity === 'warning' && 'border-l-[3px] border-l-amber-500',
        alert.status === 'active' && alert.severity === 'info' && 'border-l-[3px] border-l-blue-500',
        alert.status === 'acknowledged' && 'opacity-60'
      )}
    >
      {/* Icon */}
      <SeverityIcon className={cn(
        'h-4 w-4 flex-shrink-0',
        alert.severity === 'critical' && 'text-red-600',
        alert.severity === 'warning' && 'text-amber-600',
        alert.severity === 'info' && 'text-blue-600'
      )} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-900 truncate">{alert.type}</span>
          <span className="text-xs font-mono font-bold text-slate-600 flex-shrink-0">
            {alert.value}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 mt-1.5">
          <span className="text-xs text-slate-500 truncate">{alert.location}</span>
          <span className="text-xs text-slate-400 flex items-center gap-1.5 flex-shrink-0">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(alert.time, { addSuffix: false })}
          </span>
        </div>
      </div>

      {/* Status */}
      {alert.status === 'acknowledged' && (
        <CheckCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
      )}
    </div>
  );
}

export function IndustrialAlertsPanel() {
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
  const warningCount = alerts.filter(a => a.severity === 'warning' && a.status === 'active').length;

  return (
    <div className="border-2 border-slate-300 overflow-hidden h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Active Alerts</span>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {criticalCount > 0 && (
            <span className="text-red-600 font-bold">{criticalCount} CRIT</span>
          )}
          {warningCount > 0 && (
            <span className="text-amber-600 font-bold">{warningCount} WARN</span>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto">
        {alerts.map((alert) => (
          <AlertRow key={alert.id} alert={alert} />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-4 py-2 border-t-2 border-slate-300 flex-shrink-0">
        <button className="text-[10px] text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wide">
          View All →
        </button>
      </div>
    </div>
  );
}
