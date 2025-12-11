'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, X, ChevronRight, Bell, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActiveAlerts } from '@/data/mock-alerts';
import Link from 'next/link';

interface CriticalAlert {
  id: string;
  plantName: string;
  sensorName: string;
  message: string;
  severity: 'critical' | 'warning';
  createdAt: Date;
}

export function CriticalAlertsBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Track mount state for SSR-safe time calculations
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get critical and warning alerts
  const activeAlerts = getActiveAlerts();
  const criticalAlerts: CriticalAlert[] = activeAlerts
    .filter((a): a is typeof a & { severity: 'critical' | 'warning' } =>
      a.severity === 'critical' || a.severity === 'warning'
    )
    .sort((a, b) => {
      // Critical first, then by time
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5); // Show max 5

  // Rotate through alerts
  useEffect(() => {
    if (criticalAlerts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % criticalAlerts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [criticalAlerts.length]);

  if (!isVisible || criticalAlerts.length === 0) return null;

  const currentAlert = criticalAlerts[currentAlertIndex];
  const criticalCount = criticalAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = criticalAlerts.filter((a) => a.severity === 'warning').length;
  const isCritical = currentAlert.severity === 'critical';

  // SSR-safe time calculation - only calculate on client after mount
  const getTimeAgo = (date: Date) => {
    if (!mounted) return ''; // Return empty string during SSR
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      className="relative overflow-hidden transition-all duration-300 border-b border-border bg-card"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="relative px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon and counts */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center justify-center h-7 w-7 rounded-full',
              isCritical
                ? 'bg-rose-100 dark:bg-rose-950/50'
                : 'bg-amber-100 dark:bg-amber-950/50'
            )}>
              <AlertTriangle className={cn(
                'h-3.5 w-3.5',
                isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
              )} />
            </div>

            {/* Alert counts */}
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {criticalCount} Critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  {warningCount} Warning
                </span>
              )}
            </div>
          </div>

          {/* Center: Current alert message */}
          <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
            <div className="text-center truncate">
              <span className={cn(
                'text-[12px] font-semibold',
                isCritical ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'
              )}>
                {currentAlert.plantName}
              </span>
              <span className="text-muted-foreground mx-2">|</span>
              <span className="text-[12px] text-foreground">
                {currentAlert.message}
              </span>
              <span className="text-[11px] text-muted-foreground ml-2">
                {getTimeAgo(currentAlert.createdAt)}
              </span>
            </div>

            {/* Pagination dots */}
            {criticalAlerts.length > 1 && (
              <div className="flex items-center gap-1">
                {criticalAlerts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentAlertIndex(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === currentAlertIndex
                        ? cn('w-4', isCritical ? 'bg-rose-500' : 'bg-amber-500')
                        : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                    aria-label={`View alert ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? 'Unmute alerts' : 'Mute alerts'}
            >
              <Volume2 className={cn('h-3.5 w-3.5', isMuted && 'opacity-50')} />
            </Button>

            <Link href="/alerts">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-3 text-[11px] font-semibold gap-1',
                  isCritical
                    ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50'
                    : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/50'
                )}
              >
                View All
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsVisible(false)}
              aria-label="Dismiss alert banner"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for sidebar or smaller spaces
export function CriticalAlertsCompact() {
  const activeAlerts = getActiveAlerts();
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length;

  if (criticalCount === 0 && warningCount === 0) return null;

  return (
    <Link href="/alerts">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer',
          criticalCount > 0
            ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50'
            : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50'
        )}
        role="status"
        aria-label={`${criticalCount} critical alerts, ${warningCount} warnings`}
      >
        <div className={cn(
          'flex items-center justify-center h-6 w-6 rounded-full',
          criticalCount > 0
            ? 'bg-rose-100 dark:bg-rose-900'
            : 'bg-amber-100 dark:bg-amber-900'
        )}>
          <Bell className={cn(
            'h-3.5 w-3.5',
            criticalCount > 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-amber-600 dark:text-amber-400'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-[11px] font-semibold',
            criticalCount > 0
              ? 'text-rose-700 dark:text-rose-300'
              : 'text-amber-700 dark:text-amber-300'
          )}>
            {criticalCount > 0 ? `${criticalCount} Critical` : `${warningCount} Warnings`}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            Requires attention
          </p>
        </div>

        <ChevronRight className={cn(
          'h-4 w-4',
          criticalCount > 0
            ? 'text-rose-400'
            : 'text-amber-400'
        )} />
      </div>
    </Link>
  );
}
