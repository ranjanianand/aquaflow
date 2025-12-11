'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Alert } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import { AlertTriangle, Clock, MapPin, Cpu, Check, X } from 'lucide-react';
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

  const severityVariant: Record<string, 'danger' | 'warning' | 'info'> = {
    critical: 'danger',
    warning: 'warning',
    info: 'info',
  };

  const severityIcon: Record<string, string> = {
    critical: 'text-[var(--danger)]',
    warning: 'text-[var(--warning)]',
    info: 'text-[var(--info)]',
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
      <DialogContent className="max-w-lg">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                alert.severity === 'critical' && 'bg-[var(--danger-bg)]',
                alert.severity === 'warning' && 'bg-[var(--warning-bg)]',
                alert.severity === 'info' && 'bg-[var(--info-bg)]'
              )}
            >
              <AlertTriangle className={cn('h-5 w-5', severityIcon[alert.severity])} />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                {alert.type}
                <StatusBadge variant={severityVariant[alert.severity]} size="sm">
                  {alert.severity}
                </StatusBadge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Alert Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium">{alert.plantName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Cpu className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Sensor</p>
                <p className="text-sm font-medium">{alert.sensorName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Triggered</p>
                <p className="text-sm font-medium">
                  {format(alert.createdAt, 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">
                  {alert.duration || formatDistanceToNow(alert.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Value vs Threshold */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground mb-2">Value vs Threshold</p>
            <div className="flex items-baseline gap-4">
              <div>
                <span className="text-2xl font-bold">{alert.value}</span>
                <span className="text-sm text-muted-foreground ml-1">{alert.unit}</span>
              </div>
              <span className="text-muted-foreground">/</span>
              <div>
                <span className="text-lg font-medium text-muted-foreground">
                  {alert.threshold}
                </span>
                <span className="text-xs text-muted-foreground ml-1">threshold</span>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div>
            <p className="text-sm font-semibold mb-2">Recommended Actions</p>
            <ul className="space-y-2">
              {recommendedActions[alert.severity].map((action, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Acknowledgement Info */}
          {alert.acknowledgedAt && (
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Acknowledged by{' '}
                <span className="font-medium text-foreground">{alert.acknowledgedBy}</span> on{' '}
                {format(alert.acknowledgedAt, 'MMM d, yyyy HH:mm')}
              </p>
            </div>
          )}

          {/* Resolution Info */}
          {alert.resolvedAt && (
            <div className="rounded-lg border border-[var(--success)] bg-[var(--success-bg)] p-3">
              <p className="text-xs text-[var(--success)]">
                Resolved by{' '}
                <span className="font-medium">{alert.resolvedBy}</span> on{' '}
                {format(alert.resolvedAt, 'MMM d, yyyy HH:mm')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
          {alert.status === 'active' && (
            <Button onClick={() => onAcknowledge(alert.id)}>
              <Check className="h-4 w-4 mr-1" />
              Acknowledge
            </Button>
          )}
          {alert.status === 'acknowledged' && (
            <Button onClick={() => onResolve(alert.id)}>
              <Check className="h-4 w-4 mr-1" />
              Resolve
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
