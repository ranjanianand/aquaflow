'use client';

import { useState, useEffect } from 'react';
import {
  mockEnergyKPIs,
  mockEquipmentEnergy,
  hourlyEnergyData,
  dailyEnergyData,
  mockSustainabilityMetrics,
  getTotalEnergyConsumed,
  getTotalEnergyCost,
  getTotalCarbonEmissions,
  getAverageSpecificEnergy,
  getAveragePowerFactor,
} from '@/data/mock-energy';
import { mockPlants } from '@/data/mock-plants';
import {
  Zap,
  DollarSign,
  Leaf,
  TrendingDown,
  TrendingUp,
  Gauge,
  Building2,
  Download,
  RefreshCw,
  TreePine,
  Droplets,
  Factory,
  BarChart3,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#0066ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function EnergyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [activeTab, setActiveTab] = useState('consumption');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const chartData = timeRange === '24h' ? hourlyEnergyData : dailyEnergyData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const equipmentPieData = mockEquipmentEnergy.map((eq) => ({
    name: eq.name.split(' ')[0],
    value: eq.percentageOfTotal,
    fullName: eq.name,
  }));

  const plantComparisonData = mockEnergyKPIs
    .filter((kpi) => kpi.totalEnergy > 0)
    .map((kpi) => ({
      name: kpi.plantName.replace(' WTP', '').replace('-0', ' '),
      specificEnergy: kpi.specificEnergy,
      powerFactor: kpi.averagePowerFactor,
      benchmark: 2.0,
    }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Energy Management</span>
          </div>
        </header>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-slate-200 border-2 border-slate-300" />
              ))}
            </div>
            <div className="h-80 bg-slate-200 border-2 border-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Energy Management</span>
          <span className="text-[10px] text-slate-400">Power monitoring & sustainability</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <Activity className="h-3 w-3" />
            LIVE DATA
          </span>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Plant Dropdown */}
            <div className="relative">
              <select
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                <option value="all">All Plants</option>
                {mockPlants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
            {/* Time Range Dropdown */}
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 px-3 flex items-center gap-1.5 text-[10px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button className="h-8 px-3 flex items-center gap-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Energy</span>
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-blue-600">{formatNumber(getTotalEnergyConsumed())}</span>
              <span className="text-[10px] text-slate-500">KWH</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-1">MTD</div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Energy Cost</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-600">{formatCurrency(getTotalEnergyCost())}</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-1">MTD</div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-amber-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Specific Energy</span>
              <Gauge className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-amber-600">{getAverageSpecificEnergy()}</span>
              <span className="text-[10px] text-slate-500">KWH/MÂ³</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Power Factor</span>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-purple-600">{getAveragePowerFactor()}</span>
              <span className="text-[10px] font-bold text-emerald-600">GOOD</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-teal-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">COâ‚‚ Emissions</span>
              <Leaf className="h-4 w-4 text-teal-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-teal-600">{(getTotalCarbonEmissions() / 1000).toFixed(1)}</span>
              <span className="text-[10px] text-slate-500">TONS</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-1">MTD</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1">
          {[
            { id: 'consumption', label: 'Consumption', icon: Zap },
            { id: 'equipment', label: 'Equipment', icon: Factory },
            { id: 'comparison', label: 'Plant Comparison', icon: Building2 },
            { id: 'sustainability', label: 'Sustainability', icon: Leaf },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                  activeTab === tab.id
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-slate-300'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}

        {/* Consumption Tab */}
        {activeTab === 'consumption' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Energy Trend Chart */}
              <div className="lg:col-span-2 border-2 border-slate-300 bg-white overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Energy Consumption Trend
                  </span>
                </div>
                <div className="p-4">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0066ff" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) =>
                            format(new Date(value), timeRange === '24h' ? 'HH:mm' : 'MMM d')
                          }
                          stroke="#94a3b8"
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '2px solid #cbd5e1',
                            borderRadius: '0',
                            fontSize: '11px',
                          }}
                          labelFormatter={(value) =>
                            format(new Date(value), 'MMM d, HH:mm')
                          }
                          formatter={(value: number) => [`${value} kWh`, 'Energy']}
                        />
                        <Area
                          type="monotone"
                          dataKey="energy"
                          stroke="#0066ff"
                          strokeWidth={2}
                          fill="url(#energyGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Cost Chart */}
              <div className="border-2 border-slate-300 bg-white overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Energy Cost Trend
                  </span>
                </div>
                <div className="p-4">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.slice(-12)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) =>
                            format(new Date(value), timeRange === '24h' ? 'HH' : 'd')
                          }
                          stroke="#94a3b8"
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '2px solid #cbd5e1',
                            borderRadius: '0',
                            fontSize: '11px',
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'Cost']}
                        />
                        <Bar dataKey="cost" fill="#10b981" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Equipment Distribution Pie */}
              <div className="border-2 border-slate-300 bg-white overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Energy Distribution
                  </span>
                </div>
                <div className="p-4">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={equipmentPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {equipmentPieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '2px solid #cbd5e1',
                            borderRadius: '0',
                            fontSize: '11px',
                          }}
                          formatter={(value: number, name: string, props: any) => [
                            `${value}%`,
                            props.payload.fullName,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 border-t border-slate-200 pt-3">
                    {equipmentPieData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2 text-[10px]">
                        <div
                          className="w-2.5 h-2.5"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate text-slate-600">{item.name}</span>
                        <span className="font-bold font-mono ml-auto">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Equipment List */}
              <div className="lg:col-span-2 border-2 border-slate-300 bg-white overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                  <Factory className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Equipment Energy Consumption
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {mockEquipmentEnergy.map((equipment) => (
                    <div
                      key={equipment.id}
                      className={cn(
                        'flex items-center gap-3 p-3 border-l-[3px]',
                        equipment.status === 'running' ? 'border-l-emerald-500 bg-emerald-50/30' :
                        equipment.status === 'standby' ? 'border-l-amber-500 bg-amber-50/30' :
                        'border-l-slate-400 bg-slate-50'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-semibold text-slate-700 truncate">{equipment.name}</span>
                          <span className={cn(
                            'text-[9px] font-bold uppercase px-1.5 py-0.5',
                            equipment.status === 'running' ? 'bg-emerald-100 text-emerald-700' :
                            equipment.status === 'standby' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-200 text-slate-600'
                          )}>
                            {equipment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-2">
                          <span className="font-mono">{equipment.currentPower}/{equipment.ratedPower} kW</span>
                          <span>â€¢</span>
                          <span className="font-mono">{formatNumber(equipment.energyConsumed)} kWh</span>
                          <span>â€¢</span>
                          <span className="font-mono">{equipment.runningHours}h</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 w-full">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${equipment.percentageOfTotal}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-slate-700">
                          {equipment.percentageOfTotal}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plant Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Radar Chart - Multi-dimensional Plant Comparison */}
              <div className="lg:col-span-2 border-2 border-slate-300 bg-white overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Plant Performance Radar
                    </span>
                  </div>
                  {/* Legend in header - using actual plant names from mock data */}
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-[#0066ff]" />
                      <span className="text-[11px] font-medium text-slate-700">{mockEnergyKPIs[0]?.plantName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-[#10b981]" />
                      <span className="text-[11px] font-medium text-slate-700">{mockEnergyKPIs[1]?.plantName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-[#f59e0b]" />
                      <span className="text-[11px] font-medium text-slate-700">{mockEnergyKPIs[2]?.plantName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 border-t-2 border-dashed border-slate-400" />
                      <span className="text-[11px] font-medium text-slate-500">Benchmark</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { metric: 'Specific Energy', plant1: 85, plant2: 72, plant3: 90, benchmark: 80 },
                        { metric: 'Power Factor', plant1: 92, plant2: 88, plant3: 95, benchmark: 90 },
                        { metric: 'Efficiency', plant1: 78, plant2: 82, plant3: 75, benchmark: 80 },
                        { metric: 'Uptime', plant1: 96, plant2: 94, plant3: 98, benchmark: 95 },
                        { metric: 'Cost Index', plant1: 70, plant2: 85, plant3: 65, benchmark: 75 },
                      ]}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar name={mockEnergyKPIs[0]?.plantName} dataKey="plant1" stroke="#0066ff" fill="#0066ff" fillOpacity={0.3} strokeWidth={2} />
                        <Radar name={mockEnergyKPIs[1]?.plantName} dataKey="plant2" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name={mockEnergyKPIs[2]?.plantName} dataKey="plant3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name="Benchmark" dataKey="benchmark" stroke="#94a3b8" fill="none" strokeDasharray="5 5" strokeWidth={1.5} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '2px solid #cbd5e1',
                            borderRadius: '0',
                            fontSize: '11px',
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Ranking Table */}
              <div className="border-2 border-slate-300 bg-white overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Efficiency Ranking
                  </span>
                </div>
                <div className="p-3">
                  {mockEnergyKPIs
                    .filter((kpi) => kpi.totalEnergy > 0)
                    .sort((a, b) => a.specificEnergy - b.specificEnergy)
                    .map((kpi, index) => (
                      <div
                        key={kpi.plantId}
                        className={cn(
                          'flex items-center gap-3 p-2.5 mb-2 last:mb-0',
                          index === 0 ? 'bg-emerald-50 border-l-[3px] border-l-emerald-500' :
                          index === 1 ? 'bg-blue-50 border-l-[3px] border-l-blue-500' :
                          'bg-slate-50 border-l-[3px] border-l-slate-300'
                        )}
                      >
                        <div className={cn(
                          'w-6 h-6 flex items-center justify-center text-[11px] font-bold',
                          index === 0 ? 'bg-emerald-500 text-white' :
                          index === 1 ? 'bg-blue-500 text-white' :
                          'bg-slate-300 text-slate-600'
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-slate-700 truncate">{kpi.plantName}</p>
                          <p className="text-[10px] text-slate-500">{kpi.specificEnergy} kWh/mÂ³</p>
                        </div>
                        <div className={cn(
                          'text-[10px] font-bold',
                          kpi.comparisonWithBenchmark < 0 ? 'text-emerald-600' : 'text-amber-600'
                        )}>
                          {kpi.comparisonWithBenchmark < 0 ? 'â†“' : 'â†‘'}{Math.abs(kpi.comparisonWithBenchmark)}%
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Plant KPI Cards with Gauge Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockEnergyKPIs
                .filter((kpi) => kpi.totalEnergy > 0)
                .map((kpi) => {
                  const efficiencyScore = Math.round(100 - (kpi.specificEnergy / 2.5) * 100);
                  return (
                    <div
                      key={kpi.plantId}
                      className={cn(
                        'border-2 border-slate-300 bg-white p-4 border-l-[3px]',
                        kpi.comparisonWithBenchmark < 0 ? 'border-l-emerald-500' : 'border-l-amber-500'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <span className="text-[12px] font-semibold text-slate-700">{kpi.plantName}</span>
                        </div>
                        {/* Mini Donut Gauge */}
                        <div className="relative w-10 h-10">
                          <svg className="w-10 h-10 -rotate-90">
                            <circle cx="20" cy="20" r="16" stroke="#e2e8f0" strokeWidth="4" fill="none" />
                            <circle
                              cx="20" cy="20" r="16"
                              stroke={efficiencyScore >= 80 ? '#10b981' : efficiencyScore >= 60 ? '#f59e0b' : '#ef4444'}
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${efficiencyScore * 1.005} 100.5`}
                              strokeLinecap="butt"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">
                            {efficiencyScore}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Energy</p>
                          <p className="text-sm font-bold font-mono text-slate-700">{formatNumber(kpi.totalEnergy)} <span className="text-[10px] font-normal">kWh</span></p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Cost</p>
                          <p className="text-sm font-bold font-mono text-slate-700">{formatCurrency(kpi.energyCost)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Specific Energy</p>
                          <p className="text-sm font-bold font-mono text-slate-700">{kpi.specificEnergy} <span className="text-[10px] font-normal">kWh/mÂ³</span></p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Power Factor</p>
                          <p className="text-sm font-bold font-mono text-slate-700">{kpi.averagePowerFactor}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Sustainability Tab */}
        {activeTab === 'sustainability' && (
          <div className="space-y-4">
            {/* Sustainability KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Carbon Footprint</span>
                  <Leaf className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-emerald-600">
                    {mockSustainabilityMetrics.carbonFootprint.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500">TONS COâ‚‚/MO</span>
                </div>
              </div>

              <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-green-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Trees Equivalent</span>
                  <TreePine className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-green-600">
                    {formatNumber(mockSustainabilityMetrics.treesEquivalent)}
                  </span>
                  <span className="text-[10px] text-slate-500">TO OFFSET</span>
                </div>
              </div>

              <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Water Recycled</span>
                  <Droplets className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-blue-600">
                    {formatNumber(mockSustainabilityMetrics.waterRecycled)}
                  </span>
                  <span className="text-[10px] text-slate-500">MÂ³/MO</span>
                </div>
              </div>

              <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-amber-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Renewable %</span>
                  <Zap className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-amber-600">
                    {mockSustainabilityMetrics.renewablePercentage}%
                  </span>
                  <span className="text-[10px] text-slate-500">OF TOTAL</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Circular Gauges for Goals */}
              <div className="border-2 border-slate-300 bg-white overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Goal Achievement
                  </span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Chemical Reduction Gauge */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="6" fill="none" />
                          <circle
                            cx="32" cy="32" r="28"
                            stroke="#10b981"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${mockSustainabilityMetrics.chemicalReduction * 10 * 1.76} 176`}
                            strokeLinecap="butt"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-slate-700">
                          {mockSustainabilityMetrics.chemicalReduction * 10}%
                        </span>
                      </div>
                      <p className="text-[9px] font-bold uppercase text-slate-500">Chemical</p>
                      <p className="text-[8px] text-slate-400">Target: 10%</p>
                    </div>

                    {/* Waste Reduction Gauge */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="6" fill="none" />
                          <circle
                            cx="32" cy="32" r="28"
                            stroke="#0066ff"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${mockSustainabilityMetrics.wasteReduction * 5 * 1.76} 176`}
                            strokeLinecap="butt"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-slate-700">
                          {mockSustainabilityMetrics.wasteReduction * 5}%
                        </span>
                      </div>
                      <p className="text-[9px] font-bold uppercase text-slate-500">Waste</p>
                      <p className="text-[8px] text-slate-400">Target: 20%</p>
                    </div>

                    {/* Renewable Energy Gauge */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="6" fill="none" />
                          <circle
                            cx="32" cy="32" r="28"
                            stroke="#f59e0b"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${mockSustainabilityMetrics.renewablePercentage * 2 * 1.76} 176`}
                            strokeLinecap="butt"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-slate-700">
                          {mockSustainabilityMetrics.renewablePercentage * 2}%
                        </span>
                      </div>
                      <p className="text-[9px] font-bold uppercase text-slate-500">Renewable</p>
                      <p className="text-[8px] text-slate-400">Target: 50%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sustainability Trend Chart */}
              <div className="lg:col-span-2 border-2 border-slate-300 bg-white overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Emissions Trend (12 Months)
                  </span>
                </div>
                <div className="p-4">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { month: 'Jan', emissions: 48, renewable: 12, target: 40 },
                        { month: 'Feb', emissions: 46, renewable: 14, target: 40 },
                        { month: 'Mar', emissions: 45, renewable: 15, target: 40 },
                        { month: 'Apr', emissions: 44, renewable: 16, target: 40 },
                        { month: 'May', emissions: 42, renewable: 18, target: 40 },
                        { month: 'Jun', emissions: 43, renewable: 17, target: 40 },
                        { month: 'Jul', emissions: 41, renewable: 19, target: 40 },
                        { month: 'Aug', emissions: 40, renewable: 20, target: 40 },
                        { month: 'Sep', emissions: 39, renewable: 21, target: 40 },
                        { month: 'Oct', emissions: 38, renewable: 22, target: 40 },
                        { month: 'Nov', emissions: 37, renewable: 23, target: 40 },
                        { month: 'Dec', emissions: 36, renewable: 24, target: 40 },
                      ]}>
                        <defs>
                          <linearGradient id="emissionsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="renewableGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '2px solid #cbd5e1',
                            borderRadius: '0',
                            fontSize: '11px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Area type="monotone" dataKey="emissions" name="COâ‚‚ Emissions" stroke="#ef4444" strokeWidth={2} fill="url(#emissionsGradient)" />
                        <Area type="monotone" dataKey="renewable" name="Renewable %" stroke="#10b981" strokeWidth={2} fill="url(#renewableGradient)" />
                        <Line type="monotone" dataKey="target" name="Target" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* ESG Summary with Score Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* ESG Score Card */}
              <div className="border-2 border-emerald-400 bg-gradient-to-br from-emerald-600 to-teal-600 overflow-hidden">
                <div className="p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-2">ESG Score</p>
                  <p className="text-5xl font-bold font-mono text-white mb-1">B+</p>
                  <p className="text-[10px] text-white/70">Above Average</p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="lg:col-span-3 border-2 border-slate-300 bg-white overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    ESG Score Breakdown
                  </span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-4">
                  {/* Environmental */}
                  <div className="text-center p-3 bg-emerald-50 border-l-[3px] border-l-emerald-500">
                    <Leaf className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                    <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">Environmental</p>
                    <p className="text-2xl font-bold font-mono text-emerald-600">78</p>
                    <p className="text-[9px] text-slate-500">/ 100</p>
                  </div>

                  {/* Social */}
                  <div className="text-center p-3 bg-blue-50 border-l-[3px] border-l-blue-500">
                    <Building2 className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                    <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">Social</p>
                    <p className="text-2xl font-bold font-mono text-blue-600">82</p>
                    <p className="text-[9px] text-slate-500">/ 100</p>
                  </div>

                  {/* Governance */}
                  <div className="text-center p-3 bg-purple-50 border-l-[3px] border-l-purple-500">
                    <Gauge className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                    <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">Governance</p>
                    <p className="text-2xl font-bold font-mono text-purple-600">85</p>
                    <p className="text-[9px] text-slate-500">/ 100</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
