'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { AssetsSkeleton } from '@/components/shared/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusDot, StatusBadge } from '@/components/shared/status-badge';
import { mockPlants } from '@/data/mock-plants';
import { getSensorsByPlant } from '@/data/mock-sensors';
import { Plant } from '@/types';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Cpu,
  Calendar,
  MoreHorizontal,
  Wrench,
  GitCompareArrows,
} from 'lucide-react';
import { AssetComparison } from '@/components/assets/asset-comparison';
import { PerformanceBenchmark } from '@/components/assets/performance-benchmark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MaintenanceItem {
  id: string;
  plantName: string;
  equipment: string;
  type: string;
  scheduledDate: Date;
  status: 'scheduled' | 'overdue' | 'completed';
  assignedTo: string;
}

const maintenanceSchedule: MaintenanceItem[] = [
  {
    id: 'maint-1',
    plantName: 'Chennai WTP-01',
    equipment: 'RO Membrane Unit A',
    type: 'Preventive',
    scheduledDate: new Date(Date.now() + 2 * 24 * 3600000),
    status: 'scheduled',
    assignedTo: 'Amit Singh',
  },
  {
    id: 'maint-2',
    plantName: 'Mumbai WTP-02',
    equipment: 'Flow Sensor Array',
    type: 'Calibration',
    scheduledDate: new Date(Date.now() + 5 * 24 * 3600000),
    status: 'scheduled',
    assignedTo: 'Priya Sharma',
  },
  {
    id: 'maint-3',
    plantName: 'Delhi WTP-03',
    equipment: 'pH Sensor Bank',
    type: 'Replacement',
    scheduledDate: new Date(Date.now() - 1 * 24 * 3600000),
    status: 'overdue',
    assignedTo: 'Rahul Kumar',
  },
  {
    id: 'maint-4',
    plantName: 'Bangalore WTP-04',
    equipment: 'Pump Motor P2',
    type: 'Inspection',
    scheduledDate: new Date(Date.now() + 7 * 24 * 3600000),
    status: 'scheduled',
    assignedTo: 'Vikram Reddy',
  },
];

export default function AssetsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [plantModalOpen, setPlantModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredPlants = mockPlants.filter(
    (plant) =>
      plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPlant = () => {
    setEditingPlant(null);
    setPlantModalOpen(true);
  };

  const handleEditPlant = (plant: Plant) => {
    setEditingPlant(plant);
    setPlantModalOpen(true);
  };

  const handleSavePlant = () => {
    toast.success(editingPlant ? 'Plant updated' : 'Plant added', {
      description: editingPlant
        ? 'Plant details have been updated successfully.'
        : 'New plant has been added to the system.',
    });
    setPlantModalOpen(false);
  };

  const handleDeletePlant = (plantId: string) => {
    toast.success('Plant removed', {
      description: 'The plant has been removed from the system.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header
          title="Plants & Assets"
          subtitle="Manage facilities and equipment"
        />
        <AssetsSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Plants & Assets"
        subtitle="Manage facilities and equipment"
      />

      <div className="p-8 space-y-6">
        <Tabs defaultValue="plants">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="plants">
                <Building2 className="h-4 w-4 mr-2" />
                Plants ({mockPlants.length})
              </TabsTrigger>
              <TabsTrigger value="sensors">
                <Cpu className="h-4 w-4 mr-2" />
                Sensors
              </TabsTrigger>
              <TabsTrigger value="maintenance">
                <Wrench className="h-4 w-4 mr-2" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="comparison">
                <GitCompareArrows className="h-4 w-4 mr-2" />
                Comparison
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button onClick={handleAddPlant}>
                <Plus className="h-4 w-4 mr-1" />
                Add Plant
              </Button>
            </div>
          </div>

          {/* Plants Tab */}
          <TabsContent value="plants">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Plant Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sensors</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlants.map((plant) => (
                      <TableRow key={plant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[var(--accent-blue)]">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <span className="font-semibold">{plant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {plant.location}
                          </div>
                        </TableCell>
                        <TableCell>{plant.region}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusDot status={plant.status} pulse={plant.status === 'offline'} />
                            <span
                              className={
                                plant.status === 'online'
                                  ? 'text-[var(--success)]'
                                  : plant.status === 'warning'
                                  ? 'text-[var(--warning)]'
                                  : 'text-[var(--danger)]'
                              }
                            >
                              {plant.status.charAt(0).toUpperCase() + plant.status.slice(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            {plant.sensorCount}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(plant.lastUpdated, 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditPlant(plant)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeletePlant(plant.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sensors Tab */}
          <TabsContent value="sensors">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {['pH', 'Flow', 'Pressure', 'Temperature', 'Turbidity', 'Chlorine', 'DO', 'Level'].map(
                (sensorType) => {
                  const count = mockPlants.reduce((acc, plant) => {
                    const sensors = getSensorsByPlant(plant.id);
                    return acc + sensors.filter((s) => s.type.toLowerCase() === sensorType.toLowerCase()).length;
                  }, 0);

                  return (
                    <Card key={sensorType} className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[var(--accent-blue)]">
                          <Cpu className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{sensorType} Sensors</h3>
                          <p className="text-sm text-muted-foreground">{count} active</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Across all plants</span>
                        <StatusBadge variant="success" size="sm">Online</StatusBadge>
                      </div>
                    </Card>
                  );
                }
              )}
            </div>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader className="border-b bg-muted/50 px-6 py-4">
                <CardTitle className="text-base font-semibold">Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Plant</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceSchedule.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.plantName}</TableCell>
                        <TableCell>{item.equipment}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(item.scheduledDate, 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>{item.assignedTo}</TableCell>
                        <TableCell>
                          <StatusBadge
                            variant={
                              item.status === 'overdue'
                                ? 'danger'
                                : item.status === 'completed'
                                ? 'success'
                                : 'info'
                            }
                            size="sm"
                          >
                            {item.status}
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison">
            <div className="space-y-6">
              <AssetComparison />
              <PerformanceBenchmark />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Plant Dialog */}
      <Dialog open={plantModalOpen} onOpenChange={setPlantModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlant ? 'Edit Plant' : 'Add New Plant'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plant Name</Label>
              <Input
                placeholder="e.g., Chennai WTP-01"
                defaultValue={editingPlant?.name || ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g., Chennai, Tamil Nadu"
                defaultValue={editingPlant?.location || ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select defaultValue={editingPlant?.region || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North">North</SelectItem>
                  <SelectItem value="South">South</SelectItem>
                  <SelectItem value="East">East</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  placeholder="e.g., 13.0827"
                  defaultValue={editingPlant?.coordinates?.lat || ''}
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  placeholder="e.g., 80.2707"
                  defaultValue={editingPlant?.coordinates?.lng || ''}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlantModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlant}>
              {editingPlant ? 'Save Changes' : 'Add Plant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
