'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ManualReading, Sensor } from '@/types';

interface ManualReadingsState {
  readings: ManualReading[];
  addReading: (reading: Omit<ManualReading, 'id'>) => void;
  getReadingsForSensor: (sensorId: string) => ManualReading[];
  getRecentReadings: (limit?: number) => ManualReading[];
  deleteReading: (id: string) => void;
  clearAllReadings: () => void;
}

export const useManualReadingsStore = create<ManualReadingsState>()(
  persist(
    (set, get) => ({
      readings: [],

      addReading: (reading) => {
        const newReading: ManualReading = {
          ...reading,
          id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          readings: [newReading, ...state.readings],
        }));
      },

      getReadingsForSensor: (sensorId) => {
        return get().readings.filter((r) => r.sensorId === sensorId);
      },

      getRecentReadings: (limit = 50) => {
        return get().readings.slice(0, limit);
      },

      deleteReading: (id) => {
        set((state) => ({
          readings: state.readings.filter((r) => r.id !== id),
        }));
      },

      clearAllReadings: () => {
        set({ readings: [] });
      },
    }),
    {
      name: 'aquaflow-manual-readings',
      // Serialize dates properly
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Convert date strings back to Date objects
          if (parsed.state?.readings) {
            parsed.state.readings = parsed.state.readings.map((r: ManualReading) => ({
              ...r,
              timestamp: new Date(r.timestamp),
            }));
          }
          return parsed;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
