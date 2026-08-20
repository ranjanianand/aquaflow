import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Per-plant selected sensors (up to 12 per plant)
// Key: plantId, Value: array of selected sensor IDs
export interface PlantSensorSelection {
  [plantId: string]: string[]; // Array of SELECTED sensor IDs (max 12)
}

export interface DashboardPreferences {
  // Per-plant selected sensors
  selectedSensors: PlantSensorSelection;
  // Currently active plant tab
  activeTab: string | null;
}

interface DashboardPreferencesState extends DashboardPreferences {
  // Actions
  setActiveTab: (plantId: string) => void;
  setSelectedSensors: (plantId: string, sensorIds: string[]) => void;
  addSensor: (plantId: string, sensorId: string) => void;
  removeSensor: (plantId: string, sensorId: string) => void;
  toggleSensor: (plantId: string, sensorId: string) => void;
  clearPlantSensors: (plantId: string) => void;
  getSelectedSensors: (plantId: string) => string[];
  isSensorSelected: (plantId: string, sensorId: string) => boolean;
  getSelectedCount: (plantId: string) => number;
  clearAllPreferences: () => void;
}

const MAX_SENSORS_PER_PLANT = 12;

const defaultPreferences: DashboardPreferences = {
  selectedSensors: {},
  activeTab: null,
};

export const useDashboardPreferencesStore = create<DashboardPreferencesState>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,

      setActiveTab: (plantId) => {
        set({ activeTab: plantId });
      },

      setSelectedSensors: (plantId, sensorIds) => {
        // Limit to max sensors
        const limitedIds = sensorIds.slice(0, MAX_SENSORS_PER_PLANT);
        set((state) => ({
          selectedSensors: {
            ...state.selectedSensors,
            [plantId]: limitedIds,
          },
        }));
      },

      addSensor: (plantId, sensorId) => {
        set((state) => {
          const current = state.selectedSensors[plantId] || [];
          // Don't add if already at max or already exists
          if (current.length >= MAX_SENSORS_PER_PLANT || current.includes(sensorId)) {
            return state;
          }
          return {
            selectedSensors: {
              ...state.selectedSensors,
              [plantId]: [...current, sensorId],
            },
          };
        });
      },

      removeSensor: (plantId, sensorId) => {
        set((state) => {
          const current = state.selectedSensors[plantId] || [];
          return {
            selectedSensors: {
              ...state.selectedSensors,
              [plantId]: current.filter((id) => id !== sensorId),
            },
          };
        });
      },

      toggleSensor: (plantId, sensorId) => {
        const current = get().selectedSensors[plantId] || [];
        if (current.includes(sensorId)) {
          get().removeSensor(plantId, sensorId);
        } else {
          get().addSensor(plantId, sensorId);
        }
      },

      clearPlantSensors: (plantId) => {
        set((state) => ({
          selectedSensors: {
            ...state.selectedSensors,
            [plantId]: [],
          },
        }));
      },

      getSelectedSensors: (plantId) => {
        return get().selectedSensors[plantId] || [];
      },

      isSensorSelected: (plantId, sensorId) => {
        const selected = get().selectedSensors[plantId] || [];
        return selected.includes(sensorId);
      },

      getSelectedCount: (plantId) => {
        return (get().selectedSensors[plantId] || []).length;
      },

      clearAllPreferences: () => {
        set(defaultPreferences);
      },
    }),
    {
      name: 'aquaflow-dashboard-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
