'use client';

import Link from 'next/link';
import { getAlertsByStatus } from '@/data/mock-alerts';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export function AlertsFeed() {
  const activeAlerts = getAlertsByStatus('active');
  const displayAlerts = activeAlerts.slice(0, 5);

  return (
    <div className="bg-card rounded-lg border border-border h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-[13px] font-semibold">Alerts</h3>
        <Link
          href="/alerts"
          className="text-[12px] font-medium text-primary hover:underline flex items-center gap-1"
        >
          View All
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Alert Items */}
      <div className="flex-1 overflow-auto">
        {displayAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-[13px]">No active alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayAlerts.map((alert) => (
              <Link
                key={alert.id}
                href={`/alerts?id=${alert.id}`}
                className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
              >
                {/* Severity dot */}
                <span
                  className={cn(
                    'mt-1 h-2 w-2 flex-shrink-0 rounded-full',
                    alert.severity === 'critical' && 'bg-[var(--danger)]',
                    alert.severity === 'warning' && 'bg-[var(--warning)]',
                    alert.severity === 'info' && 'bg-[var(--info)]'
                  )}
                />

                <div className="flex-1 min-w-0">
                  {/* Alert title */}
                  <p className="text-[13px] font-medium text-foreground truncate">
                    {alert.type}
                  </p>
                  {/* Alert description */}
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {alert.message || `${alert.plantName} • ${alert.sensorName}`}
                  </p>
                  {/* Timestamp */}
                  <p className="text-[10px] text-[var(--warning)] mt-1">
                    {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
