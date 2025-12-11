'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge, StatusDot } from '@/components/shared/status-badge';
import { Alert } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Check, Eye, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AlertTableProps {
  alerts: Alert[];
  onViewAlert: (alert: Alert) => void;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

export function AlertTable({
  alerts,
  onViewAlert,
  onAcknowledge,
  onResolve,
}: AlertTableProps) {
  const severityVariant: Record<string, 'danger' | 'warning' | 'info'> = {
    critical: 'danger',
    warning: 'warning',
    info: 'info',
  };

  const statusVariant: Record<string, 'danger' | 'warning' | 'success' | 'default'> = {
    active: 'danger',
    acknowledged: 'warning',
    resolved: 'success',
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[100px]">Severity</TableHead>
            <TableHead>Alert Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No alerts found
              </TableCell>
            </TableRow>
          ) : (
            alerts.map((alert) => (
              <TableRow
                key={alert.id}
                className="cursor-pointer"
                onClick={() => onViewAlert(alert)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusDot
                      status={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'normal'}
                      pulse={alert.severity === 'critical' && alert.status === 'active'}
                    />
                    <StatusBadge variant={severityVariant[alert.severity]} size="sm">
                      {alert.severity}
                    </StatusBadge>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{alert.type}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {alert.message}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{alert.plantName}</p>
                    <p className="text-xs text-muted-foreground">{alert.sensorName}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono">
                    {alert.value} {alert.unit}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {alert.duration || formatDistanceToNow(alert.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    variant={statusVariant[alert.status] || 'default'}
                    size="sm"
                  >
                    {alert.status}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {alert.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAcknowledge(alert.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Ack
                      </Button>
                    )}
                    {alert.status === 'acknowledged' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResolve(alert.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewAlert(alert)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {alert.status === 'active' && (
                          <DropdownMenuItem onClick={() => onAcknowledge(alert.id)}>
                            <Check className="h-4 w-4 mr-2" />
                            Acknowledge
                          </DropdownMenuItem>
                        )}
                        {alert.status === 'acknowledged' && (
                          <DropdownMenuItem onClick={() => onResolve(alert.id)}>
                            <Check className="h-4 w-4 mr-2" />
                            Resolve
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
