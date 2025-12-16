import { Plant } from '@/types';

export const mockPlants: Plant[] = [
  {
    id: 'plant-1',
    name: 'Chennai WTP-01',
    location: 'Chennai, Tamil Nadu',
    region: 'South',
    status: 'online',
    sensorCount: 52,
    lastUpdated: new Date(),
    coordinates: { lat: 13.0827, lng: 80.2707 },
  },
  {
    id: 'plant-2',
    name: 'Mumbai WTP-02',
    location: 'Mumbai, Maharashtra',
    region: 'West',
    status: 'online',
    sensorCount: 48,
    lastUpdated: new Date(),
    coordinates: { lat: 19.0760, lng: 72.8777 },
  },
  {
    id: 'plant-3',
    name: 'Delhi WTP-03',
    location: 'New Delhi',
    region: 'North',
    status: 'warning',
    sensorCount: 45,
    lastUpdated: new Date(),
    coordinates: { lat: 28.6139, lng: 77.2090 },
  },
  {
    id: 'plant-4',
    name: 'Bangalore WTP-04',
    location: 'Bangalore, Karnataka',
    region: 'South',
    status: 'online',
    sensorCount: 42,
    lastUpdated: new Date(),
    coordinates: { lat: 12.9716, lng: 77.5946 },
  },
  {
    id: 'plant-5',
    name: 'Hyderabad WTP-05',
    location: 'Hyderabad, Telangana',
    region: 'South',
    status: 'online',
    sensorCount: 38,
    lastUpdated: new Date(),
    coordinates: { lat: 17.3850, lng: 78.4867 },
  },
  {
    id: 'plant-6',
    name: 'Pune WTP-06',
    location: 'Pune, Maharashtra',
    region: 'West',
    status: 'offline',
    sensorCount: 25,
    lastUpdated: new Date(Date.now() - 3600000), // 1 hour ago
    coordinates: { lat: 18.5204, lng: 73.8567 },
  },
];

export const getPlantById = (id: string): Plant | undefined => {
  return mockPlants.find(plant => plant.id === id);
};

export const getPlantsByStatus = (status: Plant['status']): Plant[] => {
  return mockPlants.filter(plant => plant.status === status);
};

export const getPlantsByRegion = (region: string): Plant[] => {
  return mockPlants.filter(plant => plant.region === region);
};

export const getTotalSensorCount = (): number => {
  return mockPlants.reduce((acc, plant) => acc + plant.sensorCount, 0);
};

export const getOnlinePlantsCount = (): number => {
  return mockPlants.filter(plant => plant.status === 'online').length;
};
