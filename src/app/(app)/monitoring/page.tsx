'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlantList } from '@/components/monitoring/plant-list';
import { SensorGrid } from '@/components/monitoring/sensor-grid';
import { mockPlants, getPlantById } from '@/data/mock-plants';
import { getSensorsByPlant, updateAllSensorsForPlant } from '@/data/mock-sensors';
import { Sensor } from '@/types';
import { MonitoringSkeleton } from '@/components/shared/loading-skeleton';

function MonitoringContent() {
  const searchParams = useSearchParams();
  const initialPlantId = searchParams.get('plant') || mockPlants[0]?.id;

  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(initialPlantId);
  const [sensors, setSensors] = useState<Sensor[]>([]);

  // Load sensors when plant changes
  useEffect(() => {
    if (selectedPlantId) {
      const plantSensors = getSensorsByPlant(selectedPlantId);
      setSensors([...plantSensors]);
    }
  }, [selectedPlantId]);

  // Simulate real-time updates - update all sensors for realistic live monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedPlantId) {
        // Update all sensors for the plant (simulates real IoT data feed)
        updateAllSensorsForPlant(selectedPlantId);

        // Refresh sensor data to reflect updates
        setSensors([...getSensorsByPlant(selectedPlantId)]);
      }
    }, 2000); // Update every 2 seconds for responsive live feel

    return () => clearInterval(interval);
  }, [selectedPlantId]);

  const selectedPlant = selectedPlantId ? getPlantById(selectedPlantId) || null : null;

  const handleRefresh = () => {
    if (selectedPlantId) {
      // Update all sensors for the plant
      updateAllSensorsForPlant(selectedPlantId);
      setSensors([...getSensorsByPlant(selectedPlantId)]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header Bar */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-white uppercase tracking-wider">Live Monitoring</span>
          <span className="text-[10px] text-slate-400">Real-time sensor data across all plants</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400">SYSTEM ONLINE</span>
        </div>
      </header>

      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          {/* Plant list - sticky on large screens */}
          <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)]">
            <PlantList
              plants={mockPlants}
              selectedPlantId={selectedPlantId}
              onSelectPlant={setSelectedPlantId}
            />
          </div>
          {/* Sensor grid - scrolls naturally */}
          <SensorGrid
            plant={selectedPlant}
            sensors={sensors}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <Suspense fallback={<MonitoringSkeleton />}>
      <MonitoringContent />
    </Suspense>
  );
}
