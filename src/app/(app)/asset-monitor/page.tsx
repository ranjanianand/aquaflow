'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Box,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Search,
  Thermometer,
  Gauge,
  Zap,
  Clock,
  Calendar,
  Wrench,
  ChevronDown,
  MoreVertical,
  Eye,
  X,
  Plus,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  assets,
  getAverageHealthScore,
  getCriticalAssets,
  getAssetsNeedingMaintenance,
  getAssetsByCategory,
  getStatusLabel,
  getCategoryLabel,
  type Asset,
} from '@/data/mock-asset-monitor';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';

// Industrial-styled action menu component
function ActionMenu({
  asset,
  onView,
  onSchedule,
}: {
  asset: Asset;
  onView: (asset: Asset) => void;
  onSchedule: (asset: Asset) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 hover:bg-slate-200 transition-colors"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] border-2 border-slate-300 bg-white shadow-lg">
          <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Actions</span>
          </div>
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(asset);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSchedule(asset);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Wrench className="h-3.5 w-3.5 text-slate-500" />
              Schedule Maintenance
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type TabValue = 'overview' | 'all' | 'critical' | 'maintenance';

export default function AssetMonitorPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabValue>('overview');
  const [modalTab, setModalTab] = useState<'overview' | 'metrics' | 'history'>('overview');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleAsset, setScheduleAsset] = useState<Asset | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    type: 'preventive' as 'preventive' | 'corrective' | 'inspection' | 'calibration',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    scheduledDate: '',
    estimatedHours: 2,
    assignedTechnician: '',
    description: '',
    notes: '',
  });

  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.plantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-emerald-100 text-emerald-700';
      case 'warning': return 'bg-amber-100 text-amber-700';
      case 'critical': return 'bg-red-100 text-red-700';
      case 'offline': return 'bg-slate-100 text-slate-700';
      case 'maintenance': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'operational': return 'border-l-[3px] border-l-emerald-500';
      case 'warning': return 'border-l-[3px] border-l-amber-500';
      case 'critical': return 'border-l-[3px] border-l-red-500';
      case 'offline': return 'border-l-[3px] border-l-slate-400';
      case 'maintenance': return 'border-l-[3px] border-l-blue-500';
      default: return 'border-l-[3px] border-l-slate-400';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const categoryData = Object.entries(getAssetsByCategory())
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      name: getCategoryLabel(category as any),
      value: count,
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const healthTrendData = [
    { date: 'Jan 10', score: 82 },
    { date: 'Jan 11', score: 80 },
    { date: 'Jan 12', score: 78 },
    { date: 'Jan 13', score: 75 },
    { date: 'Jan 14', score: 76 },
    { date: 'Jan 15', score: getAverageHealthScore() },
  ];

  const avgHealth = getAverageHealthScore();
  const criticalCount = getCriticalAssets().length;
  const maintenanceCount = getAssetsNeedingMaintenance().length;

  // Health Score Distribution for Overview
  const healthDistribution = useMemo(() => {
    let excellent = 0, good = 0, fair = 0, poor = 0;
    assets.forEach(asset => {
      if (asset.healthScore >= 90) excellent++;
      else if (asset.healthScore >= 70) good++;
      else if (asset.healthScore >= 50) fair++;
      else poor++;
    });
    return [
      { name: 'Excellent (90+)', value: excellent, color: '#10b981' },
      { name: 'Good (70-89)', value: good, color: '#3b82f6' },
      { name: 'Fair (50-69)', value: fair, color: '#f59e0b' },
      { name: 'Poor (<50)', value: poor, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, []);

  // Status Distribution for Overview
  const statusDistribution = useMemo(() => {
    let operational = 0, warning = 0, critical = 0, maintenance = 0, offline = 0;
    assets.forEach(asset => {
      switch (asset.status) {
        case 'operational': operational++; break;
        case 'warning': warning++; break;
        case 'critical': critical++; break;
        case 'maintenance': maintenance++; break;
        case 'offline': offline++; break;
      }
    });
    return [
      { name: 'Operational', value: operational, color: '#10b981' },
      { name: 'Warning', value: warning, color: '#f59e0b' },
      { name: 'Critical', value: critical, color: '#ef4444' },
      { name: 'Maintenance', value: maintenance, color: '#3b82f6' },
      { name: 'Offline', value: offline, color: '#64748b' },
    ].filter(d => d.value > 0);
  }, []);

  // Assets by Plant
  const assetsByPlant = useMemo(() => {
    const plantCounts: Record<string, number> = {};
    assets.forEach(asset => {
      plantCounts[asset.plantName] = (plantCounts[asset.plantName] || 0) + 1;
    });
    return Object.entries(plantCounts).map(([name, count]) => ({ name: name.replace(' WTP', '').replace(' STP', '').replace(' ETP', '').replace(' ZLD', ''), count }));
  }, []);

  // Maintenance Cost Trend (mock data)
  const maintenanceCostTrend = useMemo(() => {
    return [
      { month: 'Oct', cost: 125000, count: 12 },
      { month: 'Nov', cost: 98000, count: 8 },
      { month: 'Dec', cost: 142000, count: 15 },
      { month: 'Jan', cost: 87000, count: 10 },
    ];
  }, []);

  // Top Assets by Operating Hours
  const topAssetsByHours = useMemo(() => {
    return [...assets]
      .sort((a, b) => b.operatingHours - a.operatingHours)
      .slice(0, 5)
      .map(asset => ({
        name: asset.name.length > 15 ? asset.name.substring(0, 15) + '...' : asset.name,
        hours: Math.round(asset.operatingHours / 1000),
        health: asset.healthScore,
      }));
  }, []);

  const openScheduleModal = (asset: Asset) => {
    setScheduleAsset(asset);
    setScheduleForm({
      type: 'preventive',
      priority: 'medium',
      scheduledDate: '',
      estimatedHours: 2,
      assignedTechnician: '',
      description: '',
      notes: '',
    });
    setScheduleModalOpen(true);
  };

  const handleScheduleMaintenance = () => {
    if (!scheduleForm.scheduledDate || !scheduleForm.description) {
      toast.error('Please fill required fields', {
        description: 'Scheduled date and description are required.',
      });
      return;
    }
    toast.success('Maintenance Scheduled', {
      description: `Maintenance scheduled for ${scheduleAsset?.name} on ${scheduleForm.scheduledDate}.`,
    });
    setScheduleModalOpen(false);
    setScheduleAsset(null);
  };

  const technicians = [
    { id: 'tech-001', name: 'Rajesh Kumar' },
    { id: 'tech-002', name: 'Suresh Patel' },
    { id: 'tech-003', name: 'Amit Singh' },
    { id: 'tech-004', name: 'Vikram Rao' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header Bar */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Box className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Asset Monitor</span>
          <span className="text-[10px] text-slate-400">Track equipment health and performance</span>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 text-white text-[10px] font-bold">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount} CRITICAL
            </span>
          )}
          {maintenanceCount > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-orange-600 text-white text-[10px] font-bold">
              <Wrench className="h-3 w-3" />
              {maintenanceCount} DUE
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Industrial Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Total Assets */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Assets</span>
              <Box className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-blue-600" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{assets.length}</span>
              <span className="text-[10px] text-slate-500">ACROSS ALL PLANTS</span>
            </div>
          </div>

          {/* Avg Health Score */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            avgHealth >= 80 ? 'border-l-[3px] border-l-emerald-500' : avgHealth >= 60 ? 'border-l-[3px] border-l-amber-500' : 'border-l-[3px] border-l-red-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Health Score</span>
              <Activity className={cn('h-4 w-4', getHealthColor(avgHealth))} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn('text-2xl font-bold tracking-tight', getHealthColor(avgHealth))} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{avgHealth}%</span>
              <span className="text-[10px] text-slate-500">
                {avgHealth >= 80 ? 'HEALTHY' : avgHealth >= 60 ? 'MONITOR' : 'ACTION NEEDED'}
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-200 overflow-hidden">
              <div className={cn('h-full', getHealthBgColor(avgHealth))} style={{ width: `${avgHealth}%` }} />
            </div>
          </div>

          {/* Critical Assets */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            criticalCount > 0 && 'border-l-[3px] border-l-red-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Critical Assets</span>
              <AlertTriangle className={cn('h-4 w-4', criticalCount > 0 ? 'text-red-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold tracking-tight',
                criticalCount > 0 ? 'text-red-600' : 'text-slate-700'
              )} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{criticalCount}</span>
              <span className="text-[10px] text-slate-500">
                {criticalCount > 0 ? 'REQUIRES ATTENTION' : 'ALL CLEAR'}
              </span>
            </div>
          </div>

          {/* Due Maintenance */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            maintenanceCount > 0 && 'border-l-[3px] border-l-orange-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Due Maintenance</span>
              <Wrench className={cn('h-4 w-4', maintenanceCount > 0 ? 'text-orange-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold tracking-tight',
                maintenanceCount > 0 ? 'text-orange-600' : 'text-slate-700'
              )} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{maintenanceCount}</span>
              <span className="text-[10px] text-slate-500">OVERDUE OR DUE TODAY</span>
            </div>
          </div>
        </div>

        {/* Asset Management Panel */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          {/* Panel Header with Tabs */}
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex gap-1">
              {(['overview', 'all', 'critical', 'maintenance'] as TabValue[]).map((tab) => {
                const count = tab === 'all' ? assets.length : tab === 'critical' ? criticalCount : tab === 'maintenance' ? maintenanceCount : null;
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={cn(
                      'px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                      selectedTab === tab
                        ? 'bg-slate-700 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                    )}
                  >
                    {tab === 'overview' ? 'Overview' : tab === 'all' ? 'All Assets' : tab === 'critical' ? 'Critical' : 'Due Maintenance'}
                    {count !== null && <span className="ml-1 text-[9px] opacity-70">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters Row - Only show for 'all' tab */}
          {selectedTab === 'all' && (
            <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:max-w-[250px]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                >
                  <option value="all">All Status</option>
                  <option value="operational">Operational</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                  <option value="offline">Offline</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                >
                  <option value="all">All Categories</option>
                  <option value="pump">Pump</option>
                  <option value="motor">Motor</option>
                  <option value="sensor">Sensor</option>
                  <option value="valve">Valve</option>
                  <option value="blower">Blower</option>
                  <option value="membrane">Membrane</option>
                  <option value="controller">Controller</option>
                  <option value="dosing">Dosing</option>
                  <option value="filter">Filter</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Overview Tab - Visualizations */}
          {selectedTab === 'overview' && (
            <div className="p-4 space-y-4">
              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Fleet Health Trend */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Fleet Health Trend</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={healthTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis domain={[0, 100]} fontSize={10} tick={{ fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                            formatter={(value: number) => [`${value}%`, 'Health']}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#10b981"
                            fill="#10b98133"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Health Score Distribution */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <PieChartIcon className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Health Score Distribution</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={healthDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {healthDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                      {healthDistribution.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1">
                          <div className="h-2 w-2" style={{ backgroundColor: entry.color }} />
                          <span className="text-[9px] text-slate-500">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Asset Status</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                      {statusDistribution.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1">
                          <div className="h-2 w-2" style={{ backgroundColor: entry.color }} />
                          <span className="text-[9px] text-slate-500">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Assets by Category */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Assets by Category</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} width={80} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="value" fill="#6366f1" name="Assets" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Assets by Plant */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <Box className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Assets by Plant</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={assetsByPlant}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="count" fill="#0ea5e9" name="Assets" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row 3 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Maintenance Cost Trend */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Maintenance Cost Trend</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={maintenanceCostTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis fontSize={10} tick={{ fill: '#64748b' }} tickFormatter={(v) => `₹${(v/1000)}k`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Cost']}
                          />
                          <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-4 bg-amber-500" />
                        <span className="text-[10px] text-slate-500">Monthly Cost</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Assets by Operating Hours */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Top Assets by Operating Hours</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topAssetsByHours} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" fontSize={10} tick={{ fill: '#64748b' }} tickFormatter={(v) => `${v}k`} />
                          <YAxis type="category" dataKey="name" fontSize={9} tick={{ fill: '#64748b' }} width={100} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                            formatter={(value: number) => [`${value}k hours`, 'Operating']}
                          />
                          <Bar dataKey="hours" fill="#8b5cf6" name="Hours (thousands)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Assets Grid */}
          {selectedTab === 'all' && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className={cn(
                      'border-2 border-slate-300 bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors',
                      getStatusBorderColor(asset.status)
                    )}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] text-slate-500">{asset.assetCode}</p>
                        <p className="font-semibold text-sm text-slate-700 truncate">{asset.name}</p>
                        <p className="text-[10px] text-slate-500">{asset.plantName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5', getStatusColor(asset.status))}>
                          {getStatusLabel(asset.status)}
                        </span>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ActionMenu asset={asset} onView={setSelectedAsset} onSchedule={openScheduleModal} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500">Health Score</span>
                          <span className={cn('font-bold', getHealthColor(asset.healthScore))}>
                            {asset.healthScore}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-200 overflow-hidden">
                          <div
                            className={cn('h-full', getHealthBgColor(asset.healthScore))}
                            style={{ width: `${asset.healthScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {asset.currentMetrics.efficiency > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Gauge className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-slate-600">{asset.currentMetrics.efficiency}% eff</span>
                          </div>
                        )}
                        {asset.currentMetrics.temperature && (
                          <div className="flex items-center gap-1.5">
                            <Thermometer className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-slate-600">{asset.currentMetrics.temperature}°C</span>
                          </div>
                        )}
                        {asset.currentMetrics.powerConsumption && (
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-slate-600">{asset.currentMetrics.powerConsumption} kW</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-600">{(asset.operatingHours / 1000).toFixed(1)}k hrs</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                        Next maintenance: <span className="font-mono">{format(new Date(asset.nextMaintenanceDate), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Assets */}
          {selectedTab === 'critical' && (
            <div className="p-4">
              {getCriticalAssets().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getCriticalAssets().map((asset) => (
                    <div
                      key={asset.id}
                      className="border-2 border-slate-300 bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors border-l-[3px] border-l-red-500"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-[10px] text-slate-500">{asset.assetCode}</p>
                          <p className="font-semibold text-sm text-slate-700">{asset.name}</p>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700">CRITICAL</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Health Score</span>
                        <span className="text-xl font-bold text-red-600" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{asset.healthScore}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">{asset.plantName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
                  <p className="text-sm font-bold text-slate-600">NO CRITICAL ASSETS</p>
                  <p className="text-[11px] text-slate-500">All equipment is operating within acceptable parameters</p>
                </div>
              )}
            </div>
          )}

          {/* Due Maintenance Table */}
          {selectedTab === 'maintenance' && (
            <div className="border-t border-slate-200">
              {/* Table Header */}
              <div className="bg-slate-100 border-b-2 border-slate-300 grid grid-cols-[1fr_1fr_120px_120px_100px_80px] gap-2 px-4 py-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Asset</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Maintenance</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Next Due</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</span>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-200 max-h-[400px] overflow-y-auto">
                {assets
                  .filter(a => new Date(a.nextMaintenanceDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
                  .sort((a, b) => new Date(a.nextMaintenanceDate).getTime() - new Date(b.nextMaintenanceDate).getTime())
                  .map((asset) => {
                    const isOverdue = new Date(asset.nextMaintenanceDate) < new Date();
                    return (
                      <div
                        key={asset.id}
                        className={cn(
                          'grid grid-cols-[1fr_1fr_120px_120px_100px_80px] gap-2 px-4 py-3 items-center',
                          'hover:bg-slate-50 cursor-pointer transition-colors',
                          isOverdue ? 'border-l-[3px] border-l-red-500' : 'border-l-[3px] border-l-amber-500'
                        )}
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{asset.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">{asset.assetCode}</p>
                        </div>
                        <span className="text-sm text-slate-600">{asset.plantName}</span>
                        <span className="text-[11px] font-mono text-slate-600">
                          {format(new Date(asset.lastMaintenanceDate), 'MMM d, yyyy')}
                        </span>
                        <span className={cn('text-[11px] font-mono', isOverdue ? 'text-red-600 font-bold' : 'text-slate-600')}>
                          {format(new Date(asset.nextMaintenanceDate), 'MMM d, yyyy')}
                        </span>
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 w-fit',
                          isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        )}>
                          {isOverdue ? 'OVERDUE' : 'DUE SOON'}
                        </span>
                        <div className="flex justify-end">
                          <button
                            className="px-2 py-1 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              openScheduleModal(asset);
                            }}
                          >
                            Schedule
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Asset Detail Modal */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-3xl p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border-2 border-slate-300 bg-white">
                <Box className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-sm font-bold text-slate-700">
                  {selectedAsset?.name}
                </DialogTitle>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{selectedAsset?.assetCode}</p>
              </div>
              <span className={cn('px-2 py-1 text-[9px] font-bold uppercase', getStatusColor(selectedAsset?.status || 'offline'))}>
                {selectedAsset && getStatusLabel(selectedAsset.status)}
              </span>
            </div>
          </DialogHeader>
          {selectedAsset && (
            <div className="bg-white flex flex-col" style={{ height: '480px' }}>
              {/* Modal Tabs */}
              <div className="px-4 py-2 border-b border-slate-200 flex gap-1 flex-shrink-0">
                {(['overview', 'metrics', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setModalTab(tab)}
                    className={cn(
                      'px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                      modalTab === tab
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content - Fixed height with scroll */}
              <div className="flex-1 overflow-y-auto">
                {/* Overview Tab */}
                {modalTab === 'overview' && (
                  <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Category</p>
                        <p className="text-sm font-medium text-slate-700">{getCategoryLabel(selectedAsset.category)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Location</p>
                        <p className="text-sm font-medium text-slate-700">{selectedAsset.plantName}</p>
                        <p className="text-[10px] text-slate-500">{selectedAsset.location}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Manufacturer</p>
                        <p className="text-sm font-medium text-slate-700">{selectedAsset.manufacturer}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Model</p>
                        <p className="text-sm font-medium text-slate-700">{selectedAsset.model}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Serial Number</p>
                        <p className="text-sm font-mono text-slate-700">{selectedAsset.serialNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="border-2 border-slate-300 p-3 text-center">
                      <p className="text-[10px] uppercase text-slate-500 mb-1">Health Score</p>
                      <p className={cn('text-2xl font-bold', getHealthColor(selectedAsset.healthScore))} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                        {selectedAsset.healthScore}%
                      </p>
                    </div>
                    <div className="border-2 border-slate-300 p-3 text-center">
                      <p className="text-[10px] uppercase text-slate-500 mb-1">Operating Hours</p>
                      <p className="text-2xl font-bold text-slate-700" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                        {selectedAsset.operatingHours.toLocaleString()}
                      </p>
                    </div>
                    <div className="border-2 border-slate-300 p-3 text-center">
                      <p className="text-[10px] uppercase text-slate-500 mb-1">Warranty</p>
                      <p className={cn('text-lg font-bold', new Date(selectedAsset.warrantyExpiry) < new Date() ? 'text-red-600' : 'text-emerald-600')}>
                        {new Date(selectedAsset.warrantyExpiry) < new Date() ? 'Expired' : format(new Date(selectedAsset.warrantyExpiry), 'MMM yyyy')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Specifications</div>
                    <div className="border-2 border-slate-300">
                      {Object.entries(selectedAsset.specifications).map(([key, value], idx) => (
                        <div key={key} className={cn('flex justify-between text-sm px-3 py-2', idx !== 0 && 'border-t border-slate-200')}>
                          <span className="text-slate-500">{key}</span>
                          <span className="font-medium text-slate-700">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics Tab */}
              {modalTab === 'metrics' && (
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border-2 border-slate-300 p-4 text-center">
                      <Clock className="h-5 w-5 mx-auto mb-2 text-slate-500" />
                      <p className="text-[10px] uppercase text-slate-500">Runtime Today</p>
                      <p className="text-xl font-bold text-slate-700" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{selectedAsset.currentMetrics.runtime}h</p>
                    </div>
                    <div className="border-2 border-slate-300 p-4 text-center">
                      <Gauge className="h-5 w-5 mx-auto mb-2 text-slate-500" />
                      <p className="text-[10px] uppercase text-slate-500">Efficiency</p>
                      <p className="text-xl font-bold text-slate-700" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{selectedAsset.currentMetrics.efficiency}%</p>
                    </div>
                    {selectedAsset.currentMetrics.temperature && (
                      <div className="border-2 border-slate-300 p-4 text-center">
                        <Thermometer className="h-5 w-5 mx-auto mb-2 text-slate-500" />
                        <p className="text-[10px] uppercase text-slate-500">Temperature</p>
                        <p className="text-xl font-bold text-slate-700" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{selectedAsset.currentMetrics.temperature}°C</p>
                      </div>
                    )}
                    {selectedAsset.currentMetrics.powerConsumption && (
                      <div className="border-2 border-slate-300 p-4 text-center">
                        <Zap className="h-5 w-5 mx-auto mb-2 text-slate-500" />
                        <p className="text-[10px] uppercase text-slate-500">Power</p>
                        <p className="text-xl font-bold text-slate-700" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{selectedAsset.currentMetrics.powerConsumption} kW</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 text-center mt-4 font-mono">
                    Last updated: {format(new Date(selectedAsset.currentMetrics.lastUpdated), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}

              {/* History Tab */}
              {modalTab === 'history' && (
                <div className="border-t border-slate-200">
                  <div className="bg-slate-100 border-b-2 border-slate-300 grid grid-cols-[100px_80px_1fr_100px_80px_100px] gap-2 px-4 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Technician</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duration</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Cost</span>
                  </div>
                  <div className="divide-y divide-slate-200 max-h-[300px] overflow-y-auto">
                    {selectedAsset.maintenanceHistory.map((record) => (
                      <div key={record.id} className="grid grid-cols-[100px_80px_1fr_100px_80px_100px] gap-2 px-4 py-3 items-center">
                        <span className="text-[11px] font-mono text-slate-600">{format(new Date(record.date), 'MMM d, yyyy')}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 w-fit">{record.type}</span>
                        <span className="text-sm text-slate-600 truncate">{record.description}</span>
                        <span className="text-[11px] text-slate-600">{record.technician}</span>
                        <span className="text-[11px] font-mono text-slate-600">{record.duration}h</span>
                        <span className="text-[11px] font-mono text-slate-600 text-right">
                          {record.cost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-slate-100 border-t-2 border-slate-300 flex items-center justify-end gap-2 flex-shrink-0">
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Close
                </button>
                <button
                  onClick={() => {
                    if (selectedAsset) {
                      openScheduleModal(selectedAsset);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  Schedule Maintenance
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Maintenance Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={() => setScheduleModalOpen(false)}>
        <DialogContent className="max-w-lg p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border-2 border-slate-300 bg-white">
                <Calendar className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-sm font-bold text-slate-700">
                  Schedule Maintenance
                </DialogTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {scheduleAsset?.name} <span className="font-mono">({scheduleAsset?.assetCode})</span>
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Maintenance Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Maintenance Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={scheduleForm.type}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value as any })}
                    className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="preventive">Preventive</option>
                    <option value="corrective">Corrective</option>
                    <option value="inspection">Inspection</option>
                    <option value="calibration">Calibration</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={scheduleForm.priority}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, priority: e.target.value as any })}
                    className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Scheduled Date & Estimated Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduleForm.scheduledDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={scheduleForm.estimatedHours}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, estimatedHours: parseFloat(e.target.value) || 0 })}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>
            </div>

            {/* Assigned Technician */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Assign Technician
              </label>
              <div className="relative">
                <select
                  value={scheduleForm.assignedTechnician}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, assignedTechnician: e.target.value })}
                  className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                >
                  <option value="">Select technician...</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                rows={2}
                placeholder="Describe the maintenance work to be performed..."
                className="w-full px-3 py-2 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Additional Notes
              </label>
              <textarea
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                rows={2}
                placeholder="Any special instructions or safety considerations..."
                className="w-full px-3 py-2 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-slate-100 border-t-2 border-slate-300 flex items-center justify-end gap-2">
            <button
              onClick={() => setScheduleModalOpen(false)}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              onClick={handleScheduleMaintenance}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
