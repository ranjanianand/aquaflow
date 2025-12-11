'use client';

import { mockPlants } from '@/data/mock-plants';
import { cn } from '@/lib/utils';

interface ParameterStatus {
  plantId: string;
  plantName: string;
  pH: 'good' | 'attention' | 'issue';
  temperature: 'good' | 'attention' | 'issue';
  pressure: 'good' | 'attention' | 'issue';
  flowRate: 'good' | 'attention' | 'issue';
  turbidity: 'good' | 'attention' | 'issue';
  chlorine: 'good' | 'attention' | 'issue';
}

// Seeded random for deterministic status
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getRandomStatus = (seed: number): 'good' | 'attention' | 'issue' => {
  const rand = seededRandom(seed);
  if (rand > 0.9) return 'issue';
  if (rand > 0.75) return 'attention';
  return 'good';
};

// Generate status data for each plant
const generatePlantStatuses = (): ParameterStatus[] => {
  return mockPlants.map((plant, plantIdx) => ({
    plantId: plant.id,
    plantName: plant.name,
    pH: getRandomStatus(plantIdx * 6 + 1),
    temperature: getRandomStatus(plantIdx * 6 + 2),
    pressure: getRandomStatus(plantIdx * 6 + 3),
    flowRate: getRandomStatus(plantIdx * 6 + 4),
    turbidity: getRandomStatus(plantIdx * 6 + 5),
    chlorine: getRandomStatus(plantIdx * 6 + 6),
  }));
};

const parameters = [
  { key: 'pH', label: 'pH' },
  { key: 'temperature', label: 'Temp' },
  { key: 'pressure', label: 'Press' },
  { key: 'flowRate', label: 'Flow' },
  { key: 'turbidity', label: 'Turb' },
  { key: 'chlorine', label: 'Cl₂' },
];

// Mild multi-color status indicators
const statusStyles = {
  good: {
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50',
  },
  attention: {
    dot: 'bg-amber-400',
    bg: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50',
  },
  issue: {
    dot: 'bg-rose-400',
    bg: 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50',
  },
};

export function PlantHealthMatrix() {
  const plantStatuses = generatePlantStatuses();

  // Count totals
  const totals = {
    good: 0,
    attention: 0,
    issue: 0,
  };

  plantStatuses.forEach((plant) => {
    parameters.forEach((param) => {
      const status = plant[param.key as keyof ParameterStatus] as 'good' | 'attention' | 'issue';
      totals[status]++;
    });
  });

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-[13px] font-semibold">Plant Health Matrix</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            <span className="text-[11px] text-muted-foreground">{totals.good} Good</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
            <span className="text-[11px] text-muted-foreground">{totals.attention} Attention</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />
            <span className="text-[11px] text-muted-foreground">{totals.issue} Issue</span>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="p-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide pb-3 pr-4">
                Plant
              </th>
              {parameters.map((param) => (
                <th
                  key={param.key}
                  className="text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wide pb-3 px-2"
                >
                  {param.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plantStatuses.map((plant, idx) => (
              <tr key={plant.plantId} className={idx % 2 === 0 ? '' : 'bg-muted/30'}>
                <td className="py-2.5 pr-4">
                  <span className="text-[12px] font-medium">{plant.plantName}</span>
                </td>
                {parameters.map((param) => {
                  const status = plant[param.key as keyof ParameterStatus] as 'good' | 'attention' | 'issue';
                  return (
                    <td key={param.key} className="py-2.5 px-2">
                      <div className="flex justify-center">
                        <button
                          className={cn(
                            'h-6 w-10 rounded transition-colors',
                            statusStyles[status].bg
                          )}
                          title={`${plant.plantName} - ${param.label}: ${status}`}
                        >
                          <span
                            className={cn(
                              'block h-2 w-2 rounded-full mx-auto',
                              statusStyles[status].dot
                            )}
                          />
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
