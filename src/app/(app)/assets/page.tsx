'use client';

import { useState, useEffect } from 'react';
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
  DialogTitle,
} from '@/components/ui/dialog';
import { mockPlants, getOnlinePlantsCount, getTotalSensorCount } from '@/data/mock-plants';
import { mockSensors, getSensorsByPlant, getSensorsByStatus } from '@/data/mock-sensors';
import {
  mockAssets,
  getOperationalAssetsCount,
  getFaultAssetsCount,
  getMaintenanceAssetsCount,
  getAverageEfficiency,
  getAssetTypeCount,
  getMaintenanceDueAssets,
  getAssetTypeLabel,
  Asset,
  AssetType,
  AssetStatus,
} from '@/data/mock-assets';
import { Plant, Sensor, SensorType } from '@/types';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Cpu,
  Calendar,
  Wrench,
  Activity,
  Settings,
  Eye,
  MoreVertical,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Gauge,
  Zap,
  Clock,
  Shield,
  Package,
  Thermometer,
  Droplets,
  Wind,
  Timer,
  Radio,
  Target,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type TabType = 'overview' | 'plants' | 'assets' | 'sensors' | 'maintenance';

interface MaintenanceItem {
  id: string;
  plantName: string;
  equipment: string;
  type: string;
  scheduledDate: Date;
  status: 'scheduled' | 'overdue' | 'completed';
  assignedTo: string;
  priority: 'high' | 'medium' | 'low';
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
    priority: 'high',
  },
  {
    id: 'maint-2',
    plantName: 'Mumbai WTP-02',
    equipment: 'Flow Sensor Array',
    type: 'Calibration',
    scheduledDate: new Date(Date.now() + 5 * 24 * 3600000),
    status: 'scheduled',
    assignedTo: 'Priya Sharma',
    priority: 'medium',
  },
  {
    id: 'maint-3',
    plantName: 'Delhi WTP-03',
    equipment: 'pH Sensor Bank',
    type: 'Replacement',
    scheduledDate: new Date(Date.now() - 1 * 24 * 3600000),
    status: 'overdue',
    assignedTo: 'Rahul Kumar',
    priority: 'high',
  },
  {
    id: 'maint-4',
    plantName: 'Bangalore WTP-04',
    equipment: 'Pump Motor P2',
    type: 'Inspection',
    scheduledDate: new Date(Date.now() + 7 * 24 * 3600000),
    status: 'scheduled',
    assignedTo: 'Vikram Reddy',
    priority: 'low',
  },
  {
    id: 'maint-5',
    plantName: 'Mumbai WTP-02',
    equipment: 'Chlorine Dosing System',
    type: 'Repair',
    scheduledDate: new Date(Date.now() + 1 * 24 * 3600000),
    status: 'scheduled',
    assignedTo: 'Suresh Patel',
    priority: 'high',
  },
];

export default function AssetsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal states
  const [plantModalOpen, setPlantModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [sensorModalOpen, setSensorModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [viewPlantModal, setViewPlantModal] = useState(false);
  const [viewAssetModal, setViewAssetModal] = useState(false);
  const [viewSensorModal, setViewSensorModal] = useState(false);

  // Selected items
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceItem | null>(null);

  // Dropdown menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Filter plants
  const filteredPlants = mockPlants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter assets
  const filteredAssets = mockAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.plantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Filter sensors
  const filteredSensors = mockSensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sensor.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sensor.status === statusFilter;
    const matchesType = typeFilter === 'all' || sensor.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getPlantStatusStyles = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-600 text-white';
      case 'warning': return 'bg-amber-500 text-white';
      case 'offline': return 'bg-rose-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getAssetStatusStyles = (status: AssetStatus) => {
    switch (status) {
      case 'operational': return 'bg-emerald-600 text-white';
      case 'maintenance': return 'bg-amber-500 text-white';
      case 'fault': return 'bg-rose-600 text-white';
      case 'offline': return 'bg-slate-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getSensorStatusStyles = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-emerald-600 text-white';
      case 'warning': return 'bg-amber-500 text-white';
      case 'critical': return 'bg-rose-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const getMaintenanceStatusStyles = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-600 text-white';
      case 'overdue': return 'bg-rose-600 text-white';
      case 'completed': return 'bg-emerald-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getAssetTypeIcon = (type: AssetType) => {
    switch (type) {
      case 'pump': return <Zap className="h-4 w-4" />;
      case 'filter': return <Filter className="h-4 w-4" />;
      case 'tank': return <Package className="h-4 w-4" />;
      case 'valve': return <Settings className="h-4 w-4" />;
      case 'blower': return <Wind className="h-4 w-4" />;
      case 'motor': return <Gauge className="h-4 w-4" />;
      case 'controller': return <Cpu className="h-4 w-4" />;
      case 'meter': return <Timer className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getSensorTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ph': return <Droplets className="h-4 w-4" />;
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      case 'flow': return <Activity className="h-4 w-4" />;
      case 'pressure': return <Gauge className="h-4 w-4" />;
      default: return <Radio className="h-4 w-4" />;
    }
  };

  // Chart data
  const assetTypeCounts = getAssetTypeCount();
  const assetTypeData = Object.entries(assetTypeCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      name: getAssetTypeLabel(type as AssetType),
      count,
    }));

  const plantStatusData = [
    { name: 'Online', value: mockPlants.filter(p => p.status === 'online').length, color: '#10b981' },
    { name: 'Warning', value: mockPlants.filter(p => p.status === 'warning').length, color: '#f59e0b' },
    { name: 'Offline', value: mockPlants.filter(p => p.status === 'offline').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const sensorStatusData = [
    { name: 'Normal', value: getSensorsByStatus('normal').length, color: '#10b981' },
    { name: 'Warning', value: getSensorsByStatus('warning').length, color: '#f59e0b' },
    { name: 'Critical', value: getSensorsByStatus('critical').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="h-3.5 w-3.5" /> },
    { id: 'plants', label: 'Plants', icon: <Building2 className="h-3.5 w-3.5" /> },
    { id: 'assets', label: 'Equipment', icon: <Settings className="h-3.5 w-3.5" /> },
    { id: 'sensors', label: 'Sensors', icon: <Cpu className="h-3.5 w-3.5" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-3.5 w-3.5" /> },
  ];

  const handleViewPlant = (plant: Plant) => {
    setSelectedPlant(plant);
    setViewPlantModal(true);
  };

  const handleEditPlant = (plant: Plant) => {
    setSelectedPlant(plant);
    setPlantModalOpen(true);
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setViewAssetModal(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setAssetModalOpen(true);
  };

  const handleViewSensor = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setViewSensorModal(true);
  };

  const handleEditSensor = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setSensorModalOpen(true);
  };


  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center">
          <div className="flex items-center gap-4">
            <Building2 className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Plants & Assets</span>
          </div>
        </header>
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-slate-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Industrial Header */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center">
        <div className="flex items-center gap-4">
          <Building2 className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Plants & Assets</span>
          <span className="text-[10px] text-slate-400">Facilities, equipment & sensors</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* KPI Stats Cards - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plants</span>
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-blue-600">{getOnlinePlantsCount()}</span>
              <span className="text-[10px] text-slate-500">/ {mockPlants.length} online</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Equipment</span>
              <Settings className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-600">{getOperationalAssetsCount()}</span>
              <span className="text-[10px] text-slate-500">/ {mockAssets.length} operational</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-purple-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sensors</span>
              <Cpu className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-purple-600">{mockSensors.filter(s => s.status === 'normal').length}</span>
              <span className="text-[10px] text-slate-500">/ {getTotalSensorCount()} normal</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-amber-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Faults</span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-amber-600">{getFaultAssetsCount()}</span>
              <span className="text-[10px] text-slate-500">equipment alerts</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-cyan-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Efficiency</span>
              <TrendingUp className="h-3.5 w-3.5 text-cyan-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-cyan-600">{getAverageEfficiency()}%</span>
              <span className="text-[10px] text-slate-500">overall</span>
            </div>
          </div>
        </div>

        {/* Full-width Tabs Container */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-slate-100 px-2 py-1.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    activeTab === tab.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Plant Status Distribution */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Plant Status</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-6">
                      <div className="h-[160px] w-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={plantStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {plantStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {plantStatusData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3" style={{ backgroundColor: item.color }} />
                              <span className="text-slate-600">{item.name}</span>
                            </div>
                            <span className="font-bold font-mono text-slate-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sensor Health */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Sensor Health</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-6">
                      <div className="h-[160px] w-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sensorStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {sensorStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {sensorStatusData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3" style={{ backgroundColor: item.color }} />
                              <span className="text-slate-600">{item.name}</span>
                            </div>
                            <span className="font-bold font-mono text-slate-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Equipment by Type */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Equipment by Type</span>
                  </div>
                  <div className="p-4">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={assetTypeData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} width={100} />
                          <Tooltip
                            contentStyle={{
                              border: '2px solid #cbd5e1',
                              borderRadius: 0,
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}
                          />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Maintenance Due */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Upcoming Maintenance</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {maintenanceSchedule.filter(m => m.status !== 'completed').slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-800">{item.equipment}</p>
                          <p className="text-[10px] text-slate-500">{item.plantName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getPriorityStyles(item.priority))}>
                            {item.priority}
                          </span>
                          <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getMaintenanceStatusStyles(item.status))}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setActiveTab('maintenance')}
                      className="w-full p-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 border border-slate-300 transition-colors"
                    >
                      View All Maintenance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Plants Tab */}
          {activeTab === 'plants' && (
            <div>
              {/* Filters */}
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search plants..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="online">Online</option>
                    <option value="warning">Warning</option>
                    <option value="offline">Offline</option>
                  </select>
                  <button
                    onClick={() => { setSelectedPlant(null); setPlantModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add Plant
                  </button>
                </div>
              </div>

              {/* Plants Table */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Plant</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Location</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Region</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Sensors</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Last Updated</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlants.map((plant) => (
                    <TableRow key={plant.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewPlant(plant)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center bg-slate-100 border border-slate-300">
                            <Building2 className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-800">{plant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <MapPin className="h-3.5 w-3.5" />
                          {plant.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{plant.region}</TableCell>
                      <TableCell>
                        <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getPlantStatusStyles(plant.status))}>
                          {plant.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm font-mono text-slate-700">
                          <Cpu className="h-3.5 w-3.5 text-slate-400" />
                          {plant.sensorCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 font-mono">
                        {format(plant.lastUpdated, 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === plant.id ? null : plant.id)}
                            className="p-1.5 hover:bg-slate-100 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                          </button>
                          {openMenuId === plant.id && (
                            <div className="absolute right-0 top-full mt-1 z-50 w-36 border-2 border-slate-300 bg-white shadow-lg">
                              <button
                                onClick={() => { handleViewPlant(plant); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Details
                              </button>
                              <button
                                onClick={() => { handleEditPlant(plant); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit Plant
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Assets/Equipment Tab */}
          {activeTab === 'assets' && (
            <div>
              {/* Filters */}
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search equipment..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="fault">Fault</option>
                    <option value="offline">Offline</option>
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="pump">Pumps</option>
                    <option value="filter">Filters</option>
                    <option value="tank">Tanks</option>
                    <option value="valve">Valves</option>
                    <option value="blower">Blowers</option>
                    <option value="motor">Motors</option>
                    <option value="controller">Controllers</option>
                    <option value="meter">Meters</option>
                  </select>
                  <button
                    onClick={() => { setSelectedAsset(null); setAssetModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add Equipment
                  </button>
                </div>
              </div>

              {/* Assets Table */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Equipment</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Asset Code</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Plant</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Type</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Efficiency</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Next PM</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => {
                    const daysToMaintenance = differenceInDays(asset.nextMaintenance, new Date());
                    const isMaintenanceDue = daysToMaintenance <= 14;

                    return (
                      <TableRow key={asset.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewAsset(asset)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center bg-slate-100 border border-slate-300">
                              {getAssetTypeIcon(asset.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{asset.name}</p>
                              <p className="text-[10px] text-slate-500">{asset.manufacturer} {asset.model}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-slate-700">{asset.assetCode}</TableCell>
                        <TableCell className="text-sm text-slate-600">{asset.plantName}</TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                            {getAssetTypeLabel(asset.type)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getAssetStatusStyles(asset.status))}>
                            {asset.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'text-sm font-mono font-bold',
                            asset.efficiency >= 95 ? 'text-emerald-600' :
                            asset.efficiency >= 85 ? 'text-amber-600' : 'text-rose-600'
                          )}>
                            {asset.efficiency}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            'text-sm font-mono',
                            isMaintenanceDue ? 'text-amber-600 font-bold' : 'text-slate-500'
                          )}>
                            {format(asset.nextMaintenance, 'MMM d')}
                            {isMaintenanceDue && <span className="text-[10px] ml-1">({daysToMaintenance}d)</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === asset.id ? null : asset.id)}
                              className="p-1.5 hover:bg-slate-100 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                            </button>
                            {openMenuId === asset.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 w-40 border-2 border-slate-300 bg-white shadow-lg">
                                <button
                                  onClick={() => { handleViewAsset(asset); setOpenMenuId(null); }}
                                  className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => { handleEditAsset(asset); setOpenMenuId(null); }}
                                  className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  Edit Equipment
                                </button>
                                <button
                                  onClick={() => { toast.info('Schedule maintenance coming soon'); setOpenMenuId(null); }}
                                  className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                >
                                  <Wrench className="h-3.5 w-3.5" />
                                  Schedule PM
                                </button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Sensors Tab */}
          {activeTab === 'sensors' && (
            <div>
              {/* Filters */}
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search sensors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="normal">Normal</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="pH">pH</option>
                    <option value="flow">Flow</option>
                    <option value="pressure">Pressure</option>
                    <option value="temperature">Temperature</option>
                    <option value="turbidity">Turbidity</option>
                    <option value="chlorine">Chlorine</option>
                    <option value="DO">DO</option>
                    <option value="level">Level</option>
                    <option value="conductivity">Conductivity</option>
                    <option value="ORP">ORP</option>
                  </select>
                  <button
                    onClick={() => { setSelectedSensor(null); setSensorModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add Sensor
                  </button>
                </div>
              </div>

              {/* Sensors Table */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Sensor</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Type</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Current Value</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Range</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Comm Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Last Updated</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSensors.map((sensor) => (
                    <TableRow key={sensor.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewSensor(sensor)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center bg-slate-100 border border-slate-300">
                            {getSensorTypeIcon(sensor.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{sensor.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{sensor.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                          {sensor.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-lg font-bold font-mono text-slate-800">
                          {sensor.currentValue}
                        </span>
                        <span className="text-sm text-slate-500 ml-1">{sensor.unit}</span>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-slate-600">
                        {sensor.minThreshold} - {sensor.maxThreshold} {sensor.unit}
                      </TableCell>
                      <TableCell>
                        <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getSensorStatusStyles(sensor.status))}>
                          {sensor.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            'h-2 w-2 rounded-full',
                            sensor.commStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                            sensor.commStatus === 'stale' ? 'bg-amber-500' : 'bg-slate-400'
                          )} />
                          <span className="text-xs text-slate-600">{sensor.commStatus}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 font-mono">
                        {format(sensor.lastUpdated, 'HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === sensor.id ? null : sensor.id)}
                            className="p-1.5 hover:bg-slate-100 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                          </button>
                          {openMenuId === sensor.id && (
                            <div className="absolute right-0 top-full mt-1 z-50 w-40 border-2 border-slate-300 bg-white shadow-lg">
                              <button
                                onClick={() => { handleViewSensor(sensor); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Details
                              </button>
                              <button
                                onClick={() => { handleEditSensor(sensor); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit Thresholds
                              </button>
                              <button
                                onClick={() => { toast.info('Calibration feature coming soon'); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Target className="h-3.5 w-3.5" />
                                Calibrate
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div>
              {/* Filters */}
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search maintenance..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="overdue">Overdue</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={() => { setSelectedMaintenance(null); setMaintenanceModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Schedule Maintenance
                  </button>
                </div>
              </div>
              {/* Summary Cards */}
              <div className="p-4 border-b border-slate-200 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white border border-slate-300">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scheduled</span>
                    </div>
                    <span className="text-xl font-bold font-mono text-blue-600">
                      {maintenanceSchedule.filter(m => m.status === 'scheduled').length}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-300">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overdue</span>
                    </div>
                    <span className="text-xl font-bold font-mono text-rose-600">
                      {maintenanceSchedule.filter(m => m.status === 'overdue').length}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-300">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completed</span>
                    </div>
                    <span className="text-xl font-bold font-mono text-emerald-600">
                      {maintenanceSchedule.filter(m => m.status === 'completed').length}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-300">
                    <div className="flex items-center gap-2 mb-1">
                      <Settings className="h-4 w-4 text-amber-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assets Due PM</span>
                    </div>
                    <span className="text-xl font-bold font-mono text-amber-600">
                      {getMaintenanceDueAssets(30).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Maintenance Table */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Equipment</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Plant</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Type</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Scheduled Date</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Assigned To</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Priority</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceSchedule.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center bg-slate-100 border border-slate-300">
                            <Wrench className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-800">{item.equipment}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{item.plantName}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                          {item.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm font-mono text-slate-600">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(item.scheduledDate, 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{item.assignedTo}</TableCell>
                      <TableCell>
                        <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getPriorityStyles(item.priority))}>
                          {item.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getMaintenanceStatusStyles(item.status))}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => toast.info('Work order details coming soon')}
                          className="px-3 py-1.5 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          View
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Plant View Modal */}
      <Dialog open={viewPlantModal} onOpenChange={setViewPlantModal}>
        <DialogContent className="max-w-2xl p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Plant Details</DialogTitle>
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                <Building2 className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Plant Details</h2>
                {selectedPlant && (
                  <p className="text-[10px] text-slate-500 font-mono">{selectedPlant.id}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedPlant && (
                <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getPlantStatusStyles(selectedPlant.status))}>
                  {selectedPlant.status}
                </span>
              )}
              <button onClick={() => setViewPlantModal(false)} className="p-1 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          {selectedPlant && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant Name</span>
                  <p className="text-sm font-medium text-slate-800">{selectedPlant.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</span>
                  <p className="text-sm text-slate-600">{selectedPlant.location}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Region</span>
                  <p className="text-sm text-slate-600">{selectedPlant.region}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Sensors</span>
                  <p className="text-sm font-mono text-slate-800">{selectedPlant.sensorCount}</p>
                </div>
                {selectedPlant.coordinates && (
                  <>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Latitude</span>
                      <p className="text-sm font-mono text-slate-600">{selectedPlant.coordinates.lat}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Longitude</span>
                      <p className="text-sm font-mono text-slate-600">{selectedPlant.coordinates.lng}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t-2 border-slate-200 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Equipment at this Plant</span>
                <div className="grid grid-cols-2 gap-2">
                  {mockAssets.filter(a => a.plantId === selectedPlant.id).map(asset => (
                    <div key={asset.id} className="p-2 bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getAssetTypeIcon(asset.type)}
                        <span className="text-xs text-slate-700">{asset.name}</span>
                      </div>
                      <span className={cn('px-1.5 py-0.5 text-[8px] font-bold uppercase', getAssetStatusStyles(asset.status))}>
                        {asset.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t-2 border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  onClick={() => setViewPlantModal(false)}
                  className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { setViewPlantModal(false); handleEditPlant(selectedPlant); }}
                  className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  Edit Plant
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Plant Add/Edit Modal */}
      <Dialog open={plantModalOpen} onOpenChange={setPlantModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Plant Form</DialogTitle>
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                <Building2 className="h-4 w-4 text-slate-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {selectedPlant ? 'Edit Plant' : 'Add New Plant'}
              </h2>
            </div>
            <button onClick={() => setPlantModalOpen(false)} className="p-1 hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant Name</label>
              <input
                type="text"
                placeholder="e.g., Chennai WTP-01"
                defaultValue={selectedPlant?.name || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</label>
              <input
                type="text"
                placeholder="e.g., Chennai, Tamil Nadu"
                defaultValue={selectedPlant?.location || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Region</label>
              <select
                defaultValue={selectedPlant?.region || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="">Select region</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Latitude</label>
                <input
                  type="text"
                  placeholder="e.g., 13.0827"
                  defaultValue={selectedPlant?.coordinates?.lat || ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Longitude</label>
                <input
                  type="text"
                  placeholder="e.g., 80.2707"
                  defaultValue={selectedPlant?.coordinates?.lng || ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="border-t-2 border-slate-200 pt-4 flex justify-end gap-2">
              <button
                onClick={() => setPlantModalOpen(false)}
                className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success(selectedPlant ? 'Plant updated' : 'Plant added');
                  setPlantModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                {selectedPlant ? 'Save Changes' : 'Add Plant'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset View Modal */}
      <Dialog open={viewAssetModal} onOpenChange={setViewAssetModal}>
        <DialogContent className="max-w-2xl p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Equipment Details</DialogTitle>
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                {selectedAsset && getAssetTypeIcon(selectedAsset.type)}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Equipment Details</h2>
                {selectedAsset && (
                  <p className="text-[10px] text-slate-500 font-mono">{selectedAsset.assetCode}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedAsset && (
                <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getAssetStatusStyles(selectedAsset.status))}>
                  {selectedAsset.status}
                </span>
              )}
              <button onClick={() => setViewAssetModal(false)} className="p-1 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          {selectedAsset && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Equipment Name</span>
                  <p className="text-sm font-medium text-slate-800">{selectedAsset.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant</span>
                  <p className="text-sm text-slate-600">{selectedAsset.plantName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Manufacturer</span>
                  <p className="text-sm text-slate-600">{selectedAsset.manufacturer}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Model</span>
                  <p className="text-sm font-mono text-slate-600">{selectedAsset.model}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Serial Number</span>
                  <p className="text-sm font-mono text-slate-600">{selectedAsset.serialNumber}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Zone</span>
                  <p className="text-sm text-slate-600">{selectedAsset.zone}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Installation Date</span>
                  <p className="text-sm font-mono text-slate-600">{format(selectedAsset.installationDate, 'MMM d, yyyy')}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Warranty Expiry</span>
                  <p className="text-sm font-mono text-slate-600">{format(selectedAsset.warrantyExpiry, 'MMM d, yyyy')}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Running Hours</span>
                  <p className="text-sm font-mono text-slate-800">{selectedAsset.runningHours.toLocaleString()} hrs</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Efficiency</span>
                  <p className={cn(
                    'text-sm font-mono font-bold',
                    selectedAsset.efficiency >= 95 ? 'text-emerald-600' :
                    selectedAsset.efficiency >= 85 ? 'text-amber-600' : 'text-rose-600'
                  )}>
                    {selectedAsset.efficiency}%
                  </p>
                </div>
              </div>

              <div className="border-t-2 border-slate-200 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Maintenance Schedule</span>
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">Last Maintenance</span>
                    <p className="text-sm font-mono text-slate-700">{format(selectedAsset.lastMaintenance, 'MMM d, yyyy')}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">Next Maintenance</span>
                    <p className="text-sm font-mono text-amber-600 font-bold">{format(selectedAsset.nextMaintenance, 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  onClick={() => setViewAssetModal(false)}
                  className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { setViewAssetModal(false); handleEditAsset(selectedAsset); }}
                  className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  Edit Equipment
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Asset Add/Edit Modal */}
      <Dialog open={assetModalOpen} onOpenChange={setAssetModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 rounded-none border-2 border-slate-300 max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Equipment Form</DialogTitle>
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200 sticky top-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                <Settings className="h-4 w-4 text-slate-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {selectedAsset ? 'Edit Equipment' : 'Add New Equipment'}
              </h2>
            </div>
            <button onClick={() => setAssetModalOpen(false)} className="p-1 hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Equipment Name</label>
              <input
                type="text"
                placeholder="e.g., Raw Water Intake Pump A"
                defaultValue={selectedAsset?.name || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Asset Code</label>
                <input
                  type="text"
                  placeholder="e.g., CHN-PMP-001"
                  defaultValue={selectedAsset?.assetCode || ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</label>
                <select
                  defaultValue={selectedAsset?.type || ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                >
                  <option value="">Select type</option>
                  <option value="pump">Pump</option>
                  <option value="filter">Filter/Membrane</option>
                  <option value="tank">Tank/Vessel</option>
                  <option value="valve">Valve</option>
                  <option value="blower">Blower</option>
                  <option value="motor">Motor</option>
                  <option value="controller">Controller/PLC</option>
                  <option value="meter">Meter/Instrument</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant</label>
              <select
                defaultValue={selectedAsset?.plantId || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="">Select plant</option>
                {mockPlants.map(plant => (
                  <option key={plant.id} value={plant.id}>{plant.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g., Grundfos"
                  defaultValue={selectedAsset?.manufacturer || ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Model</label>
                <input
                  type="text"
                  placeholder="e.g., CR 95-4"
                  defaultValue={selectedAsset?.model || ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Serial Number</label>
              <input
                type="text"
                placeholder="e.g., GF-2021-45678"
                defaultValue={selectedAsset?.serialNumber || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Zone/Section</label>
              <input
                type="text"
                placeholder="e.g., Intake Section"
                defaultValue={selectedAsset?.zone || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="border-t-2 border-slate-200 pt-4 flex justify-end gap-2">
              <button
                onClick={() => setAssetModalOpen(false)}
                className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success(selectedAsset ? 'Equipment updated' : 'Equipment added');
                  setAssetModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                {selectedAsset ? 'Save Changes' : 'Add Equipment'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sensor Add/Edit Modal */}
      <Dialog open={sensorModalOpen} onOpenChange={setSensorModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 rounded-none border-2 border-slate-300 max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Sensor Form</DialogTitle>
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200 sticky top-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                <Cpu className="h-4 w-4 text-slate-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {selectedSensor ? 'Edit Sensor' : 'Add New Sensor'}
              </h2>
            </div>
            <button onClick={() => setSensorModalOpen(false)} className="p-1 hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sensor Name</label>
              <input
                type="text"
                placeholder="e.g., pH Sensor 1"
                defaultValue={selectedSensor?.name || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sensor Type</label>
                <select
                  defaultValue={selectedSensor?.type || ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                >
                  <option value="">Select type</option>
                  <option value="pH">pH</option>
                  <option value="flow">Flow</option>
                  <option value="pressure">Pressure</option>
                  <option value="temperature">Temperature</option>
                  <option value="turbidity">Turbidity</option>
                  <option value="chlorine">Chlorine</option>
                  <option value="DO">Dissolved Oxygen</option>
                  <option value="level">Level</option>
                  <option value="conductivity">Conductivity</option>
                  <option value="ORP">ORP</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit</label>
                <input
                  type="text"
                  placeholder="e.g., pH, m³/h, bar"
                  defaultValue={selectedSensor?.unit || ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant</label>
              <select
                defaultValue={selectedSensor?.plantId || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="">Select plant</option>
                {mockPlants.map(plant => (
                  <option key={plant.id} value={plant.id}>{plant.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Min Threshold</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 6.5"
                  defaultValue={selectedSensor?.minThreshold || ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Max Threshold</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 8.5"
                  defaultValue={selectedSensor?.maxThreshold || ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Setpoint</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 7.0"
                defaultValue={selectedSensor?.setpoint || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="border-t-2 border-slate-200 pt-4 flex justify-end gap-2">
              <button
                onClick={() => setSensorModalOpen(false)}
                className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success(selectedSensor ? 'Sensor updated' : 'Sensor added');
                  setSensorModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                {selectedSensor ? 'Save Changes' : 'Add Sensor'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sensor View Modal */}
      <Dialog open={viewSensorModal} onOpenChange={setViewSensorModal}>
        <DialogContent className="max-w-lg p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Sensor Details</DialogTitle>
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                {selectedSensor && getSensorTypeIcon(selectedSensor.type)}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sensor Details</h2>
                {selectedSensor && (
                  <p className="text-[10px] text-slate-500 font-mono">{selectedSensor.id}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedSensor && (
                <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getSensorStatusStyles(selectedSensor.status))}>
                  {selectedSensor.status}
                </span>
              )}
              <button onClick={() => setViewSensorModal(false)} className="p-1 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          {selectedSensor && (
            <div className="p-4 space-y-4">
              <div className="text-center p-4 bg-slate-50 border border-slate-200">
                <span className="text-4xl font-bold font-mono text-slate-800">{selectedSensor.currentValue}</span>
                <span className="text-xl text-slate-500 ml-2">{selectedSensor.unit}</span>
                <div className="mt-2 text-xs text-slate-500">
                  Range: {selectedSensor.minThreshold} - {selectedSensor.maxThreshold} {selectedSensor.unit}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sensor Type</span>
                  <p className="text-sm font-medium text-slate-800">{selectedSensor.type.toUpperCase()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Setpoint</span>
                  <p className="text-sm font-mono text-slate-600">{selectedSensor.setpoint} {selectedSensor.unit}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Comm Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      selectedSensor.commStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                      selectedSensor.commStatus === 'stale' ? 'bg-amber-500' : 'bg-slate-400'
                    )} />
                    <span className="text-sm text-slate-600">{selectedSensor.commStatus}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Updated</span>
                  <p className="text-sm font-mono text-slate-600">{format(selectedSensor.lastUpdated, 'HH:mm:ss')}</p>
                </div>
              </div>

              <div className="border-t-2 border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  onClick={() => setViewSensorModal(false)}
                  className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { setViewSensorModal(false); handleEditSensor(selectedSensor); }}
                  className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  Edit Thresholds
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Maintenance Schedule Modal */}
      <Dialog open={maintenanceModalOpen} onOpenChange={setMaintenanceModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Schedule Maintenance</DialogTitle>
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                <Wrench className="h-4 w-4 text-slate-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {selectedMaintenance ? 'Edit Work Order' : 'Schedule Maintenance'}
              </h2>
            </div>
            <button onClick={() => setMaintenanceModalOpen(false)} className="p-1 hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant</label>
              <select
                defaultValue={selectedMaintenance?.plantName || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="">Select plant</option>
                {mockPlants.map(plant => (
                  <option key={plant.id} value={plant.name}>{plant.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Equipment</label>
              <select
                defaultValue={selectedMaintenance?.equipment || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="">Select equipment</option>
                {mockAssets.map(asset => (
                  <option key={asset.id} value={asset.name}>{asset.name} ({asset.plantName})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Maintenance Type</label>
              <select
                defaultValue={selectedMaintenance?.type || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="">Select type</option>
                <option value="Preventive">Preventive Maintenance</option>
                <option value="Calibration">Calibration</option>
                <option value="Inspection">Inspection</option>
                <option value="Repair">Repair</option>
                <option value="Replacement">Replacement</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Overhaul">Overhaul</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scheduled Date</label>
                <input
                  type="date"
                  defaultValue={selectedMaintenance?.scheduledDate ? format(selectedMaintenance.scheduledDate, 'yyyy-MM-dd') : ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Priority</label>
                <select
                  defaultValue={selectedMaintenance?.priority || ''}
                  className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                >
                  <option value="">Select priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned To</label>
              <select
                defaultValue={selectedMaintenance?.assignedTo || ''}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="">Select technician</option>
                <option value="Amit Singh">Amit Singh</option>
                <option value="Priya Sharma">Priya Sharma</option>
                <option value="Rahul Kumar">Rahul Kumar</option>
                <option value="Vikram Reddy">Vikram Reddy</option>
                <option value="Suresh Patel">Suresh Patel</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notes</label>
              <textarea
                placeholder="Enter any additional notes or instructions..."
                rows={3}
                className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 resize-none"
              />
            </div>

            <div className="border-t-2 border-slate-200 pt-4 flex justify-end gap-2">
              <button
                onClick={() => setMaintenanceModalOpen(false)}
                className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success(selectedMaintenance ? 'Work order updated' : 'Maintenance scheduled');
                  setMaintenanceModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                {selectedMaintenance ? 'Save Changes' : 'Schedule Work Order'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
