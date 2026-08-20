'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Wifi,
  WifiOff,
  Clock,
  Server,
  Database,
  RefreshCw,
  User,
  Calendar,
  Activity,
  CheckCircle
} from 'lucide-react';

interface ConnectionStatus {
  mqtt: 'connected' | 'disconnected' | 'reconnecting';
  api: 'connected' | 'disconnected';
  database: 'connected' | 'disconnected';
}

interface ShiftInfo {
  name: string;
  operator: string;
  startTime: string;
  endTime: string;
}

export function OperationalFooter() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock connection status - in production would be real
  const connectionStatus: ConnectionStatus = {
    mqtt: 'connected',
    api: 'connected',
    database: 'connected',
  };

  // Mock shift info
  const shiftInfo: ShiftInfo = {
    name: 'Day Shift',
    operator: 'John Operator',
    startTime: '06:00',
    endTime: '14:00',
  };

  // Update refresh timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update "ago" display
      setLastRefresh(prev => prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLastRefresh(new Date());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getTimeSinceRefresh = () => {
    const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const allConnected = connectionStatus.mqtt === 'connected' &&
                       connectionStatus.api === 'connected' &&
                       connectionStatus.database === 'connected';

  return (
    <footer className="border-t-2 border-slate-200 bg-white mt-4">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: Connection Status */}
        <div className="flex items-center gap-4">
          {/* Overall Status */}
          <div className="flex items-center gap-2">
            {allConnected ? (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-emerald-600">LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <WifiOff className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-600">OFFLINE</span>
              </div>
            )}
          </div>

          {/* Individual Connections */}
          <div className="flex items-center gap-3 text-xs">
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded border',
              connectionStatus.mqtt === 'connected'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            )}>
              <Activity className="h-3 w-3" />
              <span className="font-medium">MQTT</span>
            </div>

            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded border',
              connectionStatus.api === 'connected'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            )}>
              <Server className="h-3 w-3" />
              <span className="font-medium">API</span>
            </div>

            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded border',
              connectionStatus.database === 'connected'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            )}>
              <Database className="h-3 w-3" />
              <span className="font-medium">DB</span>
            </div>
          </div>

          {/* Latency */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Latency:</span>
            <span className="font-mono font-semibold text-slate-700">45ms</span>
          </div>
        </div>

        {/* Center: Refresh Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>Last refresh:</span>
            <span className="font-mono font-semibold text-slate-700">{getTimeSinceRefresh()}</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
              'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300',
              isRefreshing && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Auto-refresh:</span>
            <span className="font-mono font-semibold text-emerald-600">5s</span>
          </div>
        </div>

        {/* Right: Shift & User Info */}
        <div className="flex items-center gap-4">
          {/* Shift Info */}
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-500">{shiftInfo.name}</span>
            <span className="text-slate-400">|</span>
            <span className="font-mono text-slate-600">
              {shiftInfo.startTime} - {shiftInfo.endTime}
            </span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{shiftInfo.operator}</span>
          </div>

          {/* Version */}
          <div className="text-xs text-slate-400 font-mono">
            v2.0.0
          </div>
        </div>
      </div>
    </footer>
  );
}
