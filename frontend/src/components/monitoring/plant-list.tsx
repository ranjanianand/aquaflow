'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Plant } from '@/types';
import { cn } from '@/lib/utils';
import { Building2, MapPin, Activity, Search, X } from 'lucide-react';

interface PlantListProps {
  plants: Plant[];
  selectedPlantId: string | null;
  onSelectPlant: (plantId: string) => void;
}

const statusLabel: Record<Plant['status'], string> = {
  online: 'ONLINE',
  warning: 'WARN',
  offline: 'OFFLINE',
};

export function PlantList({ plants, selectedPlantId, onSelectPlant }: PlantListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Count by status
  const onlineCount = plants.filter(p => p.status === 'online').length;
  const warningCount = plants.filter(p => p.status === 'warning').length;
  const offlineCount = plants.filter(p => p.status === 'offline').length;

  // Filter plants by search query
  const filteredPlants = useMemo(() => {
    if (!searchQuery.trim()) return plants;
    const query = searchQuery.toLowerCase();
    return plants.filter(plant =>
      plant.name.toLowerCase().includes(query) ||
      plant.location.toLowerCase().includes(query) ||
      plant.region.toLowerCase().includes(query)
    );
  }, [plants, searchQuery]);

  // Auto-scroll to selected plant on mount and when selection changes
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      const listRect = listRef.current.getBoundingClientRect();
      const selectedRect = selectedRef.current.getBoundingClientRect();

      // Check if selected is outside visible area
      if (selectedRect.top < listRect.top || selectedRect.bottom > listRect.bottom) {
        selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedPlantId]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden border-2 border-slate-300 bg-white">
      {/* Header */}
      <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Plants
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-600">{plants.length}</span>
        </div>
        {/* Mini status summary */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-emerald-600 font-bold">{onlineCount} ON</span>
          <span className="text-amber-600 font-bold">{warningCount} WARN</span>
          <span className="text-red-600 font-bold">{offlineCount} OFF</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3 py-2 border-b border-slate-200 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search plants..."
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
        {searchQuery && (
          <span className="text-[9px] text-slate-500 mt-1 block">
            {filteredPlants.length} of {plants.length} plants
          </span>
        )}
      </div>

      {/* Plant List */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {filteredPlants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Search className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs">No plants found</p>
            <button
              onClick={handleClearSearch}
              className="text-[10px] text-blue-600 hover:underline mt-1"
            >
              Clear search
            </button>
          </div>
        ) : (
          filteredPlants.map((plant) => {
            const isSelected = selectedPlantId === plant.id;

            return (
              <button
                key={plant.id}
                ref={isSelected ? selectedRef : null}
                onClick={() => onSelectPlant(plant.id)}
                className={cn(
                  'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                  'border-b border-slate-200 last:border-b-0',
                  'hover:bg-slate-50',
                  isSelected && 'bg-slate-100 border-l-4 border-l-blue-500',
                  !isSelected && plant.status === 'online' && 'border-l-[3px] border-l-emerald-500',
                  !isSelected && plant.status === 'warning' && 'border-l-[3px] border-l-amber-500',
                  !isSelected && plant.status === 'offline' && 'border-l-[3px] border-l-red-500'
                )}
              >
                {/* Plant info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className={cn(
                      'text-sm font-medium truncate',
                      isSelected ? 'text-blue-700' : 'text-slate-700'
                    )}>{plant.name}</h4>
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 flex-shrink-0',
                      plant.status === 'online' && 'bg-emerald-100 text-emerald-700',
                      plant.status === 'warning' && 'bg-amber-100 text-amber-700',
                      plant.status === 'offline' && 'bg-red-100 text-red-700'
                    )}>
                      {statusLabel[plant.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{plant.location}</span>
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>{plant.sensorCount}</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-4 py-2 border-t-2 border-slate-300 flex-shrink-0">
        <span className="text-[10px] text-slate-500">
          {onlineCount}/{plants.length} operational
        </span>
      </div>
    </div>
  );
}
