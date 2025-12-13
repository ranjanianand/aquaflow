'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, X, Volume2, VolumeX, ChevronRight } from 'lucide-react';

interface CriticalAlarm {
  id: string;
  type: string;
  location: string;
  value: string;
  threshold: string;
  duration: string;
  timestamp: Date;
}

// Mock critical alarms - in production this would come from real-time data
const criticalAlarms: CriticalAlarm[] = [
  {
    id: '1',
    type: 'pH Level HIGH',
    location: 'Plant C - Tank 3',
    value: '8.9 pH',
    threshold: '> 8.5 pH',
    duration: '5m 23s',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
];

export function CriticalAlarmBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAlarmIndex, setCurrentAlarmIndex] = useState(0);

  // Rotate through multiple alarms if present
  useEffect(() => {
    if (criticalAlarms.length <= 1) return;

    const rotateInterval = setInterval(() => {
      setCurrentAlarmIndex(prev => (prev + 1) % criticalAlarms.length);
    }, 5000);

    return () => clearInterval(rotateInterval);
  }, []);

  if (criticalAlarms.length === 0 || !isVisible) return null;

  const currentAlarm = criticalAlarms[currentAlarmIndex];

  return (
    <div className="bg-white border-b border-slate-200 border-l-4 border-l-red-500">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Status indicator and alarm type */}
        <div className="flex items-center gap-3">
          {/* Alarm icon with pulse indicator */}
          <div className="relative">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded">
              CRITICAL
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {currentAlarm.type}
            </span>
          </div>

          {criticalAlarms.length > 1 && (
            <span className="text-[10px] text-slate-400 font-mono">
              [{currentAlarmIndex + 1}/{criticalAlarms.length}]
            </span>
          )}
        </div>

        {/* Center: Alarm Details */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Location:</span>
            <span className="text-slate-700 font-medium">{currentAlarm.location}</span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Value:</span>
            <span className="font-mono font-bold text-red-600">{currentAlarm.value}</span>
            <span className="text-xs text-slate-400">({currentAlarm.threshold})</span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Duration:</span>
            <span className="font-mono font-semibold text-amber-600">{currentAlarm.duration}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              'p-1.5 rounded transition-colors',
              isMuted ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-700'
            )}
            title={isMuted ? 'Unmute alarm' : 'Mute alarm'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors">
            ACK
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
            title="Dismiss temporarily"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
