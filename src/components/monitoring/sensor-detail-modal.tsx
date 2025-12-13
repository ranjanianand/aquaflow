'use client';

import { Sensor } from '@/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Target,
  Gauge,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface SensorDetailModalProps {
  sensor: Sensor | null;
  open: boolean;
  onClose: () => void;
}

const statusConfig = {
  normal: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Normal' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Warning' },
  critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Critical' },
};

const commStatusConfig = {
  online: { icon: Wifi, color: 'text-emerald-500', label: 'Online' },
  stale: { icon: AlertTriangle, color: 'text-amber-500', label: 'Stale Data' },
  offline: { icon: WifiOff, color: 'text-red-500', label: 'Offline' },
};

export function SensorDetailModal({ sensor, open, onClose }: SensorDetailModalProps) {
  if (!sensor) return null;

  const statusInfo = statusConfig[sensor.status];
  const StatusIcon = statusInfo.icon;
  const commInfo = commStatusConfig[sensor.commStatus];
  const CommIcon = commInfo.icon;

  // Calculate statistics from history
  const historyValues = sensor.history.map(h => h.value);
  const avgValue = historyValues.length > 0
    ? historyValues.reduce((a, b) => a + b, 0) / historyValues.length
    : sensor.currentValue;
  const minValue = historyValues.length > 0 ? Math.min(...historyValues) : sensor.currentValue;
  const maxValue = historyValues.length > 0 ? Math.max(...historyValues) : sensor.currentValue;

  // Calculate deviation from setpoint
  const deviation = sensor.setpoint
    ? sensor.currentValue - sensor.setpoint
    : null;

  // Calculate trend
  const lastTwo = sensor.history.slice(-2);
  const trend = lastTwo.length === 2
    ? lastTwo[1].value > lastTwo[0].value ? 'up'
    : lastTwo[1].value < lastTwo[0].value ? 'down'
    : 'stable'
    : 'stable';
  const rateOfChange = lastTwo.length === 2 ? lastTwo[1].value - lastTwo[0].value : 0;

  // Prepare chart data
  const chartData = sensor.history.map((reading, index) => ({
    time: format(reading.timestamp, 'HH:mm'),
    value: reading.value,
    index,
  }));

  // Calculate percentage in range
  const range = sensor.maxThreshold - sensor.minThreshold;
  const percentage = ((sensor.currentValue - sensor.minThreshold) / range) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Time in current state (simulated)
  const timeInState = formatDistanceToNow(new Date(Date.now() - Math.random() * 3600000), { addSuffix: false });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 border-2', statusInfo.bg, 'border-slate-300')}>
                <Activity className={cn('h-5 w-5', statusInfo.color)} />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-slate-700">{sensor.name}</DialogTitle>
                <p className="text-[10px] text-slate-500 font-mono">{sensor.type.toUpperCase()} • {sensor.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('px-2 py-1 text-[10px] font-bold', statusInfo.bg, statusInfo.color)}>
                {statusInfo.label}
              </span>
              <span className={cn('flex items-center gap-1 px-2 py-1 text-[10px] font-bold', commInfo.color)}>
                <CommIcon className="h-3 w-3" />
                {commInfo.label}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Current Value Section */}
          <div className="grid grid-cols-2 gap-4">
            {/* Main Value */}
            <div className="border-2 border-slate-300 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Value</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  'text-4xl font-bold font-mono tracking-tight',
                  statusInfo.color
                )}>
                  {sensor.currentValue.toFixed(sensor.type === 'pH' ? 2 : 1)}
                </span>
                <span className="text-lg text-slate-500">{sensor.unit}</span>
                <div className="ml-auto flex items-center gap-1">
                  {trend === 'up' && <TrendingUp className="h-5 w-5 text-amber-500" />}
                  {trend === 'down' && <TrendingDown className="h-5 w-5 text-blue-500" />}
                  {trend === 'stable' && <Minus className="h-5 w-5 text-slate-400" />}
                  {rateOfChange !== 0 && (
                    <span className={cn(
                      'text-sm font-mono font-bold',
                      rateOfChange > 0 ? 'text-amber-600' : 'text-blue-600'
                    )}>
                      {rateOfChange > 0 ? '+' : ''}{rateOfChange.toFixed(2)}/h
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                  <span>{sensor.minThreshold} {sensor.unit}</span>
                  {sensor.setpoint && <span>SP: {sensor.setpoint}</span>}
                  <span>{sensor.maxThreshold} {sensor.unit}</span>
                </div>
                <div className="relative h-3 bg-slate-200">
                  <div
                    className={cn(
                      'h-full transition-all',
                      sensor.status === 'normal' && 'bg-emerald-500',
                      sensor.status === 'warning' && 'bg-amber-500',
                      sensor.status === 'critical' && 'bg-red-500'
                    )}
                    style={{ width: `${clampedPercentage}%` }}
                  />
                  {sensor.setpoint && (
                    <div
                      className="absolute top-0 h-full w-1 bg-slate-800"
                      style={{ left: `${((sensor.setpoint - sensor.minThreshold) / range) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Setpoint & Deviation */}
            <div className="border-2 border-slate-300 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Setpoint & Deviation</span>
              </div>
              {sensor.setpoint ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold font-mono text-slate-700">{sensor.setpoint}</span>
                    <span className="text-sm text-slate-500">{sensor.unit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">Deviation:</span>
                    <span className={cn(
                      'text-lg font-mono font-bold',
                      Math.abs(deviation!) < range * 0.1 ? 'text-emerald-600' :
                      Math.abs(deviation!) < range * 0.2 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {deviation! > 0 ? '+' : ''}{deviation!.toFixed(2)} {sensor.unit}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2">
                    {Math.abs(deviation!) < range * 0.1 ? 'Within acceptable range' :
                     Math.abs(deviation!) < range * 0.2 ? 'Approaching limit' : 'Significant deviation'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400">No setpoint configured</p>
              )}
            </div>
          </div>

          {/* Statistics Row */}
          <div className="grid grid-cols-4 gap-3">
            <div className="border-2 border-slate-300 bg-white p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">24h Average</span>
              <span className="text-lg font-bold font-mono text-slate-700">{avgValue.toFixed(1)}</span>
              <span className="text-xs text-slate-400 ml-1">{sensor.unit}</span>
            </div>
            <div className="border-2 border-slate-300 bg-white p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">24h Min</span>
              <span className="text-lg font-bold font-mono text-blue-600">{minValue.toFixed(1)}</span>
              <span className="text-xs text-slate-400 ml-1">{sensor.unit}</span>
            </div>
            <div className="border-2 border-slate-300 bg-white p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">24h Max</span>
              <span className="text-lg font-bold font-mono text-amber-600">{maxValue.toFixed(1)}</span>
              <span className="text-xs text-slate-400 ml-1">{sensor.unit}</span>
            </div>
            <div className="border-2 border-slate-300 bg-white p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Time in State</span>
              <span className="text-lg font-bold font-mono text-slate-700">{timeInState}</span>
            </div>
          </div>

          {/* History Chart */}
          <div className="border-2 border-slate-300 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">24 Hour History</span>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    domain={[sensor.minThreshold * 0.9, sensor.maxThreshold * 1.1]}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} ${sensor.unit}`, 'Value']}
                  />
                  {/* Threshold lines */}
                  <ReferenceLine y={sensor.minThreshold} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Min', fontSize: 9, fill: '#ef4444' }} />
                  <ReferenceLine y={sensor.maxThreshold} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Max', fontSize: 9, fill: '#ef4444' }} />
                  {sensor.setpoint && (
                    <ReferenceLine y={sensor.setpoint} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'SP', fontSize: 9, fill: '#3b82f6' }} />
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={sensor.status === 'normal' ? '#10b981' : sensor.status === 'warning' ? '#f59e0b' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-2 border-slate-300 bg-slate-50 p-3">
            <div className="grid grid-cols-3 gap-4 text-[10px]">
              <div>
                <span className="text-slate-500">Last Updated:</span>
                <span className="ml-2 font-mono text-slate-700">{format(sensor.lastUpdated, 'MMM dd, HH:mm:ss')}</span>
              </div>
              <div>
                <span className="text-slate-500">Sensor ID:</span>
                <span className="ml-2 font-mono text-slate-700">{sensor.id}</span>
              </div>
              <div>
                <span className="text-slate-500">Plant ID:</span>
                <span className="ml-2 font-mono text-slate-700">{sensor.plantId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-4 py-3 border-t-2 border-slate-300 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
