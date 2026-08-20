'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlantList } from '@/components/monitoring/plant-list';
import { SensorGrid } from '@/components/monitoring/sensor-grid';
import { DataFreshness } from '@/components/shared/data-freshness';
import { MonitoringSkeleton } from '@/components/shared/loading-skeleton';
import { usePlants, useSensors } from '@/lib/api/hooks';

function MonitoringContent() {
  const searchParams = useSearchParams();

  const { data: plants, error: plantsError, loading: plantsLoading } = usePlants();
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(
    searchParams.get('plant'),
  );

  // Select the first plant once the list arrives, unless the URL named one.
  useEffect(() => {
    if (!selectedPlantId && plants?.length) setSelectedPlantId(plants[0].id);
  }, [plants, selectedPlantId]);

  const {
    data: sensors, error: sensorsError, loading: sensorsLoading, refresh,
  } = useSensors(selectedPlantId);

  const selectedPlant = plants?.find((p) => p.id === selectedPlantId) ?? null;
  const error = plantsError ?? sensorsError;

  // Newest reading across the plant. Drives the freshness banner, and is not
  // the same as "now" — the whole point is to show the difference.
  const newest = sensors?.reduce<Date | null>(
    (max, s) => (!max || s.lastUpdated > max ? s.lastUpdated : max), null) ?? null;

  if (plantsLoading && !plants) return <MonitoringSkeleton />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            Live Monitoring
          </span>
          <span className="text-[10px] text-slate-400">
            Sensor readings from the ingest database
          </span>
        </div>
        {/* Replaces the hardcoded "SYSTEM ONLINE" pill. That indicator was
            always green regardless of whether any data had arrived, which is
            the one thing a status light must never do. */}
        <DataFreshness newest={newest} error={error} loading={sensorsLoading} />
      </header>

      {error && (
        <div className="bg-red-50 border-b-2 border-red-500 px-4 py-2">
          <p className="text-xs text-red-800">
            <span className="font-bold uppercase">Data unavailable</span>
            {' — '}{error.message}
            {' '}Showing the last values received.
          </p>
        </div>
      )}

      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)]">
            <PlantList
              plants={plants ?? []}
              selectedPlantId={selectedPlantId}
              onSelectPlant={setSelectedPlantId}
            />
          </div>
          <SensorGrid
            plant={selectedPlant}
            sensors={sensors ?? []}
            onRefresh={refresh}
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
