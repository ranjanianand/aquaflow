'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PlantList } from '@/components/monitoring/plant-list';
import { SensorGrid } from '@/components/monitoring/sensor-grid';
import { mockPlants, getPlantById } from '@/data/mock-plants';
import { getSensorsByPlant, updateSensorValue } from '@/data/mock-sensors';
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

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedPlantId) {
        const plantSensors = getSensorsByPlant(selectedPlantId);

        // Update a random sensor
        const randomIndex = Math.floor(Math.random() * plantSensors.length);
        if (plantSensors[randomIndex]) {
          updateSensorValue(plantSensors[randomIndex].id);
        }

        // Refresh sensor data
        setSensors([...getSensorsByPlant(selectedPlantId)]);
      }
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [selectedPlantId]);

  const selectedPlant = selectedPlantId ? getPlantById(selectedPlantId) || null : null;

  const handleRefresh = () => {
    if (selectedPlantId) {
      // Update all sensors for the plant
      const plantSensors = getSensorsByPlant(selectedPlantId);
      plantSensors.forEach((sensor) => updateSensorValue(sensor.id));
      setSensors([...getSensorsByPlant(selectedPlantId)]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Live Monitoring"
        subtitle="Real-time sensor data across all plants"
      />

      <div className="flex-1 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Plant list - sticky on large screens */}
          <div className="lg:sticky lg:top-8 lg:h-[calc(100vh-8rem)]">
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
