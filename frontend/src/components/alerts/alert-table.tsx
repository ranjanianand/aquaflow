'use client';

import { useState, useRef, useEffect } from 'react';
import { Alert } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Check, Eye, AlertCircle, AlertTriangle, Info, MoreVertical, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertTableProps {
  alerts: Alert[];
  onViewAlert: (alert: Alert) => void;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

// Industrial-styled dropdown menu component
function ActionMenu({
  alert,
  onViewAlert,
  onAcknowledge,
  onResolve
}: {
  alert: Alert;
  onViewAlert: (alert: Alert) => void;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 hover:bg-slate-200 transition-colors"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] border-2 border-slate-300 bg-white shadow-lg">
          {/* Menu Header */}
          <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Actions</span>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewAlert(alert);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              View Details
            </button>

            {alert.status === 'active' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAcknowledge(alert.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Acknowledge Alert
              </button>
            )}

            {alert.status === 'acknowledged' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(alert.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Resolve Alert
              </button>
            )}

            {alert.status === 'resolved' && (
              <div className="px-3 py-2 text-[10px] text-slate-400 italic">
                No actions available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AlertTable({
  alerts,
  onViewAlert,
  onAcknowledge,
  onResolve,
}: AlertTableProps) {
  const SeverityIcon = ({ severity }: { severity: string }) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="border-2 border-slate-300 overflow-hidden bg-white">
      {/* Table Header */}
      <div className="bg-slate-100 border-b-2 border-slate-300 grid grid-cols-[80px_1fr_1fr_100px_100px_100px_120px] gap-2 px-4 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Severity</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Alert Type</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Value</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duration</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</span>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-400">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No alerts found</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'grid grid-cols-[80px_1fr_1fr_100px_100px_100px_120px] gap-2 px-4 py-3 items-center',
                'hover:bg-slate-50 cursor-pointer transition-colors',
                alert.status === 'active' && alert.severity === 'critical' && 'border-l-[3px] border-l-red-500',
                alert.status === 'active' && alert.severity === 'warning' && 'border-l-[3px] border-l-amber-500',
                alert.status === 'active' && alert.severity === 'info' && 'border-l-[3px] border-l-blue-500',
                alert.status === 'acknowledged' && 'border-l-[3px] border-l-amber-400',
                alert.status === 'resolved' && 'border-l-[3px] border-l-emerald-500'
              )}
              onClick={() => onViewAlert(alert)}
            >
              {/* Severity */}
              <div className="flex items-center gap-2">
                <SeverityIcon severity={alert.severity} />
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5',
                  alert.severity === 'critical' && 'bg-red-100 text-red-700',
                  alert.severity === 'warning' && 'bg-amber-100 text-amber-700',
                  alert.severity === 'info' && 'bg-blue-100 text-blue-700'
                )}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>

              {/* Alert Type */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{alert.type}</p>
                <p className="text-[10px] text-slate-400 truncate">{alert.message}</p>
              </div>

              {/* Location */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{alert.plantName}</p>
                <p className="text-[10px] text-slate-400 truncate">{alert.sensorName}</p>
              </div>

              {/* Value */}
              <span className="text-sm font-mono font-bold text-slate-600">
                {alert.value} {alert.unit}
              </span>

              {/* Duration */}
              <span className="text-[10px] text-slate-500 font-mono">
                {alert.duration || formatDistanceToNow(alert.createdAt, { addSuffix: false })}
              </span>

              {/* Status */}
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 w-fit',
                alert.status === 'active' && 'bg-red-100 text-red-700',
                alert.status === 'acknowledged' && 'bg-amber-100 text-amber-700',
                alert.status === 'resolved' && 'bg-emerald-100 text-emerald-700'
              )}>
                {alert.status.toUpperCase()}
              </span>

              {/* Actions - 3-dot menu */}
              <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                <ActionMenu
                  alert={alert}
                  onViewAlert={onViewAlert}
                  onAcknowledge={onAcknowledge}
                  onResolve={onResolve}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
