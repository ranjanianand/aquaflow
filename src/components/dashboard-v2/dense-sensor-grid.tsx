'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
  Settings2,
  Plus,
  Check,
  Search,
  X,
  Filter,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useDashboardPreferencesStore } from '@/stores/dashboard-preferences-store';
import { mockSensors, getSensorsByPlant } from '@/data/mock-sensors';
import { Sensor, SensorType } from '@/types';

// Plant data
const plants = [
  { id: 'plant-1', name: 'Chennai WTP', location: 'Chennai North - Main Treatment', status: 'online' as const },
  { id: 'plant-2', name: 'Mumbai WTP', location: 'Mumbai South - Secondary', status: 'online' as const },
  { id: 'plant-3', name: 'Bangalore WTP', location: 'Bangalore Central - Distribution', status: 'warning' as const },
  { id: 'plant-4', name: 'Hyderabad WTP', location: 'Hyderabad East - RO Plant', status: 'online' as const },
  { id: 'plant-5', name: 'Pune WTP', location: 'Pune West - Treatment', status: 'warning' as const },
  { id: 'plant-6', name: 'Delhi WTP', location: 'Delhi NCR - Compact', status: 'offline' as const },
];

const sensorTypeLabels: Record<SensorType, string> = {
  pH: 'pH',
  flow: 'Flow',
  pressure: 'Pressure',
  temperature: 'Temperature',
  turbidity: 'Turbidity',
  chlorine: 'Chlorine',
  DO: 'Dissolved Oxygen',
  level: 'Level',
  conductivity: 'Conductivity',
  ORP: 'ORP',
};

function SensorCard({ sensor }: { sensor: Sensor }) {
  const range = sensor.maxThreshold - sensor.minThreshold;
  const percentage = ((sensor.currentValue - sensor.minThreshold) / range) * 100;
  const setpointPercentage = sensor.setpoint
    ? ((sensor.setpoint - sensor.minThreshold) / range) * 100
    : null;

  const lastTwo = sensor.history.slice(-2);
  const trend = lastTwo.length === 2
    ? lastTwo[1].value > lastTwo[0].value ? 'up'
    : lastTwo[1].value < lastTwo[0].value ? 'down' : 'stable'
    : 'stable';
  const rateOfChange = lastTwo.length === 2 ? lastTwo[1].value - lastTwo[0].value : 0;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'relative p-3 bg-white border border-slate-300',
        'hover:border-slate-400 transition-colors cursor-pointer',
        sensor.status === 'critical' && 'border-l-[3px] border-l-red-600',
        sensor.status === 'warning' && 'border-l-[3px] border-l-amber-500',
        sensor.commStatus === 'stale' && 'opacity-75',
        sensor.commStatus === 'offline' && 'opacity-50 bg-slate-100'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {sensor.commStatus === 'offline' ? (
            <WifiOff className="h-3 w-3 text-red-600" />
          ) : sensor.commStatus === 'stale' ? (
            <AlertCircle className="h-3 w-3 text-amber-600" />
          ) : (
            <Wifi className="h-3 w-3 text-emerald-600" />
          )}
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide truncate max-w-[120px]">
            {sensor.name}
          </span>
        </div>
        <span className={cn(
          'text-[8px] font-bold px-1.5 py-0.5 flex-shrink-0',
          sensor.status === 'normal' && 'bg-emerald-100 text-emerald-700',
          sensor.status === 'warning' && 'bg-amber-100 text-amber-700',
          sensor.status === 'critical' && 'bg-red-100 text-red-700'
        )}>
          {sensor.status === 'normal' ? 'OK' : sensor.status === 'warning' ? 'WARN' : 'CRIT'}
        </span>
      </div>

      {/* Tag */}
      {sensor.tag && (
        <p className="text-[9px] font-mono text-slate-400 mb-1.5">{sensor.tag}</p>
      )}

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className={cn(
          'text-2xl font-bold tabular-nums leading-none',
          sensor.status === 'critical' && 'text-red-700',
          sensor.status === 'warning' && 'text-amber-700',
          sensor.status === 'normal' && 'text-slate-900'
        )}>
          {sensor.currentValue.toFixed(sensor.type === 'flow' ? 0 : 1)}
        </span>
        <span className="text-xs text-slate-500 font-medium">{sensor.unit}</span>
        <div className={cn(
          'ml-auto flex items-center gap-0.5 text-xs font-semibold',
          trend === 'up' && 'text-emerald-700',
          trend === 'down' && 'text-blue-700',
          trend === 'stable' && 'text-slate-500'
        )}>
          <TrendIcon className="h-3.5 w-3.5" />
          {rateOfChange !== 0 && (
            <span className="tabular-nums">
              {rateOfChange > 0 ? '+' : ''}{rateOfChange.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-slate-200 overflow-hidden">
        <div
          className="absolute h-full bg-emerald-100/50"
          style={{ left: '20%', right: '20%' }}
        />
        <div
          className={cn(
            'absolute h-full transition-all',
            sensor.status === 'critical' && 'bg-red-600',
            sensor.status === 'warning' && 'bg-amber-500',
            sensor.status === 'normal' && 'bg-emerald-600'
          )}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
        {setpointPercentage !== null && (
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-slate-900"
            style={{ left: `${setpointPercentage}%` }}
            title={`Setpoint: ${sensor.setpoint}`}
          />
        )}
      </div>

      {/* Range */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-slate-500 tabular-nums font-medium">{sensor.minThreshold}</span>
        {sensor.setpoint && (
          <span className="text-[10px] text-slate-700 font-semibold">SP: {sensor.setpoint}</span>
        )}
        <span className="text-[10px] text-slate-500 tabular-nums font-medium">{sensor.maxThreshold}</span>
      </div>
    </div>
  );
}

// Sensor Selection Modal
function SensorSelectionModal({
  open,
  onClose,
  plantId,
  plantName,
}: {
  open: boolean;
  onClose: () => void;
  plantId: string;
  plantName: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<SensorType | 'all'>('all');

  const { selectedSensors, toggleSensor, setSelectedSensors, clearPlantSensors } =
    useDashboardPreferencesStore();

  const currentSelected = selectedSensors[plantId] || [];
  const allPlantSensors = useMemo(() => getSensorsByPlant(plantId), [plantId]);

  // Get unique sensor types for this plant
  const sensorTypes = useMemo(() => {
    const types = new Set(allPlantSensors.map((s) => s.type));
    return Array.from(types).sort();
  }, [allPlantSensors]);

  // Filter sensors
  const filteredSensors = useMemo(() => {
    return allPlantSensors.filter((sensor) => {
      const matchesSearch =
        searchTerm === '' ||
        sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sensor.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sensor.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || sensor.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [allPlantSensors, searchTerm, selectedType]);

  // Group sensors by location
  const groupedSensors = useMemo(() => {
    const groups: Record<string, Sensor[]> = {};
    filteredSensors.forEach((sensor) => {
      const location = sensor.location || 'Other';
      if (!groups[location]) groups[location] = [];
      groups[location].push(sensor);
    });
    return groups;
  }, [filteredSensors]);

  const handleSelectAll = () => {
    const toAdd = filteredSensors.slice(0, 12).map((s) => s.id);
    setSelectedSensors(plantId, toAdd);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-w-4xl p-0 gap-0 border-2 border-slate-300 rounded-none max-h-[85vh] flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 border-2 border-slate-300">
                <Settings2 className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-slate-700">
                  Customize Sensors - {plantName}
                </DialogTitle>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Select up to 12 sensors to display on your dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span
                  className={cn(
                    'text-lg font-bold font-mono',
                    currentSelected.length >= 12 ? 'text-amber-600' : 'text-slate-700'
                  )}
                >
                  {currentSelected.length}
                </span>
                <span className="text-xs text-slate-500">/12 selected</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 transition-colors"
              >
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="p-3 border-b-2 border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sensors by name, tag, or location..."
                className="w-full pl-8 pr-3 py-2 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
              />
            </div>

            {/* Type filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as SensorType | 'all')}
              className="px-3 py-2 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 min-w-[150px]"
            >
              <option value="all">All Types ({allPlantSensors.length})</option>
              {sensorTypes.map((type) => (
                <option key={type} value={type}>
                  {sensorTypeLabels[type]} ({allPlantSensors.filter((s) => s.type === type).length})
                </option>
              ))}
            </select>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleSelectAll}
              disabled={currentSelected.length >= 12}
              className={cn(
                'px-3 py-1.5 text-[10px] font-bold uppercase',
                'bg-white border-2 border-slate-300 text-slate-600',
                'hover:bg-slate-50 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Select First 12
            </button>
            <button
              onClick={() => clearPlantSensors(plantId)}
              disabled={currentSelected.length === 0}
              className={cn(
                'px-3 py-1.5 text-[10px] font-bold uppercase',
                'bg-white border-2 border-slate-300 text-slate-600',
                'hover:bg-slate-50 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Clear All
            </button>
            <span className="text-[10px] text-slate-500 ml-auto">
              Showing {filteredSensors.length} of {allPlantSensors.length} sensors
            </span>
          </div>
        </div>

        {/* Sensor List - Grouped by Location */}
        <div className="flex-1 overflow-y-auto p-3 bg-slate-100">
          {Object.keys(groupedSensors).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedSensors).map(([location, sensors]) => (
                <div key={location}>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                    {location} ({sensors.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {sensors.map((sensor) => {
                      const isSelected = currentSelected.includes(sensor.id);
                      const isDisabled = !isSelected && currentSelected.length >= 12;

                      return (
                        <button
                          key={sensor.id}
                          onClick={() => toggleSensor(plantId, sensor.id)}
                          disabled={isDisabled}
                          className={cn(
                            'relative p-3 text-left bg-white border-2 transition-all',
                            isSelected
                              ? 'border-slate-700 bg-slate-50'
                              : 'border-slate-300 hover:border-slate-400',
                            isDisabled && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute top-1 right-1 p-0.5 bg-slate-700">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}

                          {/* Sensor info */}
                          <div className="pr-5">
                            <p className="text-[10px] font-bold text-slate-700 truncate">
                              {sensor.type.toUpperCase()}
                            </p>
                            <p className="text-[9px] font-mono text-slate-400 truncate">
                              {sensor.tag}
                            </p>
                          </div>

                          {/* Value and status */}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-bold font-mono text-slate-700">
                              {sensor.currentValue.toFixed(sensor.type === 'flow' ? 0 : 1)}
                            </span>
                            <span className="text-[10px] text-slate-500">{sensor.unit}</span>
                          </div>

                          {/* Status badge */}
                          <span
                            className={cn(
                              'absolute bottom-1 right-1 px-1 py-0.5 text-[8px] font-bold uppercase',
                              sensor.status === 'normal' && 'bg-emerald-100 text-emerald-700',
                              sensor.status === 'warning' && 'bg-amber-100 text-amber-700',
                              sensor.status === 'critical' && 'bg-red-100 text-red-700'
                            )}
                          >
                            {sensor.status === 'normal' ? 'OK' : sensor.status === 'warning' ? 'WARN' : 'CRIT'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No sensors match your filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                }}
                className="mt-2 text-sm text-slate-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="bg-slate-100 px-4 py-3 border-t-2 border-slate-300 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <p className="text-[10px] text-slate-500">
              {currentSelected.length === 0
                ? 'No sensors selected - dashboard will show empty state'
                : `${currentSelected.length} sensor${currentSelected.length > 1 ? 's' : ''} will be displayed`}
            </p>
            <button
              onClick={onClose}
              className={cn(
                'px-4 py-2 text-[10px] font-bold uppercase',
                'bg-slate-700 text-white',
                'hover:bg-slate-800 transition-colors',
                'flex items-center gap-2'
              )}
            >
              <Check className="h-3 w-3" />
              Done
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Default sensors to show per plant (for prototype demo)
const DEFAULT_SENSOR_COUNT = 4;

export function DenseSensorGrid() {
  const [showModal, setShowModal] = useState(false);

  const { activeTab, setActiveTab, selectedSensors } = useDashboardPreferencesStore();

  // Set default active tab if not set
  const currentTab = activeTab || plants[0].id;

  // Get current plant info
  const currentPlant = plants.find((p) => p.id === currentTab) || plants[0];

  // Get all sensors for current plant
  const allPlantSensors = useMemo(() => getSensorsByPlant(currentTab), [currentTab]);

  // Get selected sensors for current plant OR use default sensors
  const currentSelectedIds = selectedSensors[currentTab] || [];
  const displaySensors = useMemo(() => {
    // If user has selected sensors, use those
    if (currentSelectedIds.length > 0) {
      return currentSelectedIds
        .map((id) => mockSensors.find((s) => s.id === id))
        .filter((s): s is Sensor => s !== undefined);
    }

    // Otherwise, show default sensors (first 4 from plant, prioritizing critical/warning)
    const sorted = [...allPlantSensors].sort((a, b) => {
      // Priority: critical > warning > normal
      const statusOrder = { critical: 0, warning: 1, normal: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
    return sorted.slice(0, DEFAULT_SENSOR_COUNT);
  }, [currentSelectedIds, allPlantSensors]);

  // Calculate stats for current plant
  const stats = useMemo(() => {
    const online = displaySensors.filter((s) => s.commStatus === 'online').length;
    const warning = displaySensors.filter((s) => s.status === 'warning').length;
    const critical = displaySensors.filter((s) => s.status === 'critical').length;
    return { online, warning, critical, total: displaySensors.length };
  }, [displaySensors]);

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            My Sensors
          </h2>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-semibold">{stats.online}/{stats.total}</span>
            <span className="text-slate-400">online</span>
          </span>
          {stats.critical > 0 && (
            <span className="flex items-center gap-1.5 text-red-600 font-semibold">
              <AlertCircle className="h-3.5 w-3.5" />
              {stats.critical} critical
            </span>
          )}
          {stats.warning > 0 && (
            <span className="flex items-center gap-1.5 text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {stats.warning} warning
            </span>
          )}
          <span className="text-slate-400">
            Updated: <span className="font-mono">Just now</span>
          </span>
        </div>
      </div>

      {/* Plant Tabs */}
      <div className="border-2 border-slate-300 bg-white overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b-2 border-slate-200 bg-slate-50 overflow-x-auto">
          {plants.map((plant) => {
            const isActive = plant.id === currentTab;
            const plantSelectedCount = (selectedSensors[plant.id] || []).length;

            return (
              <button
                key={plant.id}
                onClick={() => setActiveTab(plant.id)}
                className={cn(
                  'flex-shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors border-r border-slate-200 last:border-r-0',
                  isActive
                    ? 'bg-white text-slate-800 border-b-2 border-b-slate-700 -mb-[2px]'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      plant.status === 'online' && 'bg-emerald-500',
                      plant.status === 'warning' && 'bg-amber-500',
                      plant.status === 'offline' && 'bg-red-500'
                    )}
                  />
                  <span>{plant.name}</span>
                  {plantSelectedCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold">
                      {plantSelectedCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Plant Info Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-700">{currentPlant.name}</h3>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 border',
                    currentPlant.status === 'online' && 'border-emerald-300 text-emerald-700 bg-emerald-50',
                    currentPlant.status === 'warning' && 'border-amber-300 text-amber-700 bg-amber-50',
                    currentPlant.status === 'offline' && 'border-red-300 text-red-700 bg-red-50'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      currentPlant.status === 'online' && 'bg-emerald-600',
                      currentPlant.status === 'warning' && 'bg-amber-500',
                      currentPlant.status === 'offline' && 'bg-red-600'
                    )}
                  />
                  {currentPlant.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentPlant.location}</p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className={cn(
                'px-3 py-1.5 text-[10px] font-bold uppercase',
                'bg-slate-700 text-white',
                'hover:bg-slate-800 transition-colors',
                'flex items-center gap-1.5'
              )}
            >
              <Settings2 className="h-3 w-3" />
              {currentSelectedIds.length > 0
                ? `Customize (${currentSelectedIds.length}/12)`
                : 'Customize Sensors'}
            </button>
          </div>

          {/* Sensor Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displaySensors.map((sensor) => (
              <SensorCard key={sensor.id} sensor={sensor} />
            ))}
            {/* Add Sensors button - always show */}
            <button
              onClick={() => setShowModal(true)}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-6',
                'border-2 border-dashed border-slate-300 bg-slate-50',
                'hover:border-slate-500 hover:bg-slate-100 transition-all',
                'text-slate-400 hover:text-slate-700 min-h-[140px]'
              )}
            >
              <Plus className="h-6 w-6" />
              <span className="text-[10px] font-bold uppercase">
                {currentSelectedIds.length > 0 ? 'Add More' : 'Customize'}
              </span>
              <span className="text-[9px] text-slate-400">
                {currentSelectedIds.length > 0
                  ? `${12 - currentSelectedIds.length} slots available`
                  : 'Select up to 12 sensors'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Sensor Selection Modal */}
      <SensorSelectionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        plantId={currentTab}
        plantName={currentPlant.name}
      />
    </div>
  );
}
