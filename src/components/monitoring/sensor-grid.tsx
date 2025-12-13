'use client';

import { useState, useMemo } from 'react';
import { SensorCard } from './sensor-card';
import { SensorDetailModal } from './sensor-detail-modal';
import { Sensor, Plant } from '@/types';
import { RefreshCw, Activity, AlertTriangle, AlertCircle, CheckCircle2, Clock, Search, X, Maximize2, Minimize2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SensorGridProps {
  plant: Plant | null;
  sensors: Sensor[];
  onRefresh?: () => void;
}

type FilterType = 'all' | 'normal' | 'warning' | 'critical';

export function SensorGrid({ plant, sensors, onRefresh }: SensorGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  if (!plant) {
    return (
      <div className="h-full flex flex-col items-center justify-center border-2 border-slate-300 bg-white text-slate-400">
        <Activity className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-sm">Select a plant to view sensors</p>
      </div>
    );
  }

  // Calculate stats
  const normalCount = sensors.filter(s => s.status === 'normal').length;
  const warningCount = sensors.filter(s => s.status === 'warning').length;
  const criticalCount = sensors.filter(s => s.status === 'critical').length;
  const offlineCount = sensors.filter(s => s.commStatus === 'offline').length;
  const healthPercentage = sensors.length > 0
    ? Math.round((normalCount / sensors.length) * 100)
    : 0;

  // Filter sensors
  const filteredSensors = useMemo(() => {
    let result = sensors;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.type.toLowerCase().includes(query)
      );
    }

    return result;
  }, [sensors, statusFilter, searchQuery]);

  // Group sensors by type category
  const qualitySensors = filteredSensors.filter(s => ['pH', 'turbidity', 'chlorine', 'DO', 'ORP', 'conductivity'].includes(s.type));
  const processSensors = filteredSensors.filter(s => ['flow', 'pressure', 'temperature', 'level'].includes(s.type));

  const handleSensorClick = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setDetailModalOpen(true);
  };

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (!isFullScreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={cn(
      'space-y-4',
      isFullScreen && 'fixed inset-0 z-50 bg-slate-100 p-4 overflow-auto'
    )}>
      {/* Header Bar */}
      <div className="border-2 border-slate-300 bg-white overflow-hidden">
        <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-700">{plant.name}</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600">LIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Clock className="h-3 w-3" />
              <span className="font-mono">3s refresh</span>
            </div>
            <button
              onClick={handleToggleFullScreen}
              className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-200 transition-colors"
              title={isFullScreen ? 'Exit full screen' : 'Full screen mode'}
            >
              {isFullScreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </button>
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-5 divide-x divide-slate-200">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</span>
            </div>
            <p className="text-xl font-bold font-mono text-slate-700">{sensors.length}</p>
          </div>
          <div className="px-4 py-3 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Normal</span>
            </div>
            <p className="text-xl font-bold font-mono text-emerald-600">{normalCount}</p>
          </div>
          <div className="px-4 py-3 border-l-[3px] border-l-amber-500">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Warning</span>
            </div>
            <p className="text-xl font-bold font-mono text-amber-600">{warningCount}</p>
          </div>
          <div className="px-4 py-3 border-l-[3px] border-l-red-500">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Critical</span>
            </div>
            <p className="text-xl font-bold font-mono text-red-600">{criticalCount}</p>
          </div>
          <div className="px-4 py-3 border-l-[3px] border-l-slate-500">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Offline</span>
            </div>
            <p className="text-xl font-bold font-mono text-slate-600">{offlineCount}</p>
          </div>
        </div>
      </div>

      {/* Health Bar */}
      <div className="border-2 border-slate-300 bg-white px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant Health Score</span>
          <span className={cn(
            'text-sm font-mono font-bold',
            healthPercentage >= 80 ? 'text-emerald-600' :
            healthPercentage >= 50 ? 'text-amber-600' : 'text-red-600'
          )}>{healthPercentage}%</span>
        </div>
        <div className="h-2 bg-slate-200 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500',
              healthPercentage >= 80 ? 'bg-emerald-500' :
              healthPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
            )}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-emerald-500" />
            <span className="text-[10px] text-slate-500">{normalCount} Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-amber-500" />
            <span className="text-[10px] text-slate-500">{warningCount} Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-red-500" />
            <span className="text-[10px] text-slate-500">{criticalCount} Critical</span>
          </div>
          {offlineCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-slate-400" />
              <span className="text-[10px] text-slate-500">{offlineCount} Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="border-2 border-slate-300 bg-white px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search sensors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-8 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
            {(['all', 'normal', 'warning', 'critical'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  'px-2.5 py-1 text-[10px] font-bold uppercase transition-colors',
                  statusFilter === filter
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div className="flex items-center text-[10px] text-slate-500 sm:ml-auto">
            Showing {filteredSensors.length} of {sensors.length} sensors
          </div>
        </div>
      </div>

      {/* Water Quality Sensors */}
      {qualitySensors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-slate-300" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2">
              Water Quality Parameters
            </span>
            <div className="h-px flex-1 bg-slate-300" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {qualitySensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                onClick={() => handleSensorClick(sensor)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Process Sensors */}
      {processSensors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-slate-300" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2">
              Process Parameters
            </span>
            <div className="h-px flex-1 bg-slate-300" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {processSensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                onClick={() => handleSensorClick(sensor)}
              />
            ))}
          </div>
        </div>
      )}

      {filteredSensors.length === 0 && sensors.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-slate-300 bg-white text-slate-400">
          <Search className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-sm">No sensors match your filter</p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
            className="text-xs text-blue-600 hover:underline mt-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {sensors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-slate-300 bg-white text-slate-400">
          <Activity className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-sm">No sensors available for this plant</p>
        </div>
      )}

      {/* Sensor Detail Modal */}
      <SensorDetailModal
        sensor={selectedSensor}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />
    </div>
  );
}
