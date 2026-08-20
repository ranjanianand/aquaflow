'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  MapPin,
  Cpu,
  Check,
  X,
  User,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertModalProps {
  alert: Alert | null;
  open: boolean;
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

export function AlertModal({
  alert,
  open,
  onClose,
  onAcknowledge,
  onResolve,
}: AlertModalProps) {
  if (!alert) return null;

  const SeverityIcon = () => {
    switch (alert.severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const recommendedActions: Record<string, string[]> = {
    critical: [
      'Immediately notify on-call engineer',
      'Check sensor hardware for malfunction',
      'Verify process parameters are within safety limits',
      'Document incident in maintenance log',
    ],
    warning: [
      'Monitor trend over next 30 minutes',
      'Check for any recent process changes',
      'Verify sensor calibration status',
      'Consider preventive maintenance if recurring',
    ],
    info: [
      'Log for trend analysis',
      'No immediate action required',
      'Review during next shift handoff',
    ],
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
        {/* Industrial Header - Neutral with status indicator */}
        <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center border-2',
              alert.severity === 'critical' && 'border-red-300 bg-red-50',
              alert.severity === 'warning' && 'border-amber-300 bg-amber-50',
              alert.severity === 'info' && 'border-blue-300 bg-blue-50'
            )}>
              <SeverityIcon />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-sm font-bold text-slate-700">
                {alert.type}
              </DialogTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">{alert.message}</p>
            </div>
            <span className={cn(
              'px-2 py-1 text-[9px] font-bold uppercase',
              alert.severity === 'critical' && 'bg-red-100 text-red-700',
              alert.severity === 'warning' && 'bg-amber-100 text-amber-700',
              alert.severity === 'info' && 'bg-blue-100 text-blue-700'
            )}>
              {alert.severity}
            </span>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="bg-white">
          {/* Alert Details Grid */}
          <div className="px-4 py-4 border-b border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Alert Details
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-slate-500">Location</p>
                  <p className="text-sm font-medium text-slate-700">{alert.plantName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Cpu className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-slate-500">Sensor</p>
                  <p className="text-sm font-medium text-slate-700">{alert.sensorName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-slate-500">Triggered</p>
                  <p className="text-sm font-mono text-slate-700">
                    {format(alert.createdAt, 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-slate-500">Duration</p>
                  <p className="text-sm font-mono text-slate-700">
                    {alert.duration || formatDistanceToNow(alert.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Value vs Threshold Panel */}
          <div className="px-4 py-4 border-b border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Value vs Threshold
            </div>
            <div className={cn(
              'border-2 border-slate-300 p-4',
              alert.severity === 'critical' && 'border-l-[3px] border-l-red-500',
              alert.severity === 'warning' && 'border-l-[3px] border-l-amber-500',
              alert.severity === 'info' && 'border-l-[3px] border-l-blue-500'
            )}>
              <div className="flex items-baseline gap-6">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">Current</span>
                  <span className={cn(
                    'text-3xl font-mono font-bold',
                    alert.severity === 'critical' && 'text-red-600',
                    alert.severity === 'warning' && 'text-amber-600',
                    alert.severity === 'info' && 'text-blue-600'
                  )}>
                    {alert.value}
                  </span>
                  <span className="text-sm text-slate-500 ml-1">{alert.unit}</span>
                </div>
                <div className="text-slate-300 text-2xl">/</div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">Threshold</span>
                  <span className="text-2xl font-mono font-bold text-slate-500">
                    {alert.threshold}
                  </span>
                  <span className="text-sm text-slate-400 ml-1">{alert.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="px-4 py-4 border-b border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Recommended Actions
            </div>
            <ul className="space-y-2">
              {recommendedActions[alert.severity].map((action, index) => (
                <li key={index} className="flex items-start gap-2 text-[11px] text-slate-600">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 bg-slate-400" />
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Acknowledgement Info */}
          {alert.acknowledgedAt && (
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-[11px] text-slate-600">
                  Acknowledged by{' '}
                  <span className="font-bold text-slate-700">{alert.acknowledgedBy}</span> on{' '}
                  <span className="font-mono">{format(alert.acknowledgedAt, 'MMM d, yyyy HH:mm')}</span>
                </p>
              </div>
            </div>
          )}

          {/* Resolution Info */}
          {alert.resolvedAt && (
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 border-l-[3px] border-l-emerald-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-[11px] text-slate-600">
                  Resolved by{' '}
                  <span className="font-bold text-slate-700">{alert.resolvedBy}</span> on{' '}
                  <span className="font-mono">{format(alert.resolvedAt, 'MMM d, yyyy HH:mm')}</span>
                </p>
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Status
              </span>
              <span className={cn(
                'px-2 py-0.5 text-[9px] font-bold uppercase',
                alert.status === 'active' && 'bg-red-100 text-red-700',
                alert.status === 'acknowledged' && 'bg-amber-100 text-amber-700',
                alert.status === 'resolved' && 'bg-emerald-100 text-emerald-700'
              )}>
                {alert.status}
              </span>
            </div>
          </div>
        </div>

        {/* Industrial Footer with Standard Button Colors */}
        <div className="px-4 py-3 bg-slate-100 border-t-2 border-slate-300 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </button>
          {alert.status === 'active' && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Acknowledge
            </button>
          )}
          {alert.status === 'acknowledged' && (
            <button
              onClick={() => onResolve(alert.id)}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Resolve
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
